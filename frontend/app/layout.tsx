import type React from "react";
import "./globals.css";
import type { Metadata } from "next";

// This metadata object defines the default title and description for all pages.
// It's great for SEO and for what users see in their browser tabs.
export const metadata: Metadata = {
  title: "SEO Health Scanner - Check Your Website's SEO",
  description:
    "Analyze your website for SEO issues and get AI-powered recommendations for improvement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* These links connect to Google Fonts to load the "Space Grotesk" font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* The "children" prop here will be replaced by the content of the currently active page */}
      <body>{children}</body>
    </html>
  );
}