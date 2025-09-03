import axios from "axios";
import { env } from "./env";
import { ScanData, ApiError } from "./types";

const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  withCredentials: true, // Enable sending cookies
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchSeoReport = async (scanId: string, signal?: AbortSignal) => {
  try {
    console.debug('[API] Fetching report:', { 
      scanId, 
      url: `/report/${scanId}`,
      cookies: document.cookie, // Log cookies for debugging
      headers: api.defaults.headers 
    });

    const { data } = await api.get(`/report/${scanId}`, { 
      signal,
      withCredentials: true // Ensure credentials are sent
    });
    
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[API] Report fetch error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          withCredentials: error.config?.withCredentials
        }
      });

      // Create new error with the original axios error as cause
      throw new Error(
        error.response?.data?.message || 
        `Failed to fetch SEO report (${error.response?.status})`,
        { cause: error }
      );
    }
    // For non-axios errors, rethrow as-is
    throw error;
  }
};

export const initiateScan = async (url: string): Promise<ScanData> => {
  try {
    const { data } = await api.post("/reports/scan", { url });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to initiate scan"
      );
    }
    throw error;
  }
};
