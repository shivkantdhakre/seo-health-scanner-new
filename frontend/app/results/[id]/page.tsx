// frontend/app/results/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getReport } from "@/lib/auth"; // API utility
import { SeoResults } from "@/components/seo-results";
import { Loader2 } from "lucide-react";

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

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
        setError("Failed to load report. Please try again later.");
        console.error(err);
        return true; // Stop polling on error
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
  }, [id]);

  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }

  if (!report) {
    return <LoadingResults />;
  }

  return <SeoResults reportData={report} />;
}

// Loading component
function LoadingResults() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFDE59]">
        <div className="neo-card bg-white text-center p-12 -rotate-1 space-y-6">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-[#FF5757]" />
            <p className="text-2xl font-bold">Generating Your SEO Report...</p>
            <p className="text-lg font-medium max-w-md mx-auto">
                Our AI is analyzing the Lighthouse data. This can take up to a minute. We'll automatically load your report when it's ready.
            </p>
        </div>
    </div>
  );
}