"use client";

import { ExternalLink } from "lucide-react";
import { TabsContainer } from "./seo-tabs";
import type { Report } from "@/lib/types";

export function SeoResults({ reportData }: { reportData: Report }) {
  const results = reportData;

  // Validate report data structure without logging sensitive details
  console.debug('[SeoResults] Report data validation:', {
    hasResults: !!results,
    hasLighthouseResult: !!results?.lighthouseResult,
    hasAiSuggestions: !!results?.aiSuggestions
  });

  if (!results) {
    console.error('[SeoResults] No results data provided');
    return <div className="text-center p-8">Report data is missing</div>;
  }

  if (!results.lighthouseResult) {
    console.error('[SeoResults] Missing Lighthouse results');
    return <div className="text-center p-8">Lighthouse data is incomplete</div>;
  }

  if (!results.aiSuggestions) {
    console.error('[SeoResults] Missing AI suggestions');
    return <div className="text-center p-8">AI suggestions are not available</div>;
  }

  // Helper function to validate and parse URLs
  const parseUrl = (urlString: unknown): { isValid: boolean; hostname: string; displayUrl: string } => {
    const defaultResult = { isValid: false, hostname: "Report", displayUrl: "Analysis Report" };

    if (typeof urlString !== 'string' || !urlString.trim()) {
      console.warn("[SeoResults] No URL provided in report data");
      return defaultResult;
    }

    try {
      // Try parsing as is first
      let parsedUrl = new URL(urlString);

      // If parsing succeeded, return the result
      return {
        isValid: true,
        hostname: parsedUrl.hostname || defaultResult.hostname,
        displayUrl: urlString
      };
    } catch (e) {
      // Try adding https:// if no protocol is present
      if (!urlString.includes('://')) {
        try {
          const parsedUrl = new URL(`https://${urlString}`);
          return {
            isValid: true,
            hostname: parsedUrl.hostname,
            displayUrl: parsedUrl.href
          };
        } catch (e2) {
          // If both attempts fail, log and return default
          console.warn("[SeoResults] Invalid URL format received in report data:", {
            providedUrl: urlString.substring(0, 100) // Truncate long URLs in logs
          });
          return defaultResult;
        }
      }
      // If original parsing failed with protocol, return default
      console.warn("[SeoResults] Invalid URL format received in report data");
      return defaultResult;
    }
  };

  // Helper function to clamp scores
  const clampScore = (score: number | undefined): number => {
    if (typeof score !== 'number' || isNaN(score)) return 0;
    return Math.max(0, Math.min(100, score));
  };

  // Get URL from report data or lighthouse result
  const reportUrl = reportData.url || results.lighthouseResult?.finalUrl;
  const { isValid: isValidUrl, hostname, displayUrl } = parseUrl(reportUrl);

  // Clamp all scores
  const scores = {
    performance: clampScore(results.performanceScore),
    accessibility: clampScore(results.accessibilityScore),
    bestPractices: clampScore(results.bestPracticesScore),
    seo: clampScore(results.seoScore)
  };

  const overallScore = Math.round(
    Object.values(scores).reduce((sum, score) => sum + score, 0) / 4
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
    <div className="min-h-screen bg-[#ffe26d] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Card */}
        <div className="neo-card bg-white rotate-1 transform hover:rotate-0 transition-transform duration-300">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">Report</h2>
              {isValidUrl ? (
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
                >
                  <span className="truncate max-w-[300px]">{displayUrl}</span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-gray-600">{displayUrl}</span>
              )}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-black">
                  <span className={getScoreColor(overallScore)}>
                    {overallScore}
                  </span>
                  <span className="text-gray-400">/100</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">Overall Score</div>
              </div>
              <div className={`neo-badge ${getScoreBg(overallScore)} text-white text-lg font-bold px-6 py-2`}>
                {overallScore >= 90
                  ? "EXCELLENT"
                  : overallScore >= 50
                    ? "NEEDS WORK"
                    : "POOR"}
              </div>
            </div>
          </div>
        </div>

        {/* Score Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Detailed Results */}
        <div className="bg-white rounded-lg shadow-lg p-6 -rotate-1">
          <TabsContainer results={results.aiSuggestions} />
        </div>
      </div>
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

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 50) return "Needs Work";
    return "Poor";
  };

  const getTextColor = (score: number) => {
    if (score >= 90) return "text-[#00C853]";
    if (score >= 50) return "text-[#FFB300]";
    return "text-[#FF5757]";
  };

  return (
    <div className={`neo-card bg-white p-6 ${rotation} transform hover:rotate-0 transition-all duration-300 hover:shadow-lg`}>
      <div className="text-center space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold uppercase text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{getScoreLabel(score)}</p>
        </div>

        <div className="relative">
          <div className="text-5xl font-black mb-2">
            <span className={getTextColor(score)}>{score}</span>
          </div>
          <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
            <div className="text-sm font-medium text-gray-400">out of 100</div>
          </div>
        </div>

        <div className="pt-4">
          <div className={`w-full h-2 rounded-full bg-gray-100 overflow-hidden`}>
            <div
              className={`h-full ${getBg(score)} transition-all duration-1000 ease-out`}
              style={{ width: `${score}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}