// API Client Service for Frontend Apps
// Shared utility for making requests to the backend API
// Uses HttpOnly cookies for authentication (set via credentials: 'include')

const API_BASE_URL = 'http://localhost:3000/api/v1';
const DEFAULT_TIMEOUT_MS = 30 * 1000; // 30 seconds

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'supervisor' | 'qa' | 'operator';
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export interface BOM {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Metric {
  label: string;
  value: number | string;
}

class ApiClient {
  private timeoutMs = DEFAULT_TIMEOUT_MS;

  /**
   * Ensures test token is obtained for development/testing
   * With HttpOnly cookies, this just calls the endpoint and cookie is set automatically
   */
  async ensureTestToken(): Promise<string | null> {
    try {
      const response = await this.request(`/auth/test-login`, {
        method: 'POST',
        timeoutMs: this.timeoutMs,
      });

      if (response.error) {
        return null;
      }

      // Token is now in HttpOnly cookie, not in response
      return 'token-set-via-cookie';
    } catch (error) {
      console.error('Failed to get test token:', error);
      return null;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { timeoutMs?: number } = {}
  ): Promise<ApiResponse<T>> {
    const { timeoutMs = this.timeoutMs, ...fetchOptions } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...fetchOptions,
        headers: this.getHeaders(),
        credentials: 'include', // Include cookies in all requests (HttpOnly auth cookie)
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const error = typeof data === 'object' ? data.message || data.error : data;
        return {
          error: error || `HTTP ${response.status}`,
          statusCode: response.status,
        };
      }

      return { data };
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          error: `Request timeout after ${timeoutMs}ms`,
          statusCode: 408,
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

      return {
        error: errorMessage || 'Network error',
        statusCode: 0,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Auth
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Health
  async getHealth() {
    return this.request('/health', { method: 'GET' });
  }

  // Users
  async getUsers(limit: number = 50, offset: number = 0) {
    return this.request<User[]>(`/users?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getUserById(userId: string) {
    return this.request<User>(`/users/${userId}`, { method: 'GET' });
  }

  async createUser(email: string, password: string, role: string) {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  }

  async updateUser(userId: string, updates: Partial<User>) {
    return this.request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  // BOMs
  async getBOMs(limit: number = 50, offset: number = 0) {
    return this.request<BOM[]>(`/boms?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getBOMById(bomId: string) {
    return this.request<BOM>(`/boms/${bomId}`, { method: 'GET' });
  }

  async createBOM(name: string, description: string) {
    return this.request<BOM>('/boms', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async updateBOM(bomId: string, updates: Partial<BOM>) {
    return this.request<BOM>(`/boms/${bomId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteBOM(bomId: string) {
    return this.request(`/boms/${bomId}`, { method: 'DELETE' });
  }

  // Metrics
  async getDashboardMetrics() {
    const today = new Date().toISOString().slice(0, 10);
    return this.request(`/metrics/daily/${today}`, { method: 'GET' });
  }

  async getScanMetrics() {
    return this.request('/metrics/scans', { method: 'GET' });
  }

  async getEfficiencyMetrics() {
    return this.request('/metrics/efficiency', { method: 'GET' });
  }

  async getTrendMetrics() {
    return this.request('/metrics/trends', { method: 'GET' });
  }

  async getBOMMetrics() {
    return this.request('/metrics/boms', { method: 'GET' });
  }

  // Audit
  async getAuditLogs(limit: number = 50, offset: number = 0) {
    return this.request(`/audit?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  // Sessions
  async getSessions(limit: number = 50, offset: number = 0) {
    return this.request(`/sessions?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getSessionById(sessionId: string) {
    return this.request(`/sessions/${sessionId}`, { method: 'GET' });
  }

  async createSession(bomId: string) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({ bomId, state: 'active' }),
    });
  }

  // Scans
  async getScans(limit: number = 50, offset: number = 0) {
    return this.request(`/scans?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  async getScanById(scanId: string) {
    return this.request(`/scans/${scanId}`, { method: 'GET' });
  }

  async createScan(sessionId: string) {
    return this.request('/scans', {
      method: 'POST',
      body: JSON.stringify({ sessionId, stage: 1 }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
