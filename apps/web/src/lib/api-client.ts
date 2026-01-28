import { ApiClient } from '@repo/api-client';

// Initialize API client with environment variable
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = new ApiClient(apiUrl);

// Helper to set auth token (call after login)
export function setAuthToken(token: string) {
  apiClient.setToken(token);
}

// Helper to clear auth token (call on logout)
export function clearAuthToken() {
  apiClient.setToken(null);
}

export default apiClient;
