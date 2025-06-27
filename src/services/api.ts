import { config } from '../config/environment';
import { AppError } from '../utils/errorHandler';
import { notificationService } from './notificationService';

class ApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
    this.retryAttempts = config.api.retryAttempts;
    
    // Load auth token from localStorage
    this.authToken = localStorage.getItem('carbonai_auth_token');
  }

  setAuthToken(token: string) {
    this.authToken = token;
    localStorage.setItem('carbonai_auth_token', token);
  }

  clearAuthToken() {
    this.authToken = null;
    localStorage.removeItem('carbonai_auth_token');
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  private async fetchWithRetry(url: string, options: RequestInit, attempt: number = 1): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          this.clearAuthToken();
          notificationService.error('Authentication Error', 'Please log in again');
          // Redirect to login page or trigger login modal
          window.location.href = '/login';
          return response;
        }
        
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