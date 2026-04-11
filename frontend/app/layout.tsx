import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/lib/AuthContext";
import Providers from "./providers";
import Navbar from "@/components/Navbar"; // Import the Navbar we created

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// This metadata object defines the default title and description for all pages.
export const metadata: Metadata = {
  title: "SEO Health Scanner - Check Your Website's SEO",
  description:
    "Analyze your website for SEO issues and get AI-powered recommendations for improvement.",
  metadataBase: new URL('https://seo-health-scanner.com'), // Update with your actual domain
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>
        {/* Providers (like React Query) wrap everything */}
        <Providers>
          {/* AuthProvider wraps the UI so Navbar and pages know who is logged in */}
          <AuthProvider>
            {/* ErrorBoundary catches client-side crashes */}
            <ErrorBoundary>

              {/* Navbar sits above all page content */}
              <Navbar />

              {/* The actual page content loads here */}
              <main>
                {children}
              </main>

            </ErrorBoundary>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}