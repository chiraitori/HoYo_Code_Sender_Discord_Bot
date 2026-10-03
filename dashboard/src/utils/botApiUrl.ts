/**
 * Get the main bot API URL from environment variables
 * @returns The bot API base URL
 */
export function getBotApiUrl(): string {
  const apiUrl = process.env.MAIN_BOT_API_URL;
  
  if (!apiUrl) {
    throw new Error('Bot API is not configured');
  }
  
  return apiUrl.replace(/\/+$/, '');
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
    ...(options.next ? {} : { cache: 'no-store' as const }),
    signal: AbortSignal.timeout(15000),
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  };
}
import 'server-only';
import { NextResponse } from 'next/server';


export function createBotApiResponse(data: unknown, init?: ResponseInit): NextResponse {
  const privateValues = [process.env.MAIN_BOT_API_URL, process.env.AUTH_BOT_SECRET];
  if (process.env.MAIN_BOT_API_URL) {
    const url = new URL(process.env.MAIN_BOT_API_URL);
    privateValues.push(url.origin, url.hostname);
  }
  // Upstream metadata must not reveal internal addresses or credentials.
  const body = JSON.stringify(data, (_key, value: unknown) => {
    if (typeof value !== 'string') return value;
    return privateValues.some(secret => secret && value.includes(secret)) ? '[redacted]' : value;
  });
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  return new NextResponse(body, { ...init, headers });
}
