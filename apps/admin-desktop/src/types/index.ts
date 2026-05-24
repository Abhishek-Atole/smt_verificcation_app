export type ThemePreference = 'dark' | 'light' | 'system';
export type AuthRole = 'admin' | 'supervisor' | 'qa' | 'operator';
export type SessionStatus = 'ACTIVE' | 'DONE' | 'FAILED';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  initials: string;
}

export interface StitchUser {
  id: string;
  initials: string;
  name: string;
  email: string;
  role: string;
  lastAccess: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatarTone: 'primary' | 'secondary' | 'tertiary';
}

export interface DashboardActivity {
  id: string;
  kind: 'verified' | 'failed' | 'session' | 'user';
  text: string;
  code: string;
  operator: string;
  time: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  delta: string;
  deltaType: 'up' | 'down';
  icon: string;
  href: string;
}

export interface SessionRow {
  id: string;
  status: SessionStatus;
  session: string;
  bom: string;
  operator: string;
  scans: number;
  duration: string;
  line: string;
  initials: string;
}

export interface BomRow {
  id: string;
  name: string;
  revision: string;
  parts: number;
  lastUsed: string;
  active: boolean;
}

export interface BomLine {
  line: string;
  partNumber: string;
  description: string;
  qty: number;
  feederSlot: string;
}

export interface ScanHistoryRow {
  id: string;
  time: string;
  barcode: string;
  part: string;
  session: string;
  operator: string;
  status: 'PASS' | 'FAIL';
}

export interface MetricBarPoint {
  label: string;
  value: number;
}

export interface MetricStackPoint {
  label: string;
  pass: number;
  fail: number;
}

export interface OperatorStat {
  name: string;
  initials: string;
  scans: number;
}

export interface FailedPartStat {
  part: string;
  fails: number;
}

export interface ScanPart {
  barcode: string;
  part: string;
  feeder: string;
  bomRef: string;
  pass: boolean;
}

export interface SessionScanEntry {
  id: string;
  time: string;
  barcode: string;
  part: string;
  feeder: string;
  status: 'PASS' | 'FAIL';
  result: string;
  bomRef: string;
}
