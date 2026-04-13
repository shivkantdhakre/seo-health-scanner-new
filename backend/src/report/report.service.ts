// report.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, ScanStatus } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('scan-queue') private scanQueue: Queue,
  ) {}

  /**
   * Initiates an SEO scan for a given URL.
   */
  async initiateScan(url: string, user: User) {
    const normalizedUrl = url.replace(/\/$/, '').toLowerCase();
    const cacheKey = `seo_report_${normalizedUrl}`;

    // 1. CHECK CACHE FIRST
    const cachedReport = (await this.cacheManager.get(cacheKey)) as any;

    if (cachedReport) {
      console.log(`🚀 CACHE HIT in Service! Returning instantly for ${normalizedUrl}`);
      
      // RESTORED: Use a single strict transaction for the cache hit
      const [scan] = await this.prisma.$transaction([
        this.prisma.scan.create({
          data: { url, userId: user.id, status: ScanStatus.COMPLETED },
        }),
        // We can't access scan.id before it's created in a standard array transaction,
        // but Prisma allows nested creates which is even cleaner!
      ]);

      // Actually, the safest transaction pattern for relational data in Prisma is nested creation:
      const completeScan = await this.prisma.scan.create({
        data: {
          url,
          userId: user.id,
          status: ScanStatus.COMPLETED,
          report: {
            create: {
              performanceScore: cachedReport.performanceScore,
              accessibilityScore: cachedReport.accessibilityScore,
              bestPracticesScore: cachedReport.bestPracticesScore,
              seoScore: cachedReport.seoScore,
              lighthouseResult: cachedReport.lighthouseResult as unknown as Prisma.InputJsonValue,
              aiSuggestions: cachedReport.aiSuggestions as unknown as Prisma.InputJsonValue,
            }
          }
        }
      });

      return completeScan;
    }

    // 2. CACHE MISS
    console.log(`🐌 CACHE MISS. Adding ${normalizedUrl} to BullMQ worker queue...`);
    const scan = await this.prisma.scan.create({
      data: { url, userId: user.id, status: ScanStatus.PENDING },
    });

    // 3. TOSS TO BACKGROUND WORKER
    await this.scanQueue.add('analyze-url', { 
      scanId: scan.id, 
      url: normalizedUrl 
    });

    return scan;
  }

  /**
   * Fetches a specific report by its ID.
   */
  async getReportById(id: string, user: User) {
    console.debug('[ReportService] Fetching report for id:', id);

    const scan = await this.prisma.scan.findFirst({
      where: { id, userId: user.id },
      include: {
        report: true,
      },
    });

    // RESTORED: Verbose debugging logs
    console.debug('[ReportService] Scan result:', {
      id,
      found: !!scan,
      status: scan?.status,
      hasReport: !!scan?.report,
    });

    if (!scan) {
      return null;
    }

    const response = {
      status: scan.status,
      url: scan.url,
      report: scan.report,
    };

    // RESTORED: Verbose debugging logs
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
   */
  async getScanHistory(user: User) {
    return this.prisma.scan.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}