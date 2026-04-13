import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CoreService } from '../core/core.service';
import { ScanStatus, Prisma } from '@prisma/client';
import { GeminiSuggestions, Issue, Recommendation, Detail } from '../core/core.service';

@Processor('scan-queue')
export class ReportProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private coreService: CoreService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  // --- Helper Methods for Fallback Suggestions ---
  private scoreToStatus(score: number | null | undefined): 'good' | 'warning' | 'bad' | 'na' {
    if (score === null || score === undefined) return 'na';
    if (typeof score !== 'number' || isNaN(score)) return 'bad';
    if (score >= 0.9) return 'good';
    if (score >= 0.5) return 'warning';
    return 'bad';
  }

  private getAuditValue(audits: Record<string, any>, keys: string | string[]): any {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    for (const key of keyArray) {
      const audit = audits[key];
      if (audit) return audit;
    }
    return null;
  }

  private createBasicSuggestions(lighthouseData: any): GeminiSuggestions {
    const { categories, audits } = lighthouseData.lighthouseResult;
    const issues: Issue[] = [];
    const recommendations: Recommendation[] = [];
    const metaTagsDetails: Detail[] = [];
    const contentDetails: Detail[] = [];
    const technicalDetails: Detail[] = [];

    const fcp = this.getAuditValue(audits, 'first-contentful-paint');
    if (fcp) {
      technicalDetails.push({
        name: 'First Contentful Paint',
        value: typeof fcp.numericValue === 'number' ? `${(fcp.numericValue / 1000).toFixed(2)}s` : 'N/A',
        status: this.scoreToStatus(fcp.score),
      });
    }

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

    Object.entries(audits).forEach(([id, audit]: [string, any]) => {
      if (audit.score < 0.5 && audit.details?.type === 'opportunity') {
        issues.push({
          title: audit.title,
          description: audit.description,
          severity: audit.score === 0 ? 'high' : 'medium',
        });
      }
    });

    Object.entries(categories).forEach(([key, category]: [string, any]) => {
      if (category.score < 0.9) {
        recommendations.push({
          title: `Improve ${category.title}`,
          description: `Your ${category.title.toLowerCase()} score is ${Math.round(category.score * 100)}%. Review the specific audits in this category for detailed improvements.`,
          impact: category.score < 0.5 ? 'high' : 'medium',
        });
      }
    });

    return { issues, recommendations, metaTagsDetails, contentDetails, technicalDetails };
  }
  // --- End Helper Methods ---

  // This method fires automatically when a new job is added to the queue
  async process(job: Job<{ scanId: string; url: string }>) {
    const { scanId, url } = job.data;
    console.log(`[Worker] Picked up job ${job.id} for URL: ${url}`);

    try {
      // 1. Update status
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: ScanStatus.PROCESSING },
      });

      // --- EXPENSIVE API CALLS BEGIN ---
      const lighthouseData = await this.coreService.getLighthouseReport(url);
      if (!lighthouseData) throw new Error('Failed to fetch Lighthouse report.');

      let aiSuggestions;
      try {
        aiSuggestions = await this.coreService.getGeminiSuggestions(lighthouseData);
      } catch (error) {
        console.error('[Worker] Gemini failed, using basic fallback suggestions.');
        aiSuggestions = this.createBasicSuggestions(lighthouseData);
      }

      const { categories } = lighthouseData.lighthouseResult;
      
      const finalReportData = {
        lighthouseResult: lighthouseData as unknown as Prisma.InputJsonValue,
        aiSuggestions: aiSuggestions as unknown as Prisma.InputJsonValue,
        performanceScore: Math.round(categories.performance.score * 100),
        accessibilityScore: Math.round(categories.accessibility.score * 100),
        bestPracticesScore: Math.round(categories['best-practices'].score * 100),
        seoScore: Math.round(categories.seo.score * 100),
      };
      // --- EXPENSIVE API CALLS END ---

      // 2. Save to Database
      await this.prisma.$transaction([
        this.prisma.report.create({ data: { scanId, ...finalReportData } }),
        this.prisma.scan.update({ where: { id: scanId }, data: { status: ScanStatus.COMPLETED } }),
      ]);

      // 3. Save to Cache for 24 hours
      const cacheKey = `seo_report_${url}`;
      await this.cacheManager.set(cacheKey, finalReportData, 86400000);
      
      console.log(`[Worker] Job ${job.id} completed successfully!`);
    } catch (error) {
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: ScanStatus.FAILED },
      });
      console.error(`[Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  }
}