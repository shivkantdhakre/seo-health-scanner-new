"use client";

import { useParams, useRouter } from "next/navigation";
import { SeoResults } from "@/components/seo-results";
import { RefreshCw, AlertTriangle } from "lucide-react";
import type { Report } from "@/lib/types";
import { LoadingPage } from "@/components/loading-spinner";
import { useSeoReport } from "@/lib/hooks/useSeoReport";
import { useEffect } from "react";
import { useDebugValue } from "react";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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
    return (
      <LoadingPage
        title="Generating Your SEO Report..."
        message={
          failureCount > 0
            ? `Still processing... This is taking longer than usual. (Attempt ${failureCount})`
            : "Our AI is analyzing the Lighthouse data. This can take up to a minute. We'll automatically load your report when it's ready."
        }
      />
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
          <div className="fixed bottom-4 right-4 p-2 bg-black/80 text-white text-xs rounded-lg font-mono space-y-1">
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
      <div className="neo-card bg-white text-center p-8 max-w-md">
        <p className="text-xl font-bold mb-4">
          {isGenerating ? "Report in Progress" : "Report Not Found"}
        </p>
        <p className="text-gray-600 mb-2">
          {isGenerating
            ? statusMessage
            : "The requested report could not be found or has expired."
          }
        </p>
        {report?.status && (
          <p className="text-sm text-orange-600 mb-6">
            Status: {statusMessage}
            {failureCount > 0 && ` (Attempt ${failureCount + 1})`}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          {isGenerating ? (
            <button
              onClick={() => refetch()}
              className="neo-button bg-[#FF5757] flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Check Again
            </button>
          ) : (
            <button
              onClick={handleBackToDashboard}
              className="neo-button bg-[#FF5757]"
            >
              Back to Dashboard
            </button>
          )}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-left">
            <p className="text-xs text-gray-600">Debug Info:</p>
            <pre className="text-xs mt-1 overflow-auto max-h-32">
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