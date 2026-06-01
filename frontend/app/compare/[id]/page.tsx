"use client";

import { useParams, useRouter } from "next/navigation";
import { CompareResults } from "@/components/compare-results";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { useSeoReport } from "@/lib/hooks/useSeoReport";
import { useEffect, useState, useRef } from "react";

const LOADING_MESSAGES = [
  "Initializing comparison environment...",
  "Running Lighthouse audit on your site...",
  "Running Lighthouse audit on competitor site...",
  "Analyzing Core Web Vitals for both sites...",
  "Evaluating SEO scores side-by-side...",
  "Waking up Gemini AI for analysis...",
  "Generating executive comparison briefing...",
  "Finalizing your competitive intelligence report...",
];

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loadingStep, setLoadingStep] = useState(0);
  const [showLoader, setShowLoader] = useState(false);
  const loaderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: report,
    error,
    isError,
    isPending,
    isFetching,
    failureCount,
    status,
    refetch,
  } = useSeoReport(id);

  // Short-circuit: show loader only after 250ms to avoid flash on cache hits
  useEffect(() => {
    const isComplete = report?.status === "COMPLETED" && report?.report;
    if (isComplete) {
      setShowLoader(false);
      if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
      return;
    }
    const isLoadingState =
      isPending ||
      (!report && isFetching) ||
      (report?.status && ["PENDING", "PROCESSING"].includes(report.status));
    if (isLoadingState && !showLoader) {
      loaderTimerRef.current = setTimeout(() => setShowLoader(true), 250);
    } else if (!isLoadingState) {
      setShowLoader(false);
    }
    return () => {
      if (loaderTimerRef.current) clearTimeout(loaderTimerRef.current);
    };
  }, [isPending, isFetching, report?.status, report?.report]);

  // Cycle through loading messages every 3.5 seconds
  useEffect(() => {
    const isLoadingState =
      isPending ||
      (!report && isFetching) ||
      (report?.status && ["PENDING", "PROCESSING"].includes(report.status));
    if (isLoadingState) {
      const interval = setInterval(() => {
        setLoadingStep((prev) =>
          prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
        );
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isPending, isFetching, report?.status]);

  const handleBackToDashboard = () => router.push("/dashboard");

  // --- ERROR STATE ---
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffe26d] p-4">
        <div className="neo-card bg-white text-center p-8 max-w-md">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-xl font-bold mb-2">Error Loading Comparison</p>
          <p className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => refetch()}
              className="neo-button bg-[#FF5757] flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <button
              onClick={handleBackToDashboard}
              className="neo-button bg-gray-500 text-white"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- COMPLETED STATE: render the comparison report ---
  if (report && report.status === "COMPLETED" && report.report) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <nav className="bg-white border-b-4 border-black px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight">
            ⚔️ Competitor Analysis
          </span>
          <button
            onClick={handleBackToDashboard}
            className="neo-button bg-[#FFDE59] text-sm py-2 px-4"
          >
            ← Dashboard
          </button>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <CompareResults scan={report} />
        </main>
      </div>
    );
  }

  // --- LOADING STATE ---
  const isLoading =
    isPending ||
    (!report && isFetching) ||
    (report?.status && ["PENDING", "PROCESSING"].includes(report.status));

  if (isLoading && showLoader) {
    const progressPercentage = Math.min(
      95,
      ((loadingStep + 1) / LOADING_MESSAGES.length) * 100
    );
    return (
      <div className="min-h-screen bg-[#7C3AED] relative overflow-hidden">
        {/* Skeleton preview */}
        <div className="max-w-5xl mx-auto px-4 pt-24 pb-12 space-y-8 opacity-20 pointer-events-none select-none">
          <div className="border-4 border-white/30 bg-white/10 h-40 animate-pulse rounded" />
          <div className="grid grid-cols-2 gap-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="border-4 border-white/30 bg-white/10 h-64 animate-pulse rounded"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
          <div className="border-4 border-white/30 bg-white/10 h-48 animate-pulse rounded" />
        </div>

        {/* Foreground overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-white neo-card text-center p-8 md:p-12 max-w-xl w-full transform -rotate-1">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-16 w-16 animate-spin text-[#7C3AED]" />
            </div>
            <h2 className="text-3xl font-black uppercase mb-2">
              Comparing Sites
            </h2>
            <p className="text-gray-500 font-medium mb-6">
              Running two Lighthouse audits concurrently
            </p>
            <div className="h-8 mb-6 flex items-center justify-center">
              <p className="text-base font-bold text-gray-700 animate-pulse">
                {LOADING_MESSAGES[loadingStep]}
                {failureCount > 0 && (
                  <span className="text-[#7C3AED] ml-2">(Attempt {failureCount})</span>
                )}
              </p>
            </div>
            <div className="w-full bg-gray-100 h-6 border-4 border-black relative overflow-hidden mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div
                className="absolute top-0 left-0 h-full bg-[#7C3AED] transition-all duration-1000 ease-out border-r-4 border-black"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm font-bold text-gray-500 mt-4">
              Two audits run concurrently — this takes ~45 seconds.
              <br />
              Please don't close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- FALLBACK: unexpected state ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffe26d] p-4">
      <div className="neo-card bg-white text-center p-8 max-w-md">
        <p className="text-xl font-bold mb-4">
          {report?.status && ["PENDING", "PROCESSING"].includes(report.status)
            ? "Comparison in Progress"
            : "Comparison Not Found"}
        </p>
        <p className="text-gray-600 mb-6 font-medium">
          {report?.status === "FAILED"
            ? "The comparison scan failed. Please try running it again."
            : "The comparison report could not be found or has expired."}
        </p>
        <div className="flex gap-4 justify-center">
          {report?.status && ["PENDING", "PROCESSING"].includes(report.status) ? (
            <button
              onClick={() => refetch()}
              className="neo-button bg-[#FFDE59] flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Again
            </button>
          ) : (
            <button
              onClick={handleBackToDashboard}
              className="neo-button bg-[#FF5757] text-white"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
