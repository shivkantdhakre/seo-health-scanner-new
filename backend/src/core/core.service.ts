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
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('Timeout fetching Lighthouse report:', error.message);
        throw new Error('Request timed out while fetching Lighthouse report.');
      } else {
        // Log non-sensitive API response context
        let status = error.response?.status;
        let responseData = error.response?.data;
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
      } catch (parseError) {
        console.error('JSON Parse Error:', {
          error: parseError,
          receivedText: text,
          attemptedJsonString: jsonString,
        });
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
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
}
