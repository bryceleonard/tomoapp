// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Log the API configuration
console.log('API Configuration:', {
  baseUrl: API_BASE_URL,
  isLocalhost: API_BASE_URL.includes('localhost'),
  isIP: API_BASE_URL.includes('192.168'),
}); 