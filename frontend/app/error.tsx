"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FF5757] p-4">
      <div
        className="bg-white text-center p-10 md:p-16 max-w-lg w-full rotate-1"
        style={{
          border: "4px solid black",
          boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
        }}
      >
        {/* Error code badge */}
        <div
          className="inline-block bg-black text-white text-sm font-black uppercase tracking-widest px-4 py-1 mb-6"
          style={{ border: "2px solid black" }}
        >
          Server Error 500
        </div>

        <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter mb-2 leading-none">
          500
        </h1>
        <p className="text-2xl font-black uppercase tracking-tight mb-3">
          Something Went Wrong
        </p>
        <p className="text-gray-600 font-medium mb-8 max-w-sm mx-auto">
          Our server encountered an unexpected error. Our team has been notified. Please try again.
        </p>

        {/* Error digest for debugging */}
        {error?.digest && (
          <p className="font-mono text-xs text-gray-400 mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="font-black uppercase text-sm px-6 py-3"
            style={{
              border: "4px solid black",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              backgroundColor: "#FFDE59",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ↻ Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center font-black uppercase text-sm px-6 py-3"
            style={{
              border: "4px solid black",
              boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
              backgroundColor: "white",
              transition: "all 0.2s",
            }}
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
