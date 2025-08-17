/**
 * Get the main bot API URL from environment variables
 * @returns The bot API base URL
 */
export function getBotApiUrl(): string {
  const apiUrl = process.env.MAIN_BOT_API_URL;
  
  if (!apiUrl) {
    console.warn('MAIN_BOT_API_URL environment variable is not set, falling back to localhost:3000');
    return 'http://localhost:3000';
  }
  
  return apiUrl;
}

/**
 * Create a full API endpoint URL for the main bot
 * @param endpoint - The API endpoint path (e.g., '/api/bot/stats')
 * @returns Complete URL for the bot API endpoint
 */
export function createBotApiUrl(endpoint: string): string {
  const baseUrl = getBotApiUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedEndpoint}`;
}

/**
 * Get authentication headers for bot API requests
 * @returns Headers object with authorization
 */
export function getBotApiHeaders(): HeadersInit {
  const authSecret = process.env.AUTH_BOT_SECRET;
  
  if (!authSecret) {
    console.warn('AUTH_BOT_SECRET not configured');
    return {};
  }

  return {
    'Authorization': `Bearer ${authSecret}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create authenticated fetch options for bot API requests
 * @param options - Additional fetch options to merge
 * @returns Fetch options with authentication headers
 */
export function createBotApiOptions(options: RequestInit = {}): RequestInit {
  const authHeaders = getBotApiHeaders();
  
  return {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
}
