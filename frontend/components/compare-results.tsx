"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { ScoreComparisonTable } from "./score-comparison-table";
import type { Scan, CompetitorScores, ComparisonInsights } from "@/lib/types";

// Lazy-load the chart — never SSR
const DualRadarChart = dynamic(
  () => import("./dual-radar-chart").then((m) => ({ default: m.DualRadarChart })),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse bg-gray-100 rounded-lg" /> }
);

interface CompareResultsProps {
  scan: Scan;
}

function getWinnerBanner(winner: "main" | "competitor" | "tie") {
  if (winner === "main")
    return { bg: "bg-green-100 border-green-500", icon: "🏆", text: "Your Site Wins!", color: "text-green-800" };
  if (winner === "competitor")
    return { bg: "bg-red-100 border-red-500", icon: "⚠️", text: "Competitor Wins!", color: "text-red-800" };
  return { bg: "bg-yellow-100 border-yellow-500", icon: "🤝", text: "It's a Tie!", color: "text-yellow-800" };
}

// Build CompetitorScores from the report's primary URL scores
function buildMainScores(scan: Scan): CompetitorScores | null {
  if (!scan.report) return null;
  return {
    performance: scan.report.performanceScore,
    accessibility: scan.report.accessibilityScore,
    bestPractices: scan.report.bestPracticesScore,
    seo: scan.report.seoScore,
  };
}

export function CompareResults({ scan }: CompareResultsProps) {
  const mainScores = buildMainScores(scan);
  const competitorScores = scan.competitorData;
  const insights = scan.comparisonInsights;

  if (!mainScores || !competitorScores || !insights) {
    return (
      <div className="neo-card bg-red-50 text-center p-8">
        <p className="font-bold text-red-700">
          Comparison data is incomplete. Please try running the scan again.
        </p>
      </div>
    );
  }

  const mainUrl = scan.url;
  const competitorUrl = scan.competitorUrl ?? "Competitor";
  const banner = getWinnerBanner(insights.winner);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* HEADER */}
      <div className="neo-card bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
              Side-by-Side Analysis
            </p>
            <h1 className="text-3xl font-black">
              <span className="text-green-700">{new URL(mainUrl.startsWith("http") ? mainUrl : `https://${mainUrl}`).hostname}</span>
              <span className="text-gray-400 mx-3">vs</span>
              <span className="text-[#FF5757]">{new URL(competitorUrl.startsWith("http") ? competitorUrl : `https://${competitorUrl}`).hostname}</span>
            </h1>
          </div>
          {/* Winner badge */}
          <div className={`border-4 px-5 py-3 font-black text-xl ${banner.bg} ${banner.color} flex-shrink-0`}>
            {banner.icon} {banner.text}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a href={mainUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-green-700 hover:underline">
            <ExternalLink size={14} /> Your Site
          </a>
          <a href={competitorUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 font-bold text-red-600 hover:underline">
            <ExternalLink size={14} /> Competitor
          </a>
          {scan.isCacheHit && (
            <span className="bg-blue-100 text-blue-700 border border-blue-300 font-bold px-2 py-0.5 rounded text-xs">
              ⚡ Cache Hit
            </span>
          )}
        </div>
      </div>

      {/* DUAL RADAR CHART */}
      <div className="neo-card bg-white">
        <h2 className="text-xl font-black uppercase mb-4">Health Radar</h2>
        <DualRadarChart
          mainScores={mainScores}
          competitorScores={competitorScores}
          mainLabel={mainUrl}
          competitorLabel={competitorUrl}
        />
      </div>

      {/* SCORE TABLE */}
      <ScoreComparisonTable
        mainScores={mainScores}
        competitorScores={competitorScores}
        mainLabel={mainUrl}
        competitorLabel={competitorUrl}
      />

      {/* GEMINI INSIGHTS */}
      <div className="neo-card bg-white space-y-6">
        <div>
          <h2 className="text-xl font-black uppercase mb-1">AI Executive Briefing</h2>
          <p className="text-gray-500 text-sm font-medium">Powered by Gemini AI</p>
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 border-l-4 border-black rounded-r-lg">
          <p className="font-semibold text-gray-800 leading-relaxed">{insights.summary}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Your Advantages */}
          <div>
            <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2 text-green-700">
              ✅ Your Advantages
            </h3>
            <ul className="space-y-2">
              {insights.advantages.map((adv, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium">
                  <span className="text-green-500 font-black flex-shrink-0 mt-0.5">▸</span>
                  {adv}
                </li>
              ))}
            </ul>
          </div>

          {/* Competitor Advantages */}
          <div>
            <h3 className="font-black uppercase text-sm mb-3 flex items-center gap-2 text-red-700">
              ❌ Where You Fall Behind
            </h3>
            <ul className="space-y-2">
              {insights.weaknesses.map((weak, i) => (
                <li key={i} className="flex items-start gap-2 text-sm font-medium">
                  <span className="text-red-500 font-black flex-shrink-0 mt-0.5">▸</span>
                  {weak}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Plan */}
        <div className="border-t-4 border-black pt-4">
          <h3 className="font-black uppercase text-sm mb-3">🗺️ Your Action Plan to Win</h3>
          <ol className="space-y-2">
            {insights.actionPlan.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-medium">
                <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-black">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </motion.div>
  );
}
