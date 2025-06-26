import { config } from '../config/environment';
import { AppError } from '../utils/errorHandler';

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.retryAttempts = config.api.retryAttempts;
  }

  private async fetchWithRetry(url: string, options: RequestInit, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new AppError(`HTTP ${response.status}: ${response.statusText}`, response.status);
      }

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts && !(error instanceof AppError && error.statusCode < 500)) {
        await this.delay(1000 * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
    });
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.fetchWithRetry(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export const apiService = new ApiService();