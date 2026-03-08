"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

interface ProgressRingProps {
  percentage: number;   // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  color = "#F97316",
  trackColor,
  children,
}: ProgressRingProps) {
  const { theme } = useTheme();
  const resolvedTrackColor = trackColor ?? (theme === "light" ? "#E2E8F0" : "#1f2937");

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={resolvedTrackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out, stroke 0.3s ease" }}
        />
        {/* Overachiever pulse ring */}
        {percentage >= 100 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray={circumference}
            strokeDashoffset={0}
            opacity={0.3}
            style={{ animation: "pulse 2s ease-in-out infinite" }}
          />
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
