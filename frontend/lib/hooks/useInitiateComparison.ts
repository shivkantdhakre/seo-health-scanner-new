import { useMutation } from "@tanstack/react-query";
import { initiateComparison } from "@/lib/auth";
import type { ScanData, ApiError } from "@/lib/types";

export function useInitiateComparison() {
  return useMutation<ScanData, ApiError, { url: string; competitorUrl: string }>(
    {
      mutationFn: ({ url, competitorUrl }) =>
        initiateComparison(url, competitorUrl),
      onError: (error) => {
        console.error("[useInitiateComparison] Error:", error);
      },
    }
  );
}
