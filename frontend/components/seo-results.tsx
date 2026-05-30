"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Loader2, Info } from "lucide-react";
import { TabsContainer } from "./seo-tabs";
import type { Report } from "@/lib/types";
import { api } from "@/lib/api";

// Dynamically import heavy charting library — only loads on results page, never SSR
const SeoRadarChart = dynamic(
  () => import("./seo-radar-chart").then((m) => ({ default: m.SeoRadarChart })),
  { ssr: false, loading: () => <div className="neo-card h-[280px] animate-pulse bg-gray-100" /> }
);

export function SeoResults({ reportData }: { reportData: Report }) {
  const results = reportData;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const downloadPDF = async () => {
    setIsDownloading(true);
    setDownloadError(null);

    const scanId = results.scanId || results.id;

    try {
      console.debug(`[SeoResults] Downloading PDF for scan: ${scanId}`);
      const response = await api.get(`/report/${scanId}/pdf`, {
        responseType: "blob",
        timeout: 60000, // 60 seconds for Puppeteer PDF rendering
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `seo-report-${scanId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("[SeoResults] PDF download failed:", err);
      setDownloadError(err.message || "Failed to download PDF report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-[#ffe26d] to-[#ffcd38] py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Card */}
        <div className="neo-card bg-white/95 backdrop-blur-sm rotate-1 transform hover:rotate-0 transition-all duration-300 hover:shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 p-8">
            <div className="space-y-3">
              <div className="inline-block bg-yellow-100 rounded-full px-4 py-1 text-sm font-medium text-yellow-800">
                SEO Analysis Report
              </div>
              <h2 className="text-4xl font-bold text-gray-800">{hostname}</h2>
              {isValidUrl ? (
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium group"
                >
                  <span className="truncate max-w-[300px] group-hover:underline">{displayUrl}</span>
                  <ExternalLink className="h-4 w-4 flex-shrink-0 transform group-hover:translate-x-0.5 transition-transform" />
                </a>
              ) : (
                <span className="text-gray-600">{displayUrl}</span>
              )}
              <div className="pt-2">
                <button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="neo-button bg-[#FF5757] text-white flex items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Export PDF Report
                    </>
                  )}
                </button>
                {downloadError && (
                  <p className="text-red-600 text-sm font-bold mt-2">{downloadError}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 md:border-l md:pl-8 md:border-gray-200">
              {/* Overall Score */}
              <div className="text-center">
                <div className="relative">
                  <div className="text-6xl font-black mb-1">
                    <span className={getScoreColor(overallScore)}>
                      {overallScore}
                    </span>
                  </div>
                  <div className="absolute -right-4 top-2">
                    <div className="text-lg font-medium text-gray-400">/100</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wider mt-2">Overall Score</div>
                <div
                  className={`neo-badge ${getScoreBg(overallScore)} text-white text-lg font-bold px-6 py-3 mt-3 shadow-lg`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                >
                  {overallScore >= 90 ? "EXCELLENT" : overallScore >= 50 ? "NEEDS WORK" : "POOR"}
                </div>
              </div>
              {/* Radar Chart — lazy loaded */}
              <div className="w-full md:w-64 flex-shrink-0">
                <SeoRadarChart scores={scores} />
              </div>
            </div>
          </div>
        </div>

        {/* Score Cards Grid — staggered Framer Motion entry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            { title: "Performance", score: results.performanceScore, rotation: "-rotate-1" },
            { title: "Accessibility", score: results.accessibilityScore, rotation: "rotate-1" },
            { title: "Best Practices", score: results.bestPracticesScore, rotation: "-rotate-1" },
            { title: "SEO", score: results.seoScore, rotation: "rotate-1" },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
            >
              <ScoreCard title={card.title} score={card.score} rotation={card.rotation} />
            </motion.div>
          ))}
        </div>

        {/* Fallback mode banner — shown when Gemini AI was unavailable */}
        {(results.aiSuggestions as any)?.isFallback && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-start gap-3 bg-[#FFDE59] border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="font-bold text-sm uppercase tracking-wide">
              Standard Core Audit Loaded —{" "}
              <span className="font-normal normal-case tracking-normal">
                Complete Generative Strategies are Temporarily Processing. Our Gemini AI insights will be available on your next scan of this URL.
              </span>
            </p>
          </motion.div>
        )}

        {/* Detailed Results */}
        <div className="neo-card bg-white/95 backdrop-blur-sm -rotate-1 transform hover:rotate-0 transition-all duration-300">
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

  const getGradient = (score: number) => {
    if (score >= 90) return "from-[#00C853]/20 to-[#00C853]/5";
    if (score >= 50) return "from-[#FFB300]/20 to-[#FFB300]/5";
    return "from-[#FF5757]/20 to-[#FF5757]/5";
  };

  return (
    <div
      className={`neo-card bg-white/95 backdrop-blur-sm p-8 ${rotation} transform hover:rotate-0 
        transition-all duration-300 hover:shadow-xl bg-gradient-to-b ${getGradient(score)}`}
    >
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold uppercase text-gray-800 tracking-wide">{title}</h3>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getTextColor(score)} bg-white shadow-sm`}>
            {getScoreLabel(score)}
          </div>
        </div>

        <div className="relative">
          <div className="text-6xl font-black" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
            <span className={getTextColor(score)}>{score}</span>
          </div>
          <div className="absolute -right-3 top-2">
            <div className="text-base font-medium text-gray-400">/100</div>
          </div>
        </div>

        <div className="pt-2">
          <div className="relative w-full h-3 rounded-full bg-gray-100 overflow-hidden shadow-inner">
            <div
              className={`absolute top-0 left-0 h-full ${getBg(score)} transition-all duration-1000 ease-out`}
              style={{
                width: `${score}%`,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium text-gray-500 mt-2">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
}