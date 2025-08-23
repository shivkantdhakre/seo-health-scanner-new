// frontend/app/results/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getReport } from "@/lib/auth";
import { SeoResults } from "@/components/seo-results";
import { RefreshCw } from "lucide-react";
import type { Report, ApiError } from "@/lib/types";
import { LoadingPage } from "@/components/loading-spinner";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchReportData = async () => {
      try {
        const data = await getReport(id);
        if (data) {
          setReport(data);
          return true; // Stop polling
        }
        return false; // Continue polling
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || "Failed to load report. Please try again later.");
        console.error("Report fetch error:", err);

        // Increment retry count and stop polling after 3 failed attempts
        setRetryCount(prev => prev + 1);
        return retryCount >= 2; // Stop polling after 3 total attempts
      }
    };

    // Poll for the report every 5 seconds until it's available
    const interval = setInterval(async () => {
      const isFinished = await fetchReportData();
      if (isFinished) {
        clearInterval(interval);
      }
    }, 5000);

    // Initial fetch
    fetchReportData();

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [id, retryCount]);

  const handleRetry = () => {
    setError("");
    setRetryCount(0);
    setReport(null);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffe26d] p-4">
        <div className="neo-card bg-white text-center p-8 max-w-md">
          <div className="text-red-500 mb-4">
            <p className="text-xl font-bold mb-2">Error Loading Report</p>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="neo-button bg-[#FF5757] flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <LoadingPage
        title="Generating Your SEO Report..."
        message="Our AI is analyzing the Lighthouse data. This can take up to a minute. We'll automatically load your report when it's ready."
      />
    );
  }

  return <SeoResults reportData={report} />;
}