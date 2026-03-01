"use client";

import { format, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TurnoutChart({
  data,
}: {
  data: Array<{ day: string; count: number }>;
}) {
  const formatHourLabel = (value: string) => {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return format(parsed, "HH:mm");
  };

  const formatTooltipLabel = (value: string) => {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return format(parsed, "PPP HH:mm");
  };

  return (
    <div className="h-72 w-full rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 6, right: 6, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="turnoutGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.98} />
              <stop offset="100%" stopColor="var(--primary-700)" stopOpacity={0.78} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="color-mix(in oklab, var(--border) 65%, transparent)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "var(--muted-text)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatHourLabel}
            minTickGap={24}
          />
          <YAxis tick={{ fill: "var(--muted-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--primary) 16%, transparent)" }}
            labelFormatter={(value) => formatTooltipLabel(String(value))}
            contentStyle={{
              background: "color-mix(in oklab, var(--surface) 88%, var(--surface-2))",
              border: "1px solid var(--edge)",
              borderRadius: "12px",
              boxShadow: "0 12px 26px var(--shadow)",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: "var(--surface)", stroke: "var(--primary)" }}
            activeDot={{ r: 6, strokeWidth: 2, fill: "var(--primary)", stroke: "var(--surface)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
