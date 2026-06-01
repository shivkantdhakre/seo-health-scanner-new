"use client";

import { useState, useCallback, useEffect, useDebugValue } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { validateUrl } from "@/lib/validation";
import { useInitiateScan, MIN_SCAN_INTERVAL } from "@/lib/hooks/useInitiateScan";
import { useInitiateComparison } from "@/lib/hooks/useInitiateComparison";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import type { ScanData } from "@/lib/types";

interface SeoFormProps {
  onScanInitiated: (scanData: ScanData) => void;
}

export function SeoForm({ onScanInitiated }: SeoFormProps) {
  const [url, setUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [error, setError] = useState("");
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const {
    mutate: initiateScan,
    isPending: isScanPending,
    error: scanError,
    status,
    failureCount,
  } = useInitiateScan();

  const {
    mutate: initiateComparison,
    isPending: isComparisonPending,
  } = useInitiateComparison();

  const isPending = isScanPending || isComparisonPending;
  const mutationError = scanError;

  // Debug values for React DevTools
  useDebugValue({ url, status, error, lastScanTime, isAuthenticated: !!user, isComparisonMode });

  // Log important state changes
  useEffect(() => {
    if (mutationError) {
      console.debug('[SeoForm] Mutation error:', {
        error: mutationError,
        failureCount,
        url
      });
    }
  }, [mutationError, failureCount, url]);

  // When toggling comparison mode off, reset competitor URL
  const toggleComparisonMode = useCallback(() => {
    setIsComparisonMode((prev) => {
      if (prev) setCompetitorUrl("");
      return !prev;
    });
  }, []);

  const handleAnalyze = useCallback(() => {
    console.debug('[SeoForm] Starting analysis:', {
      url,
      isComparisonMode,
      competitorUrl,
      lastScanTime,
      timeSinceLastScan: Date.now() - lastScanTime
    });
    setError("");

    // 1. AUTHENTICATION CHECK
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Rate limiting
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTime;
    if (timeSinceLastScan < MIN_SCAN_INTERVAL) {
      const remainingTime = Math.ceil((MIN_SCAN_INTERVAL - timeSinceLastScan) / 1000);
      toast.warning(`⏳ Rate limit — please wait ${remainingTime}s before starting another scan.`);
      return;
    }

    // 3. Validate primary URL
    const validation = validateUrl(url);
    if (!validation.isValid) {
      toast.error(`❌ Invalid URL — ${validation.error || "Please enter a valid URL."}`);
      return;
    }

    const handleError = (error: any) => {
      const msg = error.message || "Failed to start scan. Please try again.";
      setError(msg);
      if (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('upgrade')) {
        toast.error(`🔴 ${msg}`, { duration: 6000 });
      } else {
        toast.error(msg);
      }
    };

    // 4. Branch: comparison vs single-site scan
    if (isComparisonMode) {
      const competitorValidation = validateUrl(competitorUrl);
      if (!competitorValidation.isValid) {
        toast.error(`❌ Invalid competitor URL — ${competitorValidation.error || "Please enter a valid URL."}`);
        return;
      }

      initiateComparison(
        { url: validation.sanitizedValue!, competitorUrl: competitorValidation.sanitizedValue! },
        {
          onSuccess: (scanData) => {
            setLastScanTime(now);
            router.push(`/compare/${scanData.id}`);
          },
          onError: handleError,
        }
      );
    } else {
      initiateScan(validation.sanitizedValue!, {
        onSuccess: (scanData) => {
          setLastScanTime(now);
          onScanInitiated(scanData);
        },
        onError: handleError,
      });
    }
  }, [url, competitorUrl, isComparisonMode, lastScanTime, initiateScan, initiateComparison, onScanInitiated, user, router]);

  const isDisabled = isPending || isAuthLoading;

  return (
    <div className="neo-card -rotate-1 transform transition-all hover:rotate-0 duration-300 bg-white">
      <div className="space-y-4">
        <label htmlFor="url" className="block text-xl font-bold">
          Website URL
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            id="url"
            type="text"
            placeholder="example.com"
            className="neo-input flex-1 text-lg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDisabled}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isDisabled) {
                handleAnalyze();
              }
            }}
          />
          <button
            onClick={handleAnalyze}
            className={`neo-button text-lg uppercase transition-colors ${
              isDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : isComparisonMode
                ? 'bg-[#7C3AED] hover:bg-[#6D28D9]'
                : 'bg-[#FF5757] hover:bg-[#FF4242]'
            }`}
            disabled={isDisabled}
            aria-busy={isDisabled}
          >
            {isAuthLoading
              ? "Loading..."
              : isPending
              ? isComparisonMode ? "Comparing..." : "Analyzing..."
              : isComparisonMode
              ? "⚔️ Compare (2 Credits)"
              : "Analyze (1 Credit)"}
          </button>
        </div>

        {/* Competitor toggle */}
        <div>
          <button
            type="button"
            onClick={toggleComparisonMode}
            disabled={isDisabled}
            className={`flex items-center gap-2 text-sm font-bold transition-colors ${
              isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-black'
            }`}
            id="comparison-toggle"
          >
            <motion.span
              animate={{ rotate: isComparisonMode ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg leading-none"
            >
              ⚔️
            </motion.span>
            {isComparisonMode ? "Remove Competitor" : "Add Competitor (costs 2 credits)"}
          </button>

          <AnimatePresence>
            {isComparisonMode && (
              <motion.div
                key="competitor-input"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-3">
                  <label htmlFor="competitor-url" className="block text-sm font-bold text-gray-700 mb-2">
                    Competitor URL
                  </label>
                  <input
                    id="competitor-url"
                    type="text"
                    placeholder="competitor.com"
                    className="neo-input w-full text-lg border-[#7C3AED]"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    disabled={isDisabled}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isDisabled) {
                        handleAnalyze();
                      }
                    }}
                  />
                  <p className="mt-2 text-xs text-gray-500 font-medium">
                    💜 2 credits will be deducted for a side-by-side competitor analysis.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-[#FF5757] font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" />
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
              </svg>
              {error}
            </p>
            {mutationError && failureCount > 0 && (
              <p className="text-sm text-red-600 mt-1">
                Attempt {failureCount} failed. {
                  failureCount >= 3 ? 'Please try again later or contact support if the issue persists.' : ''
                }
              </p>
            )}
          </div>
        )}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono">
            <div>Status: {status}</div>
            <div>Auth: {user ? 'Logged in' : 'Not logged in'}</div>
            <div>Last scan: {lastScanTime ? new Date(lastScanTime).toLocaleString() : 'Never'}</div>
            <div>URL: {url || 'Not set'}</div>
            <div>Mode: {isComparisonMode ? 'Comparison' : 'Single'}</div>
          </div>
        )}
      </div>
    </div>
  );
}