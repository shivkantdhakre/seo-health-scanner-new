"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SeoRadarChartProps {
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="bg-white font-bold text-sm px-3 py-2"
        style={{
          border: "var(--neo-border-width, 4px) solid var(--neo-border-color, #000)",
          boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
          borderRadius: 0,
        }}
      >
        <span>{payload[0].payload.subject}: </span>
        <span className="text-[#FF5757]">{payload[0].value}</span>
        <span className="text-gray-500">/100</span>
      </div>
    );
  }
  return null;
};

export function SeoRadarChart({ scores }: SeoRadarChartProps) {
  const isExportMode = typeof window !== "undefined" && window.location.search.includes("export=true");

  const data = [
    { subject: "Performance", A: scores.performance, fullMark: 100 },
    { subject: "Accessibility", A: scores.accessibility, fullMark: 100 },
    { subject: "Best Practices", A: scores.bestPractices, fullMark: 100 },
    { subject: "SEO", A: scores.seo, fullMark: 100 },
  ];

  return (
    <div
      className="bg-white p-4"
      style={{
        border: "var(--neo-border-width, 4px) solid var(--neo-border-color, #000)",
        boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
        height: "280px",
        width: "100%",
      }}
    >
      <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2 text-center">
        Health Radar
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart cx="50%" cy="50%" outerRadius="72%" data={data}>
          <PolarGrid stroke="#000" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#000", fontWeight: "bold", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Score"
            dataKey="A"
            stroke="#000"
            strokeWidth={4}
            fill="var(--neo-accent-color, #FFDE59)"
            fillOpacity={0.75}
            isAnimationActive={!isExportMode}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
