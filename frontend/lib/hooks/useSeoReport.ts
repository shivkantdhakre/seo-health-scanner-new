import { useQuery } from "@tanstack/react-query";
import { fetchSeoReport } from "../api";
import { Scan } from "../types";

import { ScanStatus } from "../types";

// Extend the Scan type with status
export type SeoReport = Scan;

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_RETRIES = 60; // 5 minutes worth of retries (60 * 5000ms)
const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export function useSeoReport(scanId: string | null) {
  return useQuery<SeoReport | null>({
    queryKey: ["seoReport", scanId],
    queryFn: async () => {
      if (!scanId) return null;

      console.debug("[useSeoReport] Fetching report for scanId:", scanId);
      const data = await fetchSeoReport(scanId);

      // Parse the aiSuggestions if they exist
      if (
        data?.report?.aiSuggestions &&
        typeof data.report.aiSuggestions === "string"
      ) {
        try {
          data.report.aiSuggestions = JSON.parse(data.report.aiSuggestions);
        } catch (e) {
          console.error("[useSeoReport] Failed to parse aiSuggestions:", e);
        }
      }

      console.debug("[useSeoReport] Received data:", {
        status: data.status,
        hasReport: !!data.report,
        reportData: data.report
          ? {
              scores: {
                performance: data.report.performanceScore,
                accessibility: data.report.accessibilityScore,
                bestPractices: data.report.bestPracticesScore,
                seo: data.report.seoScore,
              },
              hasAiSuggestions: !!data.report.aiSuggestions,
            }
          : null,
        timestamp: new Date().toISOString(),
      });

      return data;
    },
    enabled: !!scanId,
    staleTime: STALE_TIME,
    retry: (failureCount, error) => {
      console.debug("[useSeoReport] Retry attempt", {
        failureCount,
        error,
        maxRetries: MAX_RETRIES,
        shouldRetry: failureCount < MAX_RETRIES,
      });
      return failureCount < MAX_RETRIES;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      const shouldPoll =
        data && (data.status === "PENDING" || data.status === "PROCESSING");

      console.debug("[useSeoReport] Polling status:", {
        scanId,
        currentStatus: data?.status,
        hasReport: !!data?.report,
        shouldContinuePolling: shouldPoll,
        nextPollIn: shouldPoll ? `${POLL_INTERVAL / 1000}s` : "stopped",
        timestamp: new Date().toISOString(),
      });

      return shouldPoll ? POLL_INTERVAL : false;
    },
    refetchOnWindowFocus: true,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
