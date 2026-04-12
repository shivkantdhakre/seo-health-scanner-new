"use client";
import { useRouter } from "next/navigation";
import { SeoForm } from "@/components/seo-form";
import type { ScanData } from "@/lib/types";


export default function Home() {
  const router = useRouter();

  // Function to handle the redirect when a scan finishes generating
  const handleScanInitiated = (scanData: ScanData) => {
    router.push(`/results/${scanData.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <main className="py-20 px-4 md:px-8 flex flex-col items-center justify-center bg-[#FFDE59] border-b-4 border-black">
        <div className="w-full max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-2 font-bold mb-4 transform -rotate-2">
            🚀 Free AI-Powered SEO Checker
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight uppercase leading-tight">
            Is your website <br />
            <span className="text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">healthy?</span>
          </h1>
          
          <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto text-gray-900">
            Drop your URL below for an instant, brutally honest SEO checkup. We analyze performance, accessibility, and rankings in seconds.
          </p>
          
          <div className="mt-8 max-w-2xl mx-auto">
            {/* Form fixed with the correct redirect prop */}
            <SeoForm onScanInitiated={handleScanInitiated} />
          </div>
        </div>
      </main>

      {/* 2. WHAT WE CHECK SECTION */}
      <section className="py-20 px-4 md:px-8 bg-white border-b-4 border-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center uppercase mb-16">
            Comprehensive <span className="text-[#FF5757]">SEO Analysis</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="neo-card bg-[#e2f1ff] p-8">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3">Performance & Speed</h3>
              <p className="font-medium text-gray-700">
                We analyze your Core Web Vitals, First Contentful Paint, and Time to Interactive to ensure your site loads blazingly fast.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="neo-card bg-[#ffe26d] p-8">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-3">On-Page SEO</h3>
              <p className="font-medium text-gray-700">
                Checks for missing meta tags, broken structures, valid canonicals, and proper heading hierarchies that Google looks for.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="neo-card bg-[#ffdddd] p-8">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-2xl font-bold mb-3">Gemini AI Insights</h3>
              <p className="font-medium text-gray-700">
                Beyond raw data, our AI acts as your personal SEO consultant, giving you step-by-step plain-English instructions on how to fix issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="py-20 px-4 md:px-8 bg-gray-100 border-b-4 border-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-black uppercase mb-16">How it works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="bg-white border-4 border-black p-6 relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-black text-white font-black text-2xl flex items-center justify-center rounded-full absolute -top-6 -left-6 border-4 border-white">1</div>
              <h4 className="text-xl font-bold mb-2 mt-4">Enter URL</h4>
              <p className="font-medium text-gray-600">Type in any public website address you want to analyze.</p>
            </div>
            
            <div className="bg-white border-4 border-black p-6 relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-black text-white font-black text-2xl flex items-center justify-center rounded-full absolute -top-6 -left-6 border-4 border-white">2</div>
              <h4 className="text-xl font-bold mb-2 mt-4">Cloud Audit</h4>
              <p className="font-medium text-gray-600">Our backend runs a headless Lighthouse audit and queries Google Pagespeed APIs.</p>
            </div>

            <div className="bg-white border-4 border-black p-6 relative z-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-[#FF5757] text-white font-black text-2xl flex items-center justify-center rounded-full absolute -top-6 -left-6 border-4 border-black">3</div>
              <h4 className="text-xl font-bold mb-2 mt-4">Get Actionable Report</h4>
              <p className="font-medium text-gray-600">Review your scores, fix the red warnings, and watch your organic traffic grow.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 4. FOOTER / CTA */}
      <footer className="py-12 bg-black text-white text-center px-4">
        <h2 className="text-3xl font-black mb-6">Stop guessing. Start ranking.</h2>
        <p className="text-gray-400 font-medium max-w-xl mx-auto mb-8">
          Join webmasters and agencies using our tool to keep their technical SEO in perfect health.
        </p>
        <p className="text-sm text-gray-500 font-bold">© {new Date().getFullYear()} SEO Health Scanner. All rights reserved.</p>
      </footer>
    </div>
  );
}