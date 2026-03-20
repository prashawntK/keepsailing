"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";

interface WeeklyActivityChartProps {
  scores: Array<{ date: string; score: number }>;
}

export function WeeklyActivityChart({ scores }: WeeklyActivityChartProps) {
  const { theme } = useTheme();
  const isLight = theme === "lucid-light";
  const tooltipBg = isLight ? "#FFFFFF" : "#111827";
  const tooltipBorder = isLight ? "#E2E8F0" : "#374151";
  const axisColor = isLight ? "#94A3B8" : "#6B7280";
  const gridColor = isLight ? "#F1F5F9" : "#1F2937";

  const data = useMemo(() => {
    const days = [
      { name: "Mon", value: 0, count: 0 },
      { name: "Tue", value: 0, count: 0 },
      { name: "Wed", value: 0, count: 0 },
      { name: "Thu", value: 0, count: 0 },
      { name: "Fri", value: 0, count: 0 },
      { name: "Sat", value: 0, count: 0 },
      { name: "Sun", value: 0, count: 0 },
    ];

    const recentScores = [...scores].reverse().slice(0, 28);
    
    recentScores.forEach(item => {
      if (!item.score || item.score === 0) return;
      const date = new Date(item.date);
      const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
      days[dayIndex].value += item.score;
      days[dayIndex].count += 1;
    });

    return days.map(d => ({
      name: d.name,
      score: d.count > 0 ? Math.round(d.value / d.count) : 0
    }));
  }, [scores]);

  const maxScore = Math.max(...data.map(d => d.score), 1); // Avoid 0 max

  return (
    <div className="h-48 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: axisColor, fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: axisColor, fontSize: 11 }}
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip
            cursor={{ fill: isLight ? "#F8FAFC" : "#1F2937" }}
            contentStyle={{ 
              background: tooltipBg, 
              border: `1px solid ${tooltipBorder}`, 
              borderRadius: 8
            }}
            formatter={(value: number | undefined) => [`${value ?? 0} pts`, "Avg Score"]}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.score === maxScore ? "var(--color-primary)" : "var(--color-primary-light)"} 
                opacity={entry.score === maxScore ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
