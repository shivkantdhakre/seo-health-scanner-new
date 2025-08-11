import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // This is crucial for sending cookies
});

// Function to initiate a scan
export const initiateScan = async (url: string) => {
  const response = await api.post('/report/scan', { url });
  return response.data;
};

// Function to get a specific report
export const getReport = async (id: string) => {
  const response = await api.get(`/report/${id}`);
  return response.data;
};

// Function to get scan history
export const getScanHistory = async () => {
    const response = await api.get('/report/history');
    return response.data;
};

// --- Add other API functions for login, signup etc. ---

// The fix is on the next two lines by adding ": string"
export const loginUser = async (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
};

export const signupUser = async (email: string, password: string) => {
    return api.post('/auth/signup', { email, password });
};