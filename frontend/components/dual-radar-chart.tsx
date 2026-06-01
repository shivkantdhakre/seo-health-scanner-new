"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CompetitorScores } from "@/lib/types";

interface DualRadarChartProps {
  mainScores: CompetitorScores;
  competitorScores: CompetitorScores;
  mainLabel: string;
  competitorLabel: string;
  isExportMode?: boolean;
}

const CHART_DATA_KEYS = [
  { key: "performance", label: "Performance" },
  { key: "accessibility", label: "Accessibility" },
  { key: "bestPractices", label: "Best Practices" },
  { key: "seo", label: "SEO" },
];

export function DualRadarChart({
  mainScores,
  competitorScores,
  mainLabel,
  competitorLabel,
  isExportMode = false,
}: DualRadarChartProps) {
  const data = CHART_DATA_KEYS.map(({ key, label }) => ({
    category: label,
    main: mainScores[key as keyof CompetitorScores],
    competitor: competitorScores[key as keyof CompetitorScores],
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 13, fontWeight: 700, fill: "#111" }}
          />
          <Radar
            name={mainLabel}
            dataKey="main"
            stroke="#00C853"
            fill="#00C853"
            fillOpacity={0.55}
            strokeWidth={2}
            isAnimationActive={!isExportMode}
          />
          <Radar
            name={competitorLabel}
            dataKey="competitor"
            stroke="#FF5757"
            fill="#FF5757"
            fillOpacity={0.25}
            strokeWidth={2}
            strokeDasharray="6 3"
            isAnimationActive={!isExportMode}
          />
          <Legend
            iconType="square"
            wrapperStyle={{ paddingTop: "12px", fontWeight: 700, fontSize: 13 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
