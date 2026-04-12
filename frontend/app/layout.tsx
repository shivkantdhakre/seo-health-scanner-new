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
// It is great for SEO and for what users see when sharing links on social media.
export const metadata: Metadata = {
  title: "SEO Health Scanner - Free Website SEO Analysis Tool",
  description:
    "Analyze your website for SEO issues and get AI-powered recommendations for improvement. Free SEO audit tool with Lighthouse integration.",
  keywords: ['SEO', 'website analysis', 'SEO audit', 'Lighthouse', 'AI recommendations', 'website optimization'],
  metadataBase: new URL('https://seo-health-scanner.com'), // Update with your actual domain
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification
  },
  openGraph: {
    title: 'SEO Health Scanner - Free Website SEO Analysis',
    description: 'Get AI-powered insights to boost your website performance with our free SEO analysis tool.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Health Scanner - Free Website SEO Analysis',
    description: 'Get AI-powered insights to boost your website performance with our free SEO analysis tool.',
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