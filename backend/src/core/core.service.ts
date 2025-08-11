import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class CoreService {
  private readonly googleApiKey: string;
  private readonly geminiApiKey: string;

  constructor(private configService: ConfigService) {
    this.googleApiKey = this.configService.get<string>('GOOGLE_API_KEY') as string;
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY') as string;
  }

  // ... (getLighthouseReport method remains the same) ...
  async getLighthouseReport(url: string): Promise<any> {
    const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url,
    )}&key=${this.googleApiKey}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;

    try {
      const response = await axios.get(apiEndpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching Lighthouse report:', error.message);
      throw new Error('Could not fetch Lighthouse report.');
    }
  }

  /**
   * Generates SEO improvement suggestions using the Google Gemini API.
   * @param lighthouseData The full Lighthouse report.
   * @returns Structured AI-powered suggestions.
   */
  async getGeminiSuggestions(lighthouseData: any): Promise<any> {
    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    
    // THE FIX IS HERE: Use the updated model name
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const { categories } = lighthouseData.lighthouseResult;

    const prompt = `
      Analyze the following Lighthouse report summary and generate actionable improvement suggestions.
      Format the output as a JSON object with two keys: "issues" and "recommendations".
      - "issues": An array of objects, each with "title", "description", and "severity" ('high', 'medium', 'low'). Focus on critical problems that need fixing.
      - "recommendations": An array of objects, each with "title", "description", and "impact" ('high', 'medium', 'low'). Focus on best-practice advice for further improvement.

      Lighthouse Scores:
      - Performance: ${Math.round(categories.performance.score * 100)}
      - Accessibility: ${Math.round(categories.accessibility.score * 100)}
      - Best Practices: ${Math.round(categories['best-practices'].score * 100)}
      - SEO: ${Math.round(categories.seo.score * 100)}

      Provide clear, concise, and developer-focused advice.
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '');
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error generating Gemini suggestions:', error);
      throw new Error('Could not get AI suggestions.');
    }
  }
}