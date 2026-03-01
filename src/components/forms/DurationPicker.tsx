import { durationPartsToSeconds, secondsToDurationParts } from "@/lib/duration";
import { Select } from "@/components/ui/select";

type DurationPickerProps = {
  totalSeconds: number;
  onChange: (nextTotalSeconds: number) => void;
  minSeconds?: number;
  maxSeconds?: number;
};

export function DurationPicker({
  totalSeconds,
  onChange,
  minSeconds = 30,
  maxSeconds = 86400,
}: DurationPickerProps) {
  const parts = secondsToDurationParts(totalSeconds);

  const apply = (next: { hours?: number; minutes?: number; seconds?: number }) => {
    const rawSeconds = durationPartsToSeconds({
      hours: next.hours ?? parts.hours,
      minutes: next.minutes ?? parts.minutes,
      seconds: next.seconds ?? parts.seconds,
    });
    const clamped = Math.max(minSeconds, Math.min(maxSeconds, rawSeconds));
    onChange(clamped);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1">
        <label className="small text-[var(--muted-text)]">Hours</label>
        <Select
          value={String(parts.hours)}
          onChange={(event) => apply({ hours: Number(event.target.value) })}
        >
          {Array.from({ length: 25 }).map((_, hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label className="small text-[var(--muted-text)]">Minutes</label>
        <Select
          value={String(parts.minutes)}
          onChange={(event) => apply({ minutes: Number(event.target.value) })}
        >
          {Array.from({ length: 60 }).map((_, minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <label className="small text-[var(--muted-text)]">Seconds</label>
        <Select
          value={String(parts.seconds)}
          onChange={(event) => apply({ seconds: Number(event.target.value) })}
        >
          {Array.from({ length: 60 }).map((_, second) => (
            <option key={second} value={second}>
              {second}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
