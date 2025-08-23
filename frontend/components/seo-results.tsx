"use client";

import { ExternalLink } from "lucide-react";
import { TabsContainer } from "./seo-tabs";
import type { Report } from "@/lib/types";

export function SeoResults({ reportData }: { reportData: Report }) {
  const results = reportData;

  // Check if the necessary data exists before proceeding.
  if (!results || !results.lighthouseResult || !results.aiSuggestions) {
    // This can be a more sophisticated loading or error component
    return <div className="text-center p-8">Report data is incomplete or still loading...</div>;
  }

  const url = results.lighthouseResult.finalUrl;
  let displayUrl = "Analysis Report";
  let hostname = "Report";

  // Safely try to parse the URL.
  try {
    const parsedUrl = new URL(url);
    hostname = parsedUrl.hostname;
    displayUrl = url;
  } catch {
    console.warn("Invalid URL received in report data:", url);
  }

  const overallScore = Math.round(
    (results.performanceScore +
      results.accessibilityScore +
      results.bestPracticesScore +
      results.seoScore) /
    4
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#00C853]";
    if (score >= 50) return "text-[#FFB300]";
    return "text-[#FF5757]";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-[#00C853]";
    if (score >= 50) return "bg-[#FFB300]";
    return "bg-[#FF5757]";
  };

  return (
    <div className="space-y-8">
      <div className="neo-card bg-white rotate-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">{hostname}</h2>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-bold hover:underline"
            >
              {displayUrl} <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black">
              <span className={getScoreColor(overallScore)}>
                {overallScore}
              </span>
              /100
            </div>
            <div className={`neo-badge ${getScoreBg(overallScore)} text-white`}>
              {overallScore >= 90
                ? "EXCELLENT"
                : overallScore >= 50
                  ? "NEEDS WORK"
                  : "POOR"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ScoreCard
          title="Performance"
          score={results.performanceScore}
          rotation="-rotate-1"
        />
        <ScoreCard
          title="Accessibility"
          score={results.accessibilityScore}
          rotation="rotate-1"
        />
        <ScoreCard
          title="Best Practices"
          score={results.bestPracticesScore}
          rotation="-rotate-1"
        />
        <ScoreCard
          title="SEO"
          score={results.seoScore}
          rotation="rotate-1"
        />
      </div>
      <TabsContainer results={results.aiSuggestions} />
    </div>
  );
}

function ScoreCard({
  title,
  score,
  rotation,
}: {
  title: string;
  score: number;
  rotation: string;
}) {
  const getBg = (score: number) => {
    if (score >= 90) return "bg-[#00C853]";
    if (score >= 50) return "bg-[#FFB300]";
    return "bg-[#FF5757]";
  };

  return (
    <div className={`neo-card ${rotation}`}>
      <div className="text-center">
        <p className="text-xl font-bold uppercase mb-2">{title}</p>
        <p className="text-4xl font-black mb-2">{score}</p>
        <div className={`w-full h-4 neo-border ${getBg(score)}`}></div>
      </div>
    </div>
  );
}