"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Camera, ImageUp, KeyRound, QrCode, SquareX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/apiClient";
import { applyPrimaryColorOverride } from "@/lib/brandTheme";
import { endpoints } from "@/lib/endpoints";
import {
  setVoterAutoLogoutSecondsForElection,
  setVoterOrganizationNameForElection,
  setVoterPrimaryColorForElection,
  setVoterResultsWindowForElection,
} from "@/lib/voterAutoLogout";

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function extractTokenFromScan(rawValue: string): string {
  const raw = rawValue.trim();
  if (!raw) {
    return "";
  }

  try {
    const parsedUrl = new URL(raw);
    for (const key of ["token", "t", "code"]) {
      const paramValue = parsedUrl.searchParams.get(key)?.trim();
      if (paramValue) {
        return paramValue;
      }
    }
  } catch {
    return raw;
  }

  return raw;
}

export default function VoteTokenPage() {
  const [token, setToken] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerMode, setScannerMode] = useState<"native" | "compatibility">("native");
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const scanBusyRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (submittedToken: string) =>
      apiClient<{
        data: {
          election_slug: string;
          organization_name: string;
          status: string;
          post_vote_access_mode: string;
          primary_color_override: string | null;
          voter_auto_logout_seconds: number;
          voter_results_view_from: string | null;
          voter_results_view_until: string | null;
        };
      }>(endpoints.vote.tokenLogin, {
        method: "POST",
        body: JSON.stringify({ token: submittedToken.trim().toUpperCase() }),
      }),
    onSuccess: (response) => {
      const payload = response.data;
      setVoterAutoLogoutSecondsForElection(payload.election_slug, payload.voter_auto_logout_seconds);
      setVoterResultsWindowForElection(payload.election_slug, payload.voter_results_view_until);
      setVoterPrimaryColorForElection(payload.election_slug, payload.primary_color_override);
      setVoterOrganizationNameForElection(payload.election_slug, payload.organization_name);
      applyPrimaryColorOverride(payload.primary_color_override);
      if (payload.status === "USED" && payload.post_vote_access_mode === "READ_ONLY_AFTER_VOTE") {
        router.push(`/e/${payload.election_slug}/status`);
        return;
      }
      router.push(`/e/${payload.election_slug}/ballot`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Token verification failed");
    },
  });

  function stopScanner() {
    if (scanIntervalRef.current !== null) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    scanBusyRef.current = false;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScannerOpen(false);
  }

  async function detectTokenFromFrame() {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return "";
    }

    if (detectorRef.current) {
      const barcodes = await detectorRef.current.detect(video);
      const rawValue = barcodes.find((item) => typeof item.rawValue === "string" && item.rawValue.trim())?.rawValue ?? "";
      return rawValue;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return "";
    }
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return "";
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
    return result?.data ?? "";
  }

  async function startScanner() {
    setScannerError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerError("Camera access is unavailable. Use QR image upload below.");
      return;
    }
    if (!window.isSecureContext) {
      setScannerError("Camera requires HTTPS or localhost. Open this app on a secure origin.");
      return;
    }

    stopScanner();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("Camera preview is not ready.");
      }

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      const Detector = window.BarcodeDetector;
      if (Detector) {
        detectorRef.current = new Detector({ formats: ["qr_code"] });
        setScannerMode("native");
      } else {
        detectorRef.current = null;
        setScannerMode("compatibility");
      }

      setScannerOpen(true);

      scanIntervalRef.current = window.setInterval(async () => {
        if (mutation.isPending || scanBusyRef.current) {
          return;
        }
        scanBusyRef.current = true;

        try {
          const rawValue = await detectTokenFromFrame();
          if (!rawValue) {
            return;
          }

          const scannedToken = extractTokenFromScan(rawValue).toUpperCase();
          if (!scannedToken) {
            return;
          }

          setToken(scannedToken);
          toast.success("QR token scanned. Signing in...");
          stopScanner();
          mutation.mutate(scannedToken);
        } catch {
          // Keep polling; intermittent detector errors can happen between frames.
        } finally {
          scanBusyRef.current = false;
        }
      }, 350);
    } catch (error) {
      stopScanner();
      const message = error instanceof Error ? error.message : "Failed to start camera scanner.";
      setScannerError(message);
    }
  }

  async function handleQrImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setScannerError("");

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Scanner canvas is not ready.");
      }
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        throw new Error("Unable to read image for QR scan.");
      }

      if (typeof window.createImageBitmap === "function") {
        const bitmap = await createImageBitmap(file);
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
        bitmap.close();
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Unable to read selected image."));
          reader.readAsDataURL(file);
        });
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Unsupported image format."));
          img.src = dataUrl;
        });

        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      }

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

      if (!result?.data) {
        throw new Error("No QR code found in the selected image.");
      }

      const scannedToken = extractTokenFromScan(result.data).toUpperCase();
      if (!scannedToken) {
        throw new Error("The scanned QR code does not contain a valid token.");
      }

      setToken(scannedToken);
      toast.success("QR image decoded. Signing in...");
      mutation.mutate(scannedToken);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to read QR image.";
      setScannerError(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-12 h-28 bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_34%,transparent),transparent_70%)]" />
        <div className="relative grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <p className="tiny uppercase tracking-[0.12em] text-[var(--muted-text)]">Token only voting</p>
            <h1 className="h2 mt-1">Access your ballot</h1>
            <p className="small mt-2 text-[var(--muted-text)]">Enter your token exactly as issued. Tokens are single-use unless election settings allow status-only re-entry.</p>

            <div className="mt-5 space-y-2">
              <label className="small inline-flex items-center gap-2 text-[var(--text)]">
                <KeyRound className="size-4 text-[var(--primary-700)]" />
                Voting token
              </label>
              <Input value={token} onChange={(event) => setToken(event.target.value)} placeholder="e.g. DEMO0001" autoComplete="off" />
            </div>

            <Button className="mt-4 w-full md:w-auto" onClick={() => mutation.mutate(token)} disabled={mutation.isPending || token.trim().length < 4}>
              {mutation.isPending ? "Verifying..." : "Continue to ballot"}
            </Button>
          </div>

          <div className="rounded-[14px] border border-dashed border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_72%,var(--surface-2))] p-4">
            <div className="mb-2 flex items-center gap-2 text-[var(--text)]">
              <QrCode className="size-4" />
              <p className="small font-medium">QR login (optional)</p>
            </div>
            <p className="small text-[var(--muted-text)]">Scan a token QR code to auto-fill and sign in instantly.</p>
            <div className="mt-3 space-y-3">
              <canvas ref={canvasRef} className="hidden" aria-hidden />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrImageUpload} />
              <div className="overflow-hidden rounded-[12px] border border-[var(--edge)] bg-black/10">
                <video ref={videoRef} className={`aspect-video w-full object-cover ${scannerOpen ? "block" : "hidden"}`} muted />
                {!scannerOpen ? (
                  <div className="flex aspect-video items-center justify-center px-4 text-center">
                    <p className="small text-[var(--muted-text)]">Camera preview will appear here after you start scan.</p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" onClick={startScanner} disabled={mutation.isPending}>
                  <Camera className="size-4" />
                  {scannerOpen ? "Restart scan" : "Start QR scan"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={mutation.isPending}
                >
                  <ImageUp className="size-4" />
                  Upload QR image
                </Button>
                {scannerOpen ? (
                  <Button type="button" size="sm" variant="ghost" onClick={stopScanner}>
                    <SquareX className="size-4" />
                    Stop camera
                  </Button>
                ) : null}
              </div>
              {scannerOpen ? (
                <p className="tiny text-[var(--muted-text)]">
                  {scannerMode === "native" ? "Using native browser scanner." : "Using compatibility scanner for this browser."}
                </p>
              ) : null}
              {scannerError ? <p className="tiny text-[var(--danger)]">{scannerError}</p> : null}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
