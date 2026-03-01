"use client";

const CANDIDATE_IMAGE_STORAGE_KEY = "caldera:candidate-local-images";

type CandidateImageMap = Record<string, string>;

function readImageMap(): CandidateImageMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(CANDIDATE_IMAGE_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as CandidateImageMap;
  } catch {
    return {};
  }
}

function writeImageMap(value: CandidateImageMap) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CANDIDATE_IMAGE_STORAGE_KEY, JSON.stringify(value));
}

export function setCandidateLocalImage(candidateId: string, dataUrl: string) {
  const imageMap = readImageMap();
  imageMap[candidateId] = dataUrl;
  writeImageMap(imageMap);
}

export function getCandidateLocalImage(candidateId: string) {
  const imageMap = readImageMap();
  return imageMap[candidateId] ?? "";
}

export function getCandidateLocalImageMap() {
  return readImageMap();
}
