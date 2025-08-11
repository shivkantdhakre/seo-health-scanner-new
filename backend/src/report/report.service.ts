// report.service.ts
// This service handles the core logic of the application.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoreService } from '../core/core.service';
import { User } from '@prisma/client';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private coreService: CoreService,
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
    this.runAnalysis(scan.id, url);

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
    return this.prisma.report.findFirst({
      where: { scanId: id, scan: { userId: user.id } },
    });
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
   * The main analysis pipeline.
   * This runs in the background after a scan is initiated.
   * @param scanId The ID of the current scan.
   * @param url The URL to analyze.
   */
  private async runAnalysis(scanId: string, url: string) {
    try {
      // Step 1: Fetch Lighthouse data from Google PageSpeed Insights API
      const lighthouseData = await this.coreService.getLighthouseReport(url);
      if (!lighthouseData) {
        throw new Error('Failed to fetch Lighthouse report.');
      }

      // Step 2: Generate AI-powered improvement suggestions using Gemini
      const aiSuggestions = await this.coreService.getGeminiSuggestions(
        lighthouseData,
      );

      // Step 3: Extract key scores from the Lighthouse report
      const { categories } = lighthouseData.lighthouseResult;
      const performanceScore = Math.round(categories.performance.score * 100);
      const accessibilityScore = Math.round(categories.accessibility.score * 100);
      const bestPracticesScore = Math.round(
        categories['best-practices'].score * 100,
      );
      const seoScore = Math.round(categories.seo.score * 100);

      // Step 4: Store the complete report and AI suggestions in the database
      await this.prisma.report.create({
        data: {
          scanId,
          performanceScore,
          accessibilityScore,
          bestPracticesScore,
          seoScore,
          lighthouseResult: lighthouseData, // Store the full JSON
          aiSuggestions: aiSuggestions, // Store the AI suggestions
        },
      });

      console.log(`Analysis complete for scan ID: ${scanId}`);
    } catch (error) {
      console.error(`Analysis failed for scan ID: ${scanId}`, error);
      // Here you could add more robust error handling, like updating the
      // scan status to 'failed' in the database.
    }
  }
}