const DEFAULT_PRIMARY = "#F5C84B";

type RGB = { r: number; g: number; b: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex: string): RGB {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : value;
  const intValue = Number.parseInt(normalized, 16);
  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b]
    .map((part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixRgb(base: RGB, target: RGB, amount: number): RGB {
  const ratio = clamp(amount, 0, 1);
  return {
    r: base.r + (target.r - base.r) * ratio,
    g: base.g + (target.g - base.g) * ratio,
    b: base.b + (target.b - base.b) * ratio,
  };
}

function relativeLuminance({ r, g, b }: RGB) {
  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  const rr = transform(r);
  const gg = transform(g);
  const bb = transform(b);
  return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
}

export function normalizeHexColor(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const validHex = /^#?([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  if (!validHex.test(trimmed)) {
    return null;
  }
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const rgb = hexToRgb(withHash);
  return rgbToHex(rgb);
}

function buildPrimaryPalette(primaryHex: string) {
  const primaryRgb = hexToRgb(primaryHex);
  const primary600 = rgbToHex(mixRgb(primaryRgb, { r: 0, g: 0, b: 0 }, 0.08));
  const primary700 = rgbToHex(mixRgb(primaryRgb, { r: 0, g: 0, b: 0 }, 0.16));
  const onPrimary = relativeLuminance(primaryRgb) > 0.58 ? "#111318" : "#F8FAFC";
  const ring = `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.45)`;

  return {
    primary: primaryHex,
    primary600,
    primary700,
    onPrimary,
    ring,
  };
}

export function clearPrimaryColorOverride() {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement.style;
  root.removeProperty("--primary");
  root.removeProperty("--primary-600");
  root.removeProperty("--primary-700");
  root.removeProperty("--on-primary");
  root.removeProperty("--ring");
}

export function applyPrimaryColorOverride(override?: string | null) {
  if (typeof document === "undefined") {
    return false;
  }

  const normalized = normalizeHexColor(override);
  if (!normalized) {
    clearPrimaryColorOverride();
    return false;
  }

  const palette = buildPrimaryPalette(normalized);
  const root = document.documentElement.style;
  root.setProperty("--primary", palette.primary);
  root.setProperty("--primary-600", palette.primary600);
  root.setProperty("--primary-700", palette.primary700);
  root.setProperty("--on-primary", palette.onPrimary);
  root.setProperty("--ring", palette.ring);
  return true;
}

export function getPrimaryColorVariables(override?: string | null): Record<string, string> | null {
  const normalized = normalizeHexColor(override);
  if (!normalized) {
    return null;
  }
  const palette = buildPrimaryPalette(normalized);
  return {
    "--primary": palette.primary,
    "--primary-600": palette.primary600,
    "--primary-700": palette.primary700,
    "--on-primary": palette.onPrimary,
    "--ring": palette.ring,
  };
}

export function getDefaultPrimaryColor() {
  return DEFAULT_PRIMARY;
}
