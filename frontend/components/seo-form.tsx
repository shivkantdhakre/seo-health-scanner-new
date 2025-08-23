"use client";

import { useState } from "react";
import { initiateScan } from "@/lib/auth";
import { validateUrl } from "@/lib/validation";
import type { ScanData, ApiError } from "@/lib/types";

interface SeoFormProps {
  onScanInitiated: (scanData: ScanData) => void;
}

// Step 2: Use the props interface in the component definition
export function SeoForm({ onScanInitiated }: SeoFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const handleAnalyze = async () => {
    setError("");

    // Rate limiting: prevent spam submissions (30 seconds between scans)
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTime;
    const minInterval = 30000; // 30 seconds

    if (timeSinceLastScan < minInterval) {
      const remainingTime = Math.ceil((minInterval - timeSinceLastScan) / 1000);
      setError(`Please wait ${remainingTime} seconds before starting another scan.`);
      return;
    }

    // Validate URL input
    const validation = validateUrl(url);
    if (!validation.isValid) {
      setError(validation.error || "Invalid URL");
      return;
    }

    setIsLoading(true);
    setLastScanTime(now);

    try {
      // Use the sanitized URL from validation
      const scanData = await initiateScan(validation.sanitizedValue!);
      onScanInitiated(scanData);

    } catch (err) {
      // Handle different types of errors
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as ApiError).message || "Failed to start scan. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Scan initiation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

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
            disabled={isLoading}
          />
          <button
            onClick={handleAnalyze}
            className="neo-button bg-[#FF5757] text-lg uppercase"
            disabled={isLoading}
          >
            {isLoading ? "Analyzing..." : "Analyze SEO"}
          </button>
        </div>
        {error && <p className="text-[#FF5757] font-bold mt-2">{error}</p>}
      </div>
    </div>
  );
}