/**
 * Enhanced fetch utility with better error handling and fallback mechanisms
 */

export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public url?: string
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function fetchWithFallback(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new FetchError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText,
          url
        );
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (error instanceof FetchError && error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }

  throw new FetchError(
    `Failed to fetch after ${retries + 1} attempts: ${lastError?.message}`,
    undefined,
    undefined,
    url
  );
}

export async function fetchJSON<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithFallback(url, options);
  return response.json();
}