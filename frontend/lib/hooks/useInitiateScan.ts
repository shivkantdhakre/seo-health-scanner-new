import { useMutation } from "@tanstack/react-query";
import { initiateScan } from "@/lib/auth";
import type { ScanData } from "@/lib/types";

export const MIN_SCAN_INTERVAL = 30000; // 30 seconds

export function useInitiateScan() {
  return useMutation<ScanData, Error, string>({
    mutationFn: (url: string) => initiateScan(url),
    onError: (error) => {
      console.error("[useInitiateScan] Error:", error);
    },
  });
}
