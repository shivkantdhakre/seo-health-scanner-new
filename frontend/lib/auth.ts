import axios, { AxiosError } from "axios";
import type { ScanData, Scan, Report, ApiError } from "./types";
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
    const apiError: ApiError = {
      message: "An unexpected error occurred",
      status: error.response?.status,
    };

    if (error.response?.status === 401) {
      apiError.message = "Authentication required. Please log in.";
    } else if (error.response?.status === 403) {
      apiError.message = "Access denied. You do not have permission.";
    } else if (error.response?.status === 404) {
      apiError.message = "Resource not found.";
    } else if (error.response?.status === 429) {
      apiError.message = "Too many requests. Please try again later.";
    } else if (error.response?.status && error.response.status >= 500) {
      apiError.message = "Server error. Please try again later.";
    } else if (error.code === "ECONNABORTED") {
      apiError.message = "Request timeout. Please try again.";
    } else if (error.message) {
      apiError.message = error.message;
    }

    return Promise.reject(apiError);
  }
);

// Function to initiate a scan
export const initiateScan = async (url: string): Promise<ScanData> => {
  const response = await api.post("/report/scan", { url });
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
