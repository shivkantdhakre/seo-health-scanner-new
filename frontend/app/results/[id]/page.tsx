"use client";

import { useParams, useRouter } from "next/navigation";
import { SeoResults } from "@/components/seo-results";
import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import type { Report } from "@/lib/types";
import { useSeoReport } from "@/lib/hooks/useSeoReport";
import { useEffect, useState, useDebugValue } from "react";

// The messages to cycle through while the background worker processes
const LOADING_MESSAGES = [
  "Initializing scan environment...",
  "Fetching Google Lighthouse metrics...",
  "Analyzing Core Web Vitals...",
  "Evaluating SEO best practices...",
  "Checking mobile responsiveness...",
  "Waking up Gemini AI...",
  "Drafting custom recommendations...",
  "Finalizing your complete report..."
];

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loadingStep, setLoadingStep] = useState(0);

  const {
    data: report,
    error,
    isError,
    isPending,
    isFetching,
    failureCount,
    status,
    refetch
  } = useSeoReport(id);

  // Add debug values for React DevTools
  useDebugValue({ id, status, failureCount, hasReport: !!report });

  // Cycle through loading messages every 3.5 seconds
  useEffect(() => {
    const isLoadingState = isPending || 
      (!report && isFetching) || 
      (report?.status && ['PENDING', 'PROCESSING'].includes(report.status));

    if (isLoadingState) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => 
          prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
        );
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isPending, isFetching, report?.status]);

  // Enhanced debug logging
  useEffect(() => {
    const currentState = {
      // Query state
      id,
      queryStatus: status,
      isPending,
      isFetching,
      isError,
      failureCount,

      // Report state
      hasReport: !!report,
      reportStatus: report?.status,
      reportData: report?.report ? 'present' : 'missing',

      // Component state decisions
      isLoading: isPending || (!report && isFetching) || (isFetching && report?.status && ['PENDING', 'PROCESSING'].includes(report.status)),
      shouldRetry: !report || (report?.status && ['PENDING', 'PROCESSING'].includes(report.status)),
      canShowReport: report && report.report && report.status === 'COMPLETED',

      // Error state
      error: error ? {
        message: error instanceof Error ? error.message : String(error),
        cause: error instanceof Error && error.cause ? String(error.cause) : undefined
      } : null,

      timestamp: new Date().toISOString()
    };

    console.debug('[ResultsPage] State update:', currentState);

    // Log important transitions
    if (report?.status !== currentState.reportStatus) {
      console.debug('[ResultsPage] Status transition:', {
        from: report?.status,
        to: currentState.reportStatus,
        timestamp: currentState.timestamp
      });
    }
  }, [error, failureCount, id, status, isPending, isFetching, report, isError]);

  const handleRetry = () => {
    const isTimeout = error instanceof Error &&
      ((error.cause instanceof Error && error.cause.message.includes('timeout')) ||
        error.message.includes('timeout'));

    const isLighthouseTimeout = error instanceof Error &&
      (error.message.includes('Lighthouse') || (error.cause instanceof Error && error.cause.message.includes('Lighthouse')));

    console.debug('[ResultsPage] Retrying fetch:', {
      id,
      failureCount,
      isTimeout,
      isLighthouseTimeout,
      timestamp: new Date().toISOString()
    });

    // For timeouts, we'll give a longer grace period before retrying
    if (isTimeout) {
      const delayMs = isLighthouseTimeout ? 5000 : 2000; // Longer delay for Lighthouse timeouts
      setTimeout(() => {
        refetch();
      }, delayMs);
    } else {
      refetch();
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffe26d] p-4">
        <div className="neo-card bg-white text-center p-8 max-w-md">
          <div className="text-red-500 mb-6">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-xl font-bold mb-2">Error Loading Report</p>
            <p className="text-gray-600">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            {(() => {
              const isTimeout = error instanceof Error &&
                ((error.cause instanceof Error && error.cause.message.includes('timeout')) ||
                  error.message.includes('timeout'));

              if (isTimeout) {
                return (
                  <p className="text-sm text-orange-600 mt-2">
                    {error.message.includes('Lighthouse') || (error.cause instanceof Error && error.cause.message.includes('Lighthouse'))
                      ? 'The Lighthouse analysis reached its timeout limit (30s). This can happen when analyzing complex pages or during high server load.'
                      : 'The analysis is taking longer than expected. This can happen during high server load.'}
                    {failureCount > 2
                      ? ' You may want to try again in a few minutes when server load may be lower.'
                      : ' We recommend waiting a moment before trying again.'}
                  </p>
                );
              }

              if (failureCount > 2) {
                return (
                  <p className="text-sm text-gray-500 mt-2">
                    Multiple retry attempts have failed. The report might be unavailable.
                  </p>
                );
              }

              return null;
            })()}
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRetry}
              className="neo-button bg-[#FF5757] flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <button
              onClick={handleBackToDashboard}
              className="neo-button bg-gray-500 text-white"
            >
              Back to Dashboard
            </button>
          </div>
          
          {/* Fully Restored Development Debug Overlay */}
          {process.env.NODE_ENV === 'development' && error instanceof Error && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-left space-y-2">
              <details>
                <summary className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                  Debug Information
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="text-xs">
                    <span className="font-semibold">Error Type:</span> {error.name}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">Message:</span> {error.message}
                  </div>
                  {(() => {
                    if (!error.cause) return null;
                    const isTimeout =
                      (error.cause instanceof Error && error.cause.message.includes('timeout')) ||
                      String(error.cause).includes('timeout');
                    const causeStr = error.cause instanceof Error
                      ? error.cause.message
                      : String(error.cause);
                    return (
                      <>
                        <div className="text-xs">
                          <span className="font-semibold">Cause:</span>{" "}
                          <span className={isTimeout ? "text-orange-600" : "text-red-600"}>
                            {causeStr}
                          </span>
                        </div>
                        {isTimeout && (
                          <div className="text-xs text-orange-600 mt-1 pl-4">
                            ⚠️ This appears to be a timeout error. The Lighthouse analysis can sometimes take longer than expected.
                            Retrying the request might help, as server load varies.
                          </div>
                        )}
                      </>
                    );
                  })()}
                  {(() => {
                    if (!error.cause || !(error.cause instanceof Error)) return null;
                    if (!('response' in error.cause)) return null;

                    const responseDetails = {
                      status: (error.cause as any).response?.status,
                      statusText: (error.cause as any).response?.statusText,
                      data: (error.cause as any).response?.data
                    };

                    return (
                      <div className="border-t border-gray-200 pt-2 mt-2">
                        <div className="text-xs font-semibold mb-1">Response Details:</div>
                        <pre className="text-xs overflow-auto max-h-32 bg-gray-50 p-1 rounded">
                          {JSON.stringify(responseDetails, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="text-xs">
                      <span className="font-semibold">Timestamp:</span>{" "}
                      {new Date().toISOString()}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold">Retry Count:</span>{" "}
                      {failureCount}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold">Query Status:</span>{" "}
                      {status}
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold">Scan ID:</span>{" "}
                      {id}
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading state when:
  // 1. Initial load (isPending)
  // 2. No data yet and fetching
  // 3. Has report in PENDING/PROCESSING state
  const isLoading = isPending ||
    (!report && isFetching) ||
    (report?.status && ['PENDING', 'PROCESSING'].includes(report.status));

  console.debug('[ResultsPage] Loading state check:', {
    isPending,
    isFetching,
    status: report?.status,
    isLoading,
    hasReport: !!report?.report,
    timestamp: new Date().toISOString()
  });

  if (isLoading) {
    // Calculate simulated progress based on the current message index
    const progressPercentage = Math.min(
      95, // Cap at 95% until actually finished
      ((loadingStep + 1) / LOADING_MESSAGES.length) * 100
    );

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFDE59] p-4">
        <div className="neo-card bg-white text-center p-8 md:p-12 max-w-xl w-full transform -rotate-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-center mb-8">
            <Loader2 className="h-16 w-16 animate-spin text-[#FF5757]" />
          </div>
          
          <h2 className="text-3xl font-black uppercase mb-6 tracking-tight">
            Analyzing Website
          </h2>
          
          {/* Animated Message Text */}
          <div className="h-8 mb-6 flex items-center justify-center">
            <p className="text-lg font-bold text-gray-700 animate-pulse">
              {LOADING_MESSAGES[loadingStep]}
              {failureCount > 0 && <span className="text-[#FF5757] ml-2">(Attempt {failureCount})</span>}
            </p>
          </div>

          {/* Brutalist Progress Bar */}
          <div className="w-full bg-gray-100 h-6 border-4 border-black relative overflow-hidden mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div 
              className="absolute top-0 left-0 h-full bg-[#FF5757] transition-all duration-1000 ease-out border-r-4 border-black"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-sm font-bold text-gray-500 mt-6">
            This deep-dive audit takes about 30 seconds.<br/>Please don't close this window.
          </p>
          
          {/* Subtle status debug indicator */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 text-xs text-gray-400 font-mono">
              Status: {report?.status || 'PENDING'} | Job: {id.slice(-6)}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Handle completed reports with data
  if (report && report.status === 'COMPLETED' && report.report) {
    console.debug('[ResultsPage] Rendering completed report:', {
      scanId: id,
      status: report.status,
      scores: {
        performance: report.report.performanceScore,
        accessibility: report.report.accessibilityScore,
        bestPractices: report.report.bestPracticesScore,
        seo: report.report.seoScore
      },
      timestamp: new Date().toISOString()
    });

    return (
      <>
        <SeoResults reportData={{ ...report.report, url: report.url }} />
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 p-2 bg-black/80 text-white text-xs rounded-lg font-mono space-y-1 z-50">
            <div>Query Status: {status}</div>
            <div>Scan Status: {report.status}</div>
            <div>Retries: {failureCount}</div>
            <div>Scan ID: {id}</div>
            <div className="text-green-400">✓ Analysis Complete</div>
            <div>Scores: {report.report.performanceScore}/{report.report.seoScore}</div>
          </div>
        )}
      </>
    );
  }

  // At this point, we know the report is either incomplete or missing
  const isGenerating = report?.status && ['PENDING', 'PROCESSING'].includes(report.status);
  const statusMessage = (() => {
    if (!report) return "Report not found";
    switch (report.status) {
      case 'PENDING': return "Initializing analysis...";
      case 'PROCESSING': return "Analyzing webpage...";
      case 'FAILED': return "Analysis failed";
      case 'COMPLETED': return report.report ? "Loading report..." : "Report data missing";
      default: return "Report not available";
    }
  })();

  console.debug('[ResultsPage] Showing status page:', {
    isGenerating,
    status: report?.status,
    hasReport: !!report?.report,
    message: statusMessage,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ffe26d] p-4">
      <div className="neo-card bg-white text-center p-8 max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-xl font-bold mb-4">
          {isGenerating ? "Report in Progress" : "Report Not Found"}
        </p>
        <p className="text-gray-600 mb-2 font-medium">
          {isGenerating
            ? statusMessage
            : "The requested report could not be found or has expired."
          }
        </p>
        {report?.status && (
          <p className="text-sm text-[#FF5757] font-bold mb-6">
            Status: {statusMessage}
            {failureCount > 0 && ` (Attempt ${failureCount + 1})`}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          {isGenerating ? (
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
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-3 bg-gray-100 border-2 border-black rounded text-left">
            <p className="text-xs font-bold mb-2">Debug Info:</p>
            <pre className="text-xs overflow-auto max-h-32">
              {JSON.stringify({
                scanId: id,
                status: report?.status,
                hasReport: !!report?.report,
                retryCount: failureCount,
                timestamp: new Date().toISOString()
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}