const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function apiBaseUrlCandidates(): string[] {
  if (configuredApiBaseUrl) {
    return [configuredApiBaseUrl];
  }
  const hostApiBaseUrl = `${window.location.protocol}//${window.location.hostname}:8000/api`;
  return unique(['/api', hostApiBaseUrl, 'http://localhost:8000/api', 'http://127.0.0.1:8000/api']);
}

export const API_BASE_URL = apiBaseUrlCandidates()[0];

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const candidates = apiBaseUrlCandidates();
  let lastError: unknown;
  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: options.body instanceof FormData ? options.headers : {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `API request failed with ${response.status}`);
      }
      if (response.status === 204) {
        return undefined as T;
      }
      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message.startsWith('API request failed')) {
        break;
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('API request failed.');
}

export function fileDownloadUrl(fileId: string): string {
  const downloadBaseUrl = configuredApiBaseUrl
    ?? `${window.location.protocol}//${window.location.hostname}:8000/api`;
  return `${downloadBaseUrl}/packet/files/${fileId}/download`;
}
