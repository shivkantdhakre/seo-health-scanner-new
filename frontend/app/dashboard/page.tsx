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
import { ExternalLink, Zap, Globe, TrendingUp } from "lucide-react";

// Helper: determine if a scan was likely a cache hit based on createdAt proximity
// This is a heuristic — a true cache-hit field would require a backend change
function wasFast(scan: Scan): boolean {
  // Scans that went from PENDING to COMPLETED very quickly are likely cache hits
  // Since we don't have a direct field, we use the presence of a report as a proxy
  // TODO: add `isCacheHit` boolean to the Scan schema for definitive detection
  return false; // Intentionally conservative until schema supports it
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
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
        setError("");
      } catch (err) {
        console.error("Failed to fetch scan history", err);
        const apiError = err as ApiError;
        if (apiError.status === 401) {
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
    router.push(`/results/${scanData.id}`);
  };

  // Auth blocking: prevent flashing protected UI while session is evaluated
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffe26d]">
        <div className="neo-card bg-white p-10 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] -rotate-1">
          <div className="animate-spin h-10 w-10 border-4 border-black border-t-[#FF5757] rounded-full mx-auto mb-4" />
          <p className="font-black text-lg uppercase tracking-wide">Verifying Session...</p>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-[#00C853] text-white";
      case "PROCESSING": return "bg-[#FFB300] text-black";
      case "FAILED": return "bg-[#FF5757] text-white";
      default: return "bg-gray-200 text-gray-600";
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-[#ffe26d]">
      <div className="w-full max-w-4xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-4xl font-black tracking-tight uppercase">Your Dashboard</h1>
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

        {/* SEO Form */}
        <SeoForm onScanInitiated={handleScanInitiated} />

        {/* Scan History */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-7 w-7" />
            <h2 className="text-3xl font-black uppercase tracking-tight">Scan History</h2>
          </div>

          {error && (
            <div className="neo-card bg-red-50 border-[#FF5757] mb-6">
              <p className="text-red-700 font-bold">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="neo-card bg-white text-center p-8">
              <LoadingSpinner message="Loading scan history..." />
            </div>
          ) : scans.length > 0 ? (
            <div className="space-y-3">
              {scans.map((scan, idx) => {
                const isCompleted = scan.status === "COMPLETED";
                const isCacheHit = (scan as any).isCacheHit === true;

                return (
                  <div
                    key={scan.id}
                    onClick={() => isCompleted && router.push(`/results/${scan.id}`)}
                    className={`neo-card bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all duration-200 ${
                      isCompleted ? "cursor-pointer hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : ""
                    }`}
                  >
                    {/* Left: URL + metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {/* Cache hit / New Scan badge */}
                        {isCacheHit ? (
                          <span className="inline-flex items-center gap-1 bg-[#00C853] text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black">
                            <Zap className="h-2.5 w-2.5" /> Cache Hit (Free)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[#FFB300] text-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black">
                            <Globe className="h-2.5 w-2.5" /> New Scan (1 Credit)
                          </span>
                        )}
                        {/* Status badge */}
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 border-black ${getStatusStyle(scan.status)}`}>
                          {scan.status}
                        </span>
                      </div>
                      <p className="font-bold text-base truncate">{scan.url}</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {new Date(scan.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Right: CTA */}
                    {isCompleted && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/results/${scan.id}`); }}
                          className="neo-button bg-[#FFDE59] text-black py-2 px-4 text-sm flex items-center gap-1.5"
                        >
                          View Report <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {scan.status === "FAILED" && (
                      <span className="text-sm font-bold text-[#FF5757]">Scan Failed</span>
                    )}
                    {["PENDING", "PROCESSING"].includes(scan.status) && (
                      <span className="text-sm font-bold text-[#FFB300] animate-pulse">Processing...</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="neo-card bg-white text-center p-10">
              <p className="text-2xl font-black uppercase mb-2">No scans yet</p>
              <p className="text-gray-500 font-medium">Enter a URL above to run your first free SEO audit.</p>
            </div>
          )}
        </div>
      </div>
      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </main>
  );
}