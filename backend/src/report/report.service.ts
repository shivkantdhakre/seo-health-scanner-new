// report.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, ScanStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('scan-queue') private scanQueue: Queue,
    private configService: ConfigService,
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
      console.log(
        `🚀 CACHE HIT in Service! Returning instantly for ${normalizedUrl}`,
      );

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
              lighthouseResult:
                cachedReport.lighthouseResult as unknown as Prisma.InputJsonValue,
              aiSuggestions:
                cachedReport.aiSuggestions as unknown as Prisma.InputJsonValue,
            },
          },
        },
      });

      return completeScan;
    }

    // 2. CACHE MISS
    console.log(
      `🐌 CACHE MISS. Adding ${normalizedUrl} to BullMQ worker queue...`,
    );
    const scan = await this.prisma.scan.create({
      data: { url, userId: user.id, status: ScanStatus.PENDING },
    });

    // 3. TOSS TO BACKGROUND WORKER
    await this.scanQueue.add('analyze-url', {
      scanId: scan.id,
      url: normalizedUrl,
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

  /**
   * Generates a PDF buffer of the report using Puppeteer.
   */
  async generatePdf(scanId: string, jwtToken: string): Promise<Buffer> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const targetUrl = `${frontendUrl}/results/${scanId}`;
    const hostname = new URL(frontendUrl).hostname;

    console.log(
      `[ReportService] Launching Puppeteer for PDF export of: ${targetUrl}`,
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Inject JWT cookie
      await page.setCookie({
        name: 'jwt',
        value: jwtToken,
        domain: hostname,
        path: '/',
        httpOnly: true,
        secure: false, // Localhost/development fallback
      });

      // Navigate to target URL and wait for network to be idle
      await page.goto(targetUrl, {
        waitUntil: 'networkidle0',
      });

      // Inject CSS to professionalize the report layout, expand all content, disable animations, and hide navigation
      await page.addStyleTag({
        content: `
          /* 1. Global Reset & Animation Disable */
          *, *::before, *::after {
            transition: none !important;
            animation: none !important;
            transition-duration: 0s !important;
            animation-duration: 0s !important;
          }

          /* 2. Professional Clean Background for Office Reports */
          body, html, main, div[class*="from-[#ffe26d]"], .min-h-screen {
            background: white !important;
            background-color: white !important;
            background-image: none !important;
            color: #1f2937 !important; /* dark gray text */
          }

          /* 3. Remove Brutalist Tilted/Slanted Cards */
          .neo-card, .neo-badge, [class*="rotate"] {
            transform: none !important;
            rotate: 0deg !important;
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important; /* clean light border instead of thick black */
            border-radius: 8px !important;
          }

          /* 4. Clean Header & Text Styling */
          h1, h2, h3, h4, h5, h6 {
            color: #111827 !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            text-shadow: none !important;
          }

          /* 5. Hide UI Controls, Navigation and Tab Lists */
          nav, 
          header, 
          footer, 
          button, 
          .neo-button,
          a[href*="/dashboard"], 
          .fixed,
          [role="tablist"] {
            display: none !important;
          }

          /* 6. Expand Tabs, Accordions and Dropdowns */
          [role="tabpanel"],
          .tab-content,
          [data-state="closed"],
          [data-state] {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            height: auto !important;
            max-height: none !important;
            transform: none !important;
          }

          /* 7. Remove Scrollbars and Height Constraints */
          * {
            overflow: visible !important;
            max-height: none !important;
          }
          
          body, html {
            height: auto !important;
            overflow: visible !important;
          }

          /* 8. Prevent Page Breaks inside components */
          .neo-card, 
          div[class*="card"], 
          li,
          section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        `,
      });

      // Generate A4 PDF buffer
      const pdfUint8 = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      return Buffer.from(pdfUint8);
    } catch (error) {
      console.error('[ReportService] Error during PDF generation:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}
