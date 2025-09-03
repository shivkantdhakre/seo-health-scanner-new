"use client";

import { useState, useCallback, useEffect } from "react";
import { validateUrl } from "@/lib/validation";
import { useInitiateScan, MIN_SCAN_INTERVAL } from "@/lib/hooks/useInitiateScan";
import type { ScanData } from "@/lib/types";
import { useDebugValue } from 'react';

interface SeoFormProps {
  onScanInitiated: (scanData: ScanData) => void;
}

export function SeoForm({ onScanInitiated }: SeoFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const {
    mutate: initiateScan,
    isPending,
    error: mutationError,
    status,
    failureCount,
  } = useInitiateScan();

  // Debug values for React DevTools
  useDebugValue({ url, status, error, lastScanTime });

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

  const handleAnalyze = useCallback(() => {
    console.debug('[SeoForm] Starting analysis:', {
      url,
      lastScanTime,
      timeSinceLastScan: Date.now() - lastScanTime
    });
    setError("");

    // Rate limiting: prevent spam submissions
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTime;

    if (timeSinceLastScan < MIN_SCAN_INTERVAL) {
      const remainingTime = Math.ceil((MIN_SCAN_INTERVAL - timeSinceLastScan) / 1000);
      setError(`Please wait ${remainingTime} seconds before starting another scan.`);
      return;
    }

    // Validate URL input
    const validation = validateUrl(url);
    if (!validation.isValid) {
      setError(validation.error || "Invalid URL");
      return;
    }

    // Use React Query mutation
    initiateScan(validation.sanitizedValue!, {
      onSuccess: (scanData) => {
        setLastScanTime(now);
        onScanInitiated(scanData);
      },
      onError: (error) => {
        setError(error.message || "Failed to start scan. Please try again.");
      },
    });
  }, [url, lastScanTime, initiateScan, onScanInitiated]);

  return (
    <div className="neo-card -rotate-1 bg-white">
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
            disabled={isPending}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isPending) {
                handleAnalyze();
              }
            }}
          />
          <button
            onClick={handleAnalyze}
            className={`neo-button text-lg uppercase transition-colors ${isPending
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#FF5757] hover:bg-[#FF4242]'
              }`}
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? "Analyzing..." : "Analyze SEO"}
          </button>
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
            <div>Last scan: {lastScanTime ? new Date(lastScanTime).toLocaleString() : 'Never'}</div>
            <div>URL: {url || 'Not set'}</div>
          </div>
        )}
      </div>
    </div>
  );
}