"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ResultsBarChart({
  data,
}: {
  data: Array<{ name: string; votes: number }>;
}) {
  return (
    <div className="h-72 w-full rounded-[14px] border border-[var(--edge)] bg-[color-mix(in_oklab,var(--surface)_74%,var(--surface-2))] p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="resultsGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
              <stop offset="100%" stopColor="var(--primary-700)" stopOpacity={0.82} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="color-mix(in oklab, var(--border) 65%, transparent)" horizontal={true} vertical={false} strokeDasharray="4 4" />
          <XAxis type="number" tick={{ fill: "var(--muted-text)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fill: "var(--muted-text)", fontSize: 12 }} axisLine={false} tickLine={false} width={150} />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--primary) 16%, transparent)" }}
            contentStyle={{
              background: "color-mix(in oklab, var(--surface) 88%, var(--surface-2))",
              border: "1px solid var(--edge)",
              borderRadius: "12px",
              boxShadow: "0 12px 26px var(--shadow)",
            }}
          />
          <Bar dataKey="votes" fill="url(#resultsGradient)" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
