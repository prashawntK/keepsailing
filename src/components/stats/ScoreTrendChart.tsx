"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { useTheme } from "@/components/providers/ThemeProvider";

interface ScoreTrendChartProps {
  data: Array<{ date: string; score: number }>;
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const gridColor     = isLight ? "#E2E8F0" : "#1f2937";
  const tickColor     = isLight ? "#64748B" : "#6b7280";
  const tooltipBg     = isLight ? "#FFFFFF"  : "#111827";
  const tooltipBorder = isLight ? "#E2E8F0" : "#374151";
  const tooltipLabel  = isLight ? "#64748B" : "#9ca3af";
  const refLineColor  = isLight ? "#CBD5E1" : "#374151";
  const refLabelColor = isLight ? "#64748B" : "#6b7280";

  const formatted = data.map((d) => ({
    ...d,
    label: format(new Date(d.date + "T00:00:00"), "MMM d"),
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="label"
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: tickColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
            labelStyle={{ color: tooltipLabel }}
            itemStyle={{ color: "#F97316" }}
          />
          <ReferenceLine y={70} stroke={refLineColor} strokeDasharray="4 4" label={{ value: "70", fill: refLabelColor, fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#F97316"
            strokeWidth={2}
            dot={{ fill: "#F97316", r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
