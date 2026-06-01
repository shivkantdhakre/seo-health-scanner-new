import axios, { AxiosError } from "axios";
import type { ScanData, Scan, Report } from "./types";
import { ApiError } from "./types";
import { env } from "./env";

// Create an Axios instance
const api = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true, // This is crucial for sending cookies
  timeout: 30000, // 30 second timeout
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const serverMessage = (error.response?.data as any)?.message;
    const extractedMessage = Array.isArray(serverMessage)
      ? serverMessage.join(", ")
      : typeof serverMessage === "string"
      ? serverMessage
      : null;

    let message = "An unexpected error occurred";
    const status = error.response?.status;

    if (status === 401) {
      message = extractedMessage || "Authentication required. Please log in.";
    } else if (status === 403) {
      message = extractedMessage || "Access denied. You do not have permission.";
    } else if (status === 404) {
      message = extractedMessage || "Resource not found.";
    } else if (status === 429) {
      message = extractedMessage || "Too many requests. Please try again later.";
    } else if (status && status >= 500) {
      message = extractedMessage || "Server error. Please try again later.";
    } else if (error.code === "ECONNABORTED") {
      message = "Request timeout. Please try again.";
    } else if (extractedMessage) {
      message = extractedMessage;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new ApiError(message, status));
  }
);

// Function to initiate a scan
export const initiateScan = async (url: string): Promise<ScanData> => {
  const response = await api.post("/report/scan", { url });
  return response.data;
};

// Function to initiate a competitor comparison scan (costs 2 credits)
export const initiateComparison = async (
  url: string,
  competitorUrl: string
): Promise<ScanData> => {
  const response = await api.post("/report/compare", { url, competitorUrl });
  return response.data;
};

// Function to get a specific report
export const getReport = async (id: string): Promise<Report | null> => {
  const response = await api.get(`/report/${id}`);
  return response.data;
};

// Function to get scan history
export const getScanHistory = async (): Promise<Scan[]> => {
  const response = await api.get("/report/history");
  return response.data;
};

// --- Add other API functions for login, signup etc. ---

// Authentication functions
export const loginUser = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    // Re-throw with better error handling - the interceptor will handle the ApiError format
    throw error;
  }
};

export const signupUser = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    const response = await api.post("/auth/signup", { email, password });
    return response.data;
  } catch (error) {
    // Re-throw with better error handling - the interceptor will handle the ApiError format
    throw error;
  }
};

// Fetch the current logged-in user's profile
export const getUserProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

// Log the user out
export const logoutUser = async (): Promise<void> => {
  await api.post("/auth/logout");
};
