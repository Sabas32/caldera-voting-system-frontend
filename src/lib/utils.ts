import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string, maxLetters = 2) {
  const normalized = name.trim();
  if (!normalized) {
    return "NA";
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, maxLetters).toUpperCase();
  }

  return parts
    .slice(0, maxLetters)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
