"use client";

import { useEffect, useState } from "react";
import { formatHours } from "@/lib/utils";

interface StepData {
  name: string;
  hours: number;
}

interface StepBreakdownCardProps {
  goalId: string;
  goalName: string;
  goalEmoji: string;
  period: string;
}

export function StepBreakdownCard({ goalId, goalName, goalEmoji, period }: StepBreakdownCardProps) {
  const [data, setData] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats/charts?type=hours_by_step&goalId=${goalId}&period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [goalId, period]);

  if (loading || data.length === 0) return null;

  const maxHours = Math.max(...data.map((d) => d.hours), 0.01);
  const totalHours = data.reduce((sum, d) => sum + d.hours, 0);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">
          {goalEmoji} {goalName}
        </h3>
        <span className="text-xs text-gray-500">{formatHours(totalHours)} total</span>
      </div>
      <div className="space-y-2.5">
        {data.map((step) => (
          <div key={step.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 truncate mr-2">{step.name}</span>
              <span className="text-gray-500 flex-shrink-0">{formatHours(step.hours)}</span>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(step.hours / maxHours) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
