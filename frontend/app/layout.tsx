import type React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
// import { ErrorBoundary } from "@/components/error-boundary";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// This metadata object defines the default title and description for all pages.
// It's great for SEO and for what users see in their browser tabs.
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
      {/* The "children" prop here will be replaced by the content of the currently active page */}
      <body className={spaceGrotesk.className}>
        {children}
      </body>
    </html>
  );
}