// Shared type definitions for the SEO Health Scanner

export interface Report {
  id: string;
  scanId?: string;
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  url?: string; // The originally scanned URL
  lighthouseResult: {
    finalUrl: string;
    categories: LighthouseCategories;
    [key: string]: unknown; // Allow additional Lighthouse properties
  };
  aiSuggestions: AISuggestions;
}

export type ScanStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Scan {
  id: string;
  url: string;
  status: ScanStatus;
  isCacheHit: boolean;
  createdAt: string;
  report: Report | null;
}

export interface ScanData {
  id: string;
  createdAt: string;
  url: string;
  userId: string;
}

export interface AISuggestion {
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
}

export interface AIRecommendation {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

export interface DetailItem {
  name: string;
  value: string;
  status: "good" | "warning" | "bad";
}

export interface AISuggestions {
  issues: AISuggestion[];
  recommendations: AIRecommendation[];
  metaTagsDetails?: DetailItem[];
  contentDetails?: DetailItem[];
  technicalDetails?: DetailItem[];
}

export interface LighthouseCategory {
  score: number;
  title: string;
}

export interface LighthouseCategories {
  performance: LighthouseCategory;
  accessibility: LighthouseCategory;
  "best-practices": LighthouseCategory;
  seo: LighthouseCategory;
}

export interface LighthouseResult {
  finalUrl: string;
  categories: LighthouseCategories;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

