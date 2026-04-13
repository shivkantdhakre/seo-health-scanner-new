// report.service.ts
// This service handles the core logic of the application.

import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CoreService } from '../core/core.service';
import { Prisma, User, ScanStatus } from '@prisma/client';
import {
  GeminiSuggestions,
  Issue,
  Recommendation,
  Detail,
} from '../core/core.service';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private coreService: CoreService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Initiates an SEO scan for a given URL.
   * @param url The URL to scan.
   * @param user The user initiating the scan.
   * @returns The newly created scan record.
   */
  async initiateScan(url: string, user: User) {
    // 1. Create a new scan record in the database
    const scan = await this.prisma.scan.create({
      data: {
        url,
        userId: user.id,
      },
    });

    // 2. Asynchronously run the full analysis (don't block the response)
    void this.runAnalysis(scan.id, url);

    // 3. Immediately return the scan ID to the user
    return scan;
  }

  /**
   * Fetches a specific report by its ID.
   * @param id The ID of the scan/report.
   * @param user The user requesting the report.
   * @returns The report data.
   */
  async getReportById(id: string, user: User) {
    console.debug('[ReportService] Fetching report for id:', id);

    // Get both scan and report in a single query
    const scan = await this.prisma.scan.findFirst({
      where: { id, userId: user.id },
      include: {
        report: true,
      },
    });

    console.debug('[ReportService] Scan result:', {
      id,
      found: !!scan,
      status: scan?.status,
      hasReport: !!scan?.report,
    });

    if (!scan) {
      return null;
    }

    // Log the data we're about to return
    const response = {
      status: scan.status,
      url: scan.url, // Include the original scanned URL
      report: scan.report,
    };

    console.debug('[ReportService] Returning report data:', {
      scanId: id,
      status: response.status,
      hasReport: !!response.report,
      scores: response.report
        ? {
            performance: response.report.performanceScore,
            seo: response.report.seoScore,
          }
        : null,
    });

    return response;
  }

  /**
   * Fetches all scan histories for a user.
   * @param user The user whose scan history is being requested.
   * @returns A list of the user's scans.
   */
  async getScanHistory(user: User) {
    return this.prisma.scan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Converts a Lighthouse score to a status string
   */
  private scoreToStatus(
    score: number | null | undefined,
  ): 'good' | 'warning' | 'bad' | 'na' {
    if (score === null || score === undefined) return 'na';
    if (typeof score !== 'number' || isNaN(score)) return 'bad';
    if (score >= 0.9) return 'good';
    if (score >= 0.5) return 'warning';
    return 'bad';
  }

  /**
   * Safely gets an audit value and handles missing or malformed data
   */
  private getAuditValue(
    audits: Record<string, any>,
    keys: string | string[],
  ): any {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    for (const key of keyArray) {
      const audit = audits[key];
      if (audit) return audit;
    }
    return null;
  }

  /**
   * Creates basic suggestions from Lighthouse data when AI analysis fails
   */
  private createBasicSuggestions(lighthouseData: any): GeminiSuggestions {
    const { categories, audits } = lighthouseData.lighthouseResult;
    const issues: Issue[] = [];
    const recommendations: Recommendation[] = [];
    const metaTagsDetails: Detail[] = [];
    const contentDetails: Detail[] = [];
    const technicalDetails: Detail[] = [];

    // Add performance-related details
    const fcp = this.getAuditValue(audits, 'first-contentful-paint');
    if (fcp) {
      technicalDetails.push({
        name: 'First Contentful Paint',
        value:
          typeof fcp.numericValue === 'number'
            ? `${(fcp.numericValue / 1000).toFixed(2)}s`
            : 'N/A',
        status: this.scoreToStatus(fcp.score),
      });
    }

    // Add SEO-related details
    const seoAudits = {
      'meta-description': 'Meta Description',
      'meta-viewport': 'Viewport Meta Tag',
      'robots-txt': 'Robots.txt',
      canonical: 'Canonical URL',
      hreflang: 'hreflang Tags',
      'is-crawlable': 'Crawlability',
      'crawlable-anchors': 'Crawlable Anchors',
    };

    Object.entries(seoAudits).forEach(([auditKey, displayName]) => {
      const audit = this.getAuditValue(audits, auditKey);
      if (audit) {
        metaTagsDetails.push({
          name: displayName,
          value: audit.displayValue ?? audit.title ?? 'N/A',
          status: this.scoreToStatus(audit.score),
        });
      }
    });

    // Add content-related details
    const contentAudits = [
      { keys: ['document-title'], name: 'Page Title' },
      { keys: ['heading-order'], name: 'Heading Structure' },
      { keys: ['image-alt'], name: 'Image Alt Text' },
      { keys: ['link-text', 'link-name'], name: 'Link Text Quality' },
      { keys: ['structured-data'], name: 'Structured Data' },
      { keys: ['content-width'], name: 'Content Width' },
    ];

    contentAudits.forEach(({ keys, name }) => {
      const audit = this.getAuditValue(audits, keys);
      if (audit) {
        contentDetails.push({
          name,
          value: audit.title || audit.displayValue || 'N/A',
          status: this.scoreToStatus(audit.score),
        });
      }
    });

    // Add critical issues
    Object.entries(audits).forEach(([id, audit]: [string, any]) => {
      if (audit.score < 0.5 && audit.details?.type === 'opportunity') {
        issues.push({
          title: audit.title,
          description: audit.description,
          severity: audit.score === 0 ? 'high' : 'medium',
        });
      }
    });

    // Add recommendations
    Object.entries(categories).forEach(([key, category]: [string, any]) => {
      if (category.score < 0.9) {
        recommendations.push({
          title: `Improve ${category.title}`,
          description: `Your ${category.title.toLowerCase()} score is ${Math.round(category.score * 100)}%. Review the specific audits in this category for detailed improvements.`,
          impact: category.score < 0.5 ? 'high' : 'medium',
        });
      }
    });

    return {
      issues,
      recommendations,
      metaTagsDetails,
      contentDetails,
      technicalDetails,
    };
  }

  /**
   * The main analysis pipeline.
   * This runs in the background after a scan is initiated.
   * @param scanId The ID of the current scan.
   * @param url The URL to analyze.
   */
  private async runAnalysis(scanId: string, url: string) {
    console.debug('[ReportService] Starting analysis:', { scanId, url });
    try {
      // 1. Update status to processing
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: ScanStatus.PROCESSING },
      });

      // 2. Normalize the URL for the cache key (removes trailing slashes)
      const normalizedUrl = url.replace(/\/$/, '').toLowerCase();
      const cacheKey = `seo_report_${normalizedUrl}`;

      // 3. CHECK THE CACHE FIRST (The SaaS Magic)
      // FIX: Removed the generic <any> which breaks in cache-manager v6, explicitly cast to `any`
      const cachedReport = (await this.cacheManager.get(cacheKey)) as any;

      if (cachedReport) {
        console.log(
          `🚀 CACHE HIT! Reusing recent report for ${normalizedUrl} (Saved Google/Gemini Quota)`,
        );

        // Immediately save the cached data to the new user's scan
        await this.prisma.$transaction([
          this.prisma.report.create({
            data: {
              scanId,
              performanceScore: cachedReport.performanceScore,
              accessibilityScore: cachedReport.accessibilityScore,
              bestPracticesScore: cachedReport.bestPracticesScore,
              seoScore: cachedReport.seoScore,
              // FIX: Explicitly tell Prisma this is valid JSON
              lighthouseResult: cachedReport.lighthouseResult as unknown as Prisma.InputJsonValue,
              aiSuggestions: cachedReport.aiSuggestions as unknown as Prisma.InputJsonValue,
            },
          }),
          this.prisma.scan.update({
            where: { id: scanId },
            data: { status: ScanStatus.COMPLETED },
          }),
        ]);
        return; // Exit early! No APIs called.
      }

      console.log(
        `🐌 CACHE MISS! Running full Lighthouse & Gemini audit for ${normalizedUrl}...`,
      );

      // --- EXPENSIVE API CALLS BEGIN ---
      const lighthouseData = await this.coreService.getLighthouseReport(url);
      if (!lighthouseData) {
        throw new Error('Failed to fetch Lighthouse report.');
      }

      let aiSuggestions: GeminiSuggestions;
      try {
        aiSuggestions =
          await this.coreService.getGeminiSuggestions(lighthouseData);
      } catch (error) {
        aiSuggestions = this.createBasicSuggestions(lighthouseData);
      }

      const { categories } = lighthouseData.lighthouseResult;
      const performanceScore = Math.round(categories.performance.score * 100);
      const accessibilityScore = Math.round(
        categories.accessibility.score * 100,
      );
      const bestPracticesScore = Math.round(
        categories['best-practices'].score * 100,
      );
      const seoScore = Math.round(categories.seo.score * 100);
      // --- EXPENSIVE API CALLS END ---

      // Create the object we want to save
      const finalReportData = {
        // FIX: Explicitly cast to Prisma.InputJsonValue for strict typing
        lighthouseResult: lighthouseData as unknown as Prisma.InputJsonValue,
        aiSuggestions: aiSuggestions as unknown as Prisma.InputJsonValue,
        performanceScore,
        accessibilityScore,
        bestPracticesScore,
        seoScore,
      };

      // 4. Save to Database
      await this.prisma.$transaction([
        this.prisma.report.create({
          data: {
            scanId,
            ...finalReportData,
          },
        }),
        this.prisma.scan.update({
          where: { id: scanId },
          data: { status: ScanStatus.COMPLETED },
        }),
      ]);

      // 5. SAVE TO CACHE FOR NEXT TIME (Expires in 24 hours / 86400000ms)
      await this.cacheManager.set(cacheKey, finalReportData, 86400000);
      console.log(`✅ Saved new report to cache for ${normalizedUrl}`);
    } catch (error) {
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: ScanStatus.FAILED },
      });
      console.error(`Analysis failed for scan ID: ${scanId}`, error);
    }
  }
}