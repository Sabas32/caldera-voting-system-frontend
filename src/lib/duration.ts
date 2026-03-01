export type DurationParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

export function secondsToDurationParts(totalSeconds: number): DurationParts {
  const normalizedSeconds = Number.isFinite(Number(totalSeconds)) ? Number(totalSeconds) : 0;
  const clamped = Math.max(0, Math.floor(normalizedSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  return { hours, minutes, seconds };
}

export function durationPartsToSeconds(parts: DurationParts): number {
  const hours = Math.max(0, Math.floor(parts.hours));
  const minutes = Math.max(0, Math.min(59, Math.floor(parts.minutes)));
  const seconds = Math.max(0, Math.min(59, Math.floor(parts.seconds)));
  return hours * 3600 + minutes * 60 + seconds;
}
