// Types for Gemini suggestions
export type Status = 'good' | 'warning' | 'bad' | 'na';
export interface Detail {
  name: string;
  value: string;
  status: Status;
}

export type Severity = 'high' | 'medium' | 'low';
export interface Issue {
  title: string;
  description: string;
  severity: Severity;
}

export type Impact = 'high' | 'medium' | 'low';
export interface Recommendation {
  title: string;
  description: string;
  impact: Impact;
}

export interface GeminiSuggestions {
  issues: Issue[];
  recommendations: Recommendation[];
  metaTagsDetails: Detail[];
  contentDetails: Detail[];
  technicalDetails: Detail[];
  isFallback?: boolean; // Set to true when Gemini AI is unavailable and core audit fallback was used
}

export interface ComparisonInsights {
  winner: 'main' | 'competitor' | 'tie';
  summary: string;
  advantages: string[];    // Where the main site beats the competitor
  weaknesses: string[];   // Where the competitor beats the main site
  actionPlan: string[];   // Steps for main site to win
  isFallback?: boolean;   // Set to true when Gemini failed and defaults were used
}
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class CoreService {
  private readonly googleApiKey: string;
  private readonly geminiApiKey: string;

  constructor(private configService: ConfigService) {
    // Retrieve and validate API keys
    const googleApiKey = this.validateApiKey('GOOGLE_API_KEY');
    const geminiApiKey = this.validateApiKey('GEMINI_API_KEY');

    // Assign validated values to class properties
    this.googleApiKey = googleApiKey;
    this.geminiApiKey = geminiApiKey;
  }

  private validateApiKey(keyName: string): string {
    const value = this.configService.get<string>(keyName);

    if (!value?.trim()) {
      const errorMessage = `Missing required environment variable: ${keyName}. Please ensure it is set in your environment.`;
      console.error('Fatal configuration error:', errorMessage);
      throw new Error(errorMessage);
    }

    return value.trim();
  }

  // ... (getLighthouseReport method remains the same) ...
  async getLighthouseReport(url: string): Promise<any> {
    const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url,
    )}&key=${this.googleApiKey}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

    try {
      const response = await axios.get(apiEndpoint, {
        timeout: 60000, // 60 second timeout
        validateStatus: (status) => status === 200, // Only accept 200 status
      });

      if (!response.data?.lighthouseResult) {
        throw new Error('Invalid Lighthouse response format');
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Timeout fetching Lighthouse report:', error.message);
        throw new Error('Request timed out while fetching Lighthouse report.');
      } else {
        // Log non-sensitive API response context
        const status = error.response?.status;
        const responseData = error.response?.data;
        let truncatedData = '';
        if (responseData) {
          try {
            // Redact known sensitive fields
            if (typeof responseData === 'object') {
              const clone = { ...responseData };
              if (clone.token) clone.token = '[REDACTED]';
              if (clone.authorization) clone.authorization = '[REDACTED]';
              truncatedData = JSON.stringify(clone).slice(0, 500);
            } else {
              truncatedData = String(responseData).slice(0, 500);
            }
          } catch {
            truncatedData = '[Unserializable response data]';
          }
        }
        console.error('Error fetching Lighthouse report:', {
          message: error.message,
          url: apiEndpoint,
          status,
          response: truncatedData,
        });
        // Attach error code or cause if supported
        const err = new Error('Could not fetch Lighthouse report.');
        if (error.code) (err as any).code = error.code;
        if ('cause' in Error.prototype) (err as any).cause = error;
        throw err;
      }
    }
  }

  /**
   * Generates SEO improvement suggestions using the Google Gemini API.
   * @param lighthouseData The full Lighthouse report.
   * @returns Structured AI-powered suggestions.
   */
  async getGeminiSuggestions(lighthouseData: any): Promise<GeminiSuggestions> {
    const genAI = new GoogleGenerativeAI(this.geminiApiKey);

    // THE FIX IS HERE: Use the updated model name
    // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const { categories } = lighthouseData.lighthouseResult;

    // Extract specific audit data
    const audits = lighthouseData.lighthouseResult.audits;
    const mainMetrics = {
      FCP: audits['first-contentful-paint']?.numericValue,
      LCP: audits['largest-contentful-paint']?.numericValue,
      TBT: audits['total-blocking-time']?.numericValue,
      CLS: audits['cumulative-layout-shift']?.numericValue,
      TTI: audits['interactive']?.numericValue,
    };

    const seoAudits = Object.entries(audits)
      .filter(([_, audit]: [string, any]) => audit.group === 'seo')
      .map(([id, audit]: [string, any]) => ({
        id,
        score: audit.score,
        title: audit.title,
        description: audit.description,
      }));

    const prompt = `
      Analyze this specific Lighthouse report and generate detailed, personalized improvement suggestions.
      
      Current Metrics:
      - First Contentful Paint: ${(mainMetrics.FCP / 1000).toFixed(2)}s
      - Largest Contentful Paint: ${(mainMetrics.LCP / 1000).toFixed(2)}s
      - Total Blocking Time: ${mainMetrics.TBT}ms
      - Cumulative Layout Shift: ${mainMetrics.CLS}
      - Time to Interactive: ${(mainMetrics.TTI / 1000).toFixed(2)}s

      Performance Score: ${Math.round(categories.performance.score * 100)}%
      Accessibility Score: ${Math.round(categories.accessibility.score * 100)}%
      Best Practices Score: ${Math.round(categories['best-practices'].score * 100)}%
      SEO Score: ${Math.round(categories.seo.score * 100)}%

      Failed SEO Audits:
      ${seoAudits
        .filter((audit) => audit.score < 0.9)
        .map((audit) => `- ${audit.title}`)
        .join('\\n')}

      Format the response as a JSON object with:
      {
        "issues": [{ "title": string, "description": string, "severity": "high"|"medium"|"low" }],
        "recommendations": [{ "title": string, "description": string, "impact": "high"|"medium"|"low" }],
        "metaTagsDetails": [{ "name": string, "value": string, "status": "good"|"warning"|"bad" }],
        "contentDetails": [{ "name": string, "value": string, "status": "good"|"warning"|"bad" }],
        "technicalDetails": [{ "name": string, "value": string, "status": "good"|"warning"|"bad" }]
      }

      Important instructions for meta tags and content details:
      
      1. Meta Tags Section:
      - Include ALL meta tags found in the audit (title, description, viewport, robots, etc.)
      - For each tag, provide:
        - name: The type of meta tag
        - value: The actual content or "Missing" if not found
        - status: "good" if present and valid, "warning" if suboptimal, "bad" if missing
      
      2. Content Details Section:
      - Analyze key content elements:
        - Headings structure
        - Image alt texts
        - Content length
        - Link text quality
        - Structured data presence
      - For each element, provide specific details about what was found
      
      3. Technical Details Section:
      - Include the exact performance metrics and their implications
      - Focus on server response times, page size, and loading behavior
      
      Base all suggestions on the actual metrics and failed audits above. Be specific and provide actionable advice.
    `;

    try {
      // Add strict instructions for JSON format
      const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include any additional text, markdown formatting, or explanations. The response must start with '{' and end with '}'.`;

      const result = await model.generateContent(jsonPrompt);
      const response = await result.response;
      const text: string = response.text();

      // Enhanced JSON extraction and parsing
      let jsonString = text;

      // Remove markdown code blocks if present
      if (text.includes('```')) {
        const matches = text.match(/```(?:json)?([\s\S]*?)```/);
        if (matches && matches[1]) {
          jsonString = matches[1];
        }
      }

      // Clean up any remaining non-JSON content
      jsonString = jsonString.trim();
      if (!jsonString.startsWith('{')) {
        const jsonStart = jsonString.indexOf('{');
        if (jsonStart !== -1) {
          jsonString = jsonString.substring(jsonStart);
        }
      }

      try {
        const parsed: GeminiSuggestions = JSON.parse(jsonString);

        // Validate the parsed structure
        const validatedSuggestions: GeminiSuggestions = {
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations
            : [],
          metaTagsDetails: Array.isArray(parsed.metaTagsDetails)
            ? parsed.metaTagsDetails
            : [],
          contentDetails: Array.isArray(parsed.contentDetails)
            ? parsed.contentDetails
            : [],
          technicalDetails: Array.isArray(parsed.technicalDetails)
            ? parsed.technicalDetails
            : [],
        };

        return validatedSuggestions;
      } catch (parseError: any) {
        console.error('JSON Parse Error:', {
          error: parseError,
          receivedText: text,
          attemptedJsonString: jsonString,
        });
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error: any) {
      console.error('Error generating Gemini suggestions:', {
        error,
        message: error.message,
        details: error.details || 'No additional details',
      });

      // Provide a fallback response with error information
      const fallbackSuggestions: GeminiSuggestions = {
        issues: [
          {
            title: 'Analysis Error',
            description:
              'We encountered an error while analyzing your website. Please try again in a few moments.',
            severity: 'medium',
          },
        ],
        recommendations: [
          {
            title: 'Temporary Issue',
            description:
              'The AI analysis service is currently experiencing issues. Your Lighthouse scores are still accurate.',
            impact: 'low',
          },
        ],
        metaTagsDetails: [],
        contentDetails: [],
        technicalDetails: [],
      };

      return fallbackSuggestions;
    }
  }

  /**
   * Generates a side-by-side comparison analysis between two sites using Gemini AI.
   */
  async getGeminiComparison(
    mainUrl: string,
    mainData: any,
    competitorUrl: string,
    competitorData: any,
  ): Promise<ComparisonInsights> {
    const extractScores = (data: any) => {
      const { categories, audits } = data.lighthouseResult;
      return {
        performance: Math.round(categories.performance.score * 100),
        accessibility: Math.round(categories.accessibility.score * 100),
        bestPractices: Math.round(categories['best-practices'].score * 100),
        seo: Math.round(categories.seo.score * 100),
        fcp: audits['first-contentful-paint']?.displayValue ?? 'N/A',
        lcp: audits['largest-contentful-paint']?.displayValue ?? 'N/A',
        tbt: audits['total-blocking-time']?.displayValue ?? 'N/A',
        cls: audits['cumulative-layout-shift']?.displayValue ?? 'N/A',
      };
    };

    const mainScores = extractScores(mainData);
    const competitorScores = extractScores(competitorData);

    const prompt = `
You are an expert SEO Consultant. I am providing you with Google Lighthouse audit data for two competing websites.

Main Website: ${mainUrl}
Competitor Website: ${competitorUrl}

Main Website Scores:
- Performance: ${mainScores.performance}/100
- Accessibility: ${mainScores.accessibility}/100
- Best Practices: ${mainScores.bestPractices}/100
- SEO: ${mainScores.seo}/100
- First Contentful Paint: ${mainScores.fcp}
- Largest Contentful Paint: ${mainScores.lcp}
- Total Blocking Time: ${mainScores.tbt}
- Cumulative Layout Shift: ${mainScores.cls}

Competitor Website Scores:
- Performance: ${competitorScores.performance}/100
- Accessibility: ${competitorScores.accessibility}/100
- Best Practices: ${competitorScores.bestPractices}/100
- SEO: ${competitorScores.seo}/100
- First Contentful Paint: ${competitorScores.fcp}
- Largest Contentful Paint: ${competitorScores.lcp}
- Total Blocking Time: ${competitorScores.tbt}
- Cumulative Layout Shift: ${competitorScores.cls}

Analyze both datasets and return a STRICT JSON object with the following structure:
{
  "winner": "main" | "competitor" | "tie",
  "summary": "A 2-sentence executive summary of who is performing better overall and why.",
  "advantages": ["Specific point where Main Website beats the Competitor", "Another advantage..."],
  "weaknesses": ["Specific point where Competitor beats the Main Website", "Another weakness..."],
  "actionPlan": ["Concrete step #1 the main site should take to improve", "Step #2..."]
}

Rules:
- "winner" must be exactly "main", "competitor", or "tie"
- "advantages" must have at least 2 items
- "weaknesses" must have at least 2 items
- "actionPlan" must have at least 3 concrete, actionable steps
- DO NOT include markdown formatting or code blocks. Return pure JSON only.
`;

    const fallback: ComparisonInsights = {
      winner: mainScores.performance + mainScores.seo >= competitorScores.performance + competitorScores.seo ? 'main' : 'competitor',
      summary: `${mainUrl} scored ${mainScores.performance} on performance and ${mainScores.seo} on SEO, compared to ${competitorUrl} with ${competitorScores.performance} and ${competitorScores.seo} respectively.`,
      advantages: [
        mainScores.performance > competitorScores.performance ? `Higher Performance score (${mainScores.performance} vs ${competitorScores.performance})` : `Higher Accessibility score (${mainScores.accessibility} vs ${competitorScores.accessibility})`,
        mainScores.seo > competitorScores.seo ? `Higher SEO score (${mainScores.seo} vs ${competitorScores.seo})` : `Higher Best Practices score (${mainScores.bestPractices} vs ${competitorScores.bestPractices})`,
      ],
      weaknesses: [
        mainScores.performance <= competitorScores.performance ? `Lower Performance score (${mainScores.performance} vs ${competitorScores.performance})` : `Lower Accessibility score (${mainScores.accessibility} vs ${competitorScores.accessibility})`,
        mainScores.seo <= competitorScores.seo ? `Lower SEO score (${mainScores.seo} vs ${competitorScores.seo})` : `Lower Best Practices score (${mainScores.bestPractices} vs ${competitorScores.bestPractices})`,
      ],
      actionPlan: [
        'Audit and optimize your Core Web Vitals, specifically Largest Contentful Paint (LCP) and Total Blocking Time (TBT).',
        'Ensure all pages have unique meta descriptions and proper heading hierarchies to improve SEO score.',
        'Review accessibility failures to reach the WCAG AA standard and close the gap with the competitor.',
      ],
      isFallback: true,
    };

    try {
      const genAI = new GoogleGenerativeAI(this.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

      const result = await model.generateContent(
        `${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include any additional text, markdown formatting, or explanations. The response must start with '{' and end with '}'.`,
      );
      const text = result.response.text();

      let jsonString = text.trim();
      if (text.includes('```')) {
        const match = text.match(/```(?:json)?([\s\S]*?)```/);
        if (match?.[1]) jsonString = match[1].trim();
      }
      if (!jsonString.startsWith('{')) {
        const start = jsonString.indexOf('{');
        if (start !== -1) jsonString = jsonString.substring(start);
      }

      const parsed = JSON.parse(jsonString);
      const validWinners = ['main', 'competitor', 'tie'];

      return {
        winner: validWinners.includes(parsed.winner) ? parsed.winner : fallback.winner,
        summary: typeof parsed.summary === 'string' ? parsed.summary : fallback.summary,
        advantages: Array.isArray(parsed.advantages) && parsed.advantages.length > 0 ? parsed.advantages : fallback.advantages,
        weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : fallback.weaknesses,
        actionPlan: Array.isArray(parsed.actionPlan) && parsed.actionPlan.length > 0 ? parsed.actionPlan : fallback.actionPlan,
      };
    } catch (error) {
      console.error('[CoreService] getGeminiComparison failed, using fallback:', error);
      return fallback;
    }
  }
}

