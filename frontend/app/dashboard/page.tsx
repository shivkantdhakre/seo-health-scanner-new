// frontend/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SeoForm } from "@/components/seo-form";
import { getScanHistory } from "@/lib/auth"; // API utility

// Define types for scan and report
interface Report {
  id: string;
  performanceScore: number;
  seoScore: number;
}

interface Scan {
  id: string;
  url: string;
  createdAt: string;
  report: Report | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch scan history on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await getScanHistory();
        setScans(historyData);
      } catch (error) {
        console.error("Failed to fetch scan history", error);
        // Redirect to login if unauthorized or error occurs
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [router]);

  const handleScanInitiated = (newScan: Scan) => {
    // Redirect to the results page immediately after submission
    router.push(`/results/${newScan.id}`);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#ffe26d]">
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-black tracking-tight uppercase mb-8">
          Your Dashboard
        </h1>

        {/* SEO Form for new scans */}
        <SeoForm onScanInitiated={handleScanInitiated} />

        {/* Display Scan History */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Scan History</h2>
          {isLoading ? (
            <p>Loading history...</p>
          ) : scans.length > 0 ? (
            <div className="space-y-4">
              {scans.map((scan) => (
                <div
                  key={scan.id}
                  className="neo-card bg-white flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-lg">{scan.url}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(scan.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/results/${scan.id}`)}
                    className="neo-button bg-blue-500"
                  >
                    {scan.report ? "View Report" : "Processing..."}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>You have no scan history yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}