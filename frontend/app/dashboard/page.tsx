// frontend/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SeoForm } from "@/components/seo-form";
import { getScanHistory } from "@/lib/auth";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { Scan, ScanData, ApiError } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import UpgradeModal from "@/components/upgrade-modal";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Fetch scan history on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await getScanHistory();
        setScans(historyData);
        setError(""); // Clear any previous errors
      } catch (err) {
        console.error("Failed to fetch scan history", err);
        const apiError = err as ApiError;

        if (apiError.status === 401) {
          // Redirect to login if unauthorized
          router.push("/login");
        } else {
          setError(apiError.message || "Failed to load scan history");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [router]);

  const handleScanInitiated = (scanData: ScanData) => {
    // Redirect to the results page immediately after submission
    router.push(`/results/${scanData.id}`);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#ffe26d]">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-black tracking-tight uppercase">
            Your Dashboard
          </h1>
          {user && (
            <div className="neo-card bg-white flex items-center gap-4 py-2 px-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-4 border-black">
              <span className="font-bold text-gray-700 text-sm md:text-base">Credits:</span>
              <span className="text-xl md:text-2xl font-black text-[#FF5757]">{user.credits ?? 0}</span>
              <button
                onClick={() => setIsUpgradeOpen(true)}
                className="neo-button bg-[#00C853] text-white py-1 px-3 text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5"
              >
                Buy Credits
              </button>
            </div>
          )}
        </div>

        {/* SEO Form for new scans */}
        <SeoForm onScanInitiated={handleScanInitiated} />

        {/* Display Scan History */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Scan History</h2>
          {error && (
            <div className="neo-card bg-red-50 border-red-500 mb-6">
              <p className="text-red-700 font-bold">{error}</p>
            </div>
          )}
          {isLoading ? (
            <div className="neo-card bg-white text-center p-8">
              <LoadingSpinner message="Loading scan history..." />
            </div>
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
                    className={`neo-button ${scan.status === 'COMPLETED' ? 'bg-[#FFDE59]' : 'bg-gray-200 text-gray-500'}`}
                    disabled={scan.status !== 'COMPLETED'}
                  >
                    {scan.status === 'COMPLETED' ? "View Report" :
                      scan.status === 'FAILED' ? "Scan Failed" : "Processing..."}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>You have no scan history yet.</p>
          )}
        </div>
      </div>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </main>
  );
}