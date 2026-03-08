"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CATEGORY_HEX } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const tooltipBg     = isLight ? "#FFFFFF"  : "#111827";
  const tooltipBorder = isLight ? "#E2E8F0" : "#374151";
  const legendColor   = isLight ? "#64748B" : "#9ca3af";

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
        No data yet
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={CATEGORY_HEX[entry.name] ?? "#6b7280"}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 8 }}
            formatter={(value: number | undefined) => [value != null ? `${value.toFixed(1)}h` : "0h", ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: legendColor }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
