export type UserRole = 'admin' | 'supervisor' | 'qa' | 'operator';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface Request {
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  ipHash?: string;
  headers?: Record<string, any>;
  method?: string;
  url?: string;
  path?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
  uptime: number;
}

export interface ScanEvent {
  sessionId: string;
  timestamp: number;
  scannedValue: string;
}

export interface SessionUpdate {
  sessionId: string;
  totalScans: number;
  passCount: number;
  failCount: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// Export API client
export { apiClient } from './api-client';
