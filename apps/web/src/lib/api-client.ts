import { createApiClient } from '@repo/api-client';

// Initialize API client with environment variable
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = createApiClient(apiUrl);

export const apiClient = api.client;

// Helper to set auth token (call after login)
export function setAuthToken(token: string) {
  apiClient.setToken(token);
}

// Helper to clear auth token (call on logout)
export function clearAuthToken() {
  apiClient.setToken('' as any);
}

export default apiClient;
