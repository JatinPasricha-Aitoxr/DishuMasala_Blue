"use client";

import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/**
 * The 30-day revenue sparkline (CLAUDE.md §2 / PROMPTS.md Phase 7 item 3: "recharts (already a
 * dependency)"). Takes rupees, not paise — the parent (app/admin/page.tsx) converts once, at the
 * edge, via formatINR-adjacent arithmetic; this component never formats money itself beyond the
 * tooltip's plain rupee display, and never recomputes a total.
 */
export function RevenueSparkline({ points }: { points: Array<{ date: string; revenue: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brew-2)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-brew-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => d.slice(5)}
          tick={{ fontSize: 11, fill: "var(--color-ink-3)" }}
          axisLine={{ stroke: "var(--color-line)" }}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: "var(--color-ink-3)" }} axisLine={false} tickLine={false} width={44} />
        <Tooltip
          formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
          labelFormatter={(d) => String(d)}
          contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 8, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="revenue" stroke="var(--color-brew-2)" strokeWidth={2} fill="url(#revenue-fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
