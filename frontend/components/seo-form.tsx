"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initiateScan } from "@/lib/auth"; // Make sure you have this API utility

// Step 1: Define the props interface for the component
interface SeoFormProps {
  onScanInitiated: (scanData: any) => void;
}

// Step 2: Use the props interface in the component definition
export function SeoForm({ onScanInitiated }: SeoFormProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }
    setError("");
    setIsLoading(true);

    let formattedUrl = url.trim();
    if (
      !formattedUrl.startsWith("http://") &&
      !formattedUrl.startsWith("https://")
    ) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl); // Validate URL
      
      // Step 3: Call the API and then the callback function
      const scanData = await initiateScan(formattedUrl);
      onScanInitiated(scanData);

    } catch (err) {
      setError("Please enter a valid URL or API submission failed.");
      console.error(err);
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