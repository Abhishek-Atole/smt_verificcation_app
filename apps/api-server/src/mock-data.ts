// Mock database for development when PostgreSQL is unavailable
export const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@smt-verification.local',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    isDeleted: false,
    createdAt: new Date('2026-05-19T10:00:00Z'),
    updatedAt: new Date('2026-05-19T15:00:00Z'),
  },
  {
    id: 'user-2',
    email: 'supervisor@smt-verification.local',
    role: 'supervisor',
    firstName: 'John',
    lastName: 'Supervisor',
    isDeleted: false,
    createdAt: new Date('2026-05-18T10:00:00Z'),
    updatedAt: new Date('2026-05-19T14:00:00Z'),
  },
  {
    id: 'user-3',
    email: 'operator@smt-verification.local',
    role: 'operator',
    firstName: 'Jane',
    lastName: 'Operator',
    isDeleted: false,
    createdAt: new Date('2026-05-17T10:00:00Z'),
    updatedAt: new Date('2026-05-19T12:00:00Z'),
  },
];

export const mockBoms = [
  {
    id: 'bom-1',
    partNumber: 'PCB-SMT-001',
    revision: 'REV-A',
    createdBy: 'user-1',
    approvedBy: 'user-1',
    isDeleted: false,
    createdAt: new Date('2026-05-19T08:00:00Z'),
    updatedAt: new Date('2026-05-19T08:00:00Z'),
  },
  {
    id: 'bom-2',
    partNumber: 'PCB-SMT-002',
    revision: 'REV-B',
    createdBy: 'user-1',
    approvedBy: 'user-1',
    isDeleted: false,
    createdAt: new Date('2026-05-18T08:00:00Z'),
    updatedAt: new Date('2026-05-18T08:00:00Z'),
  },
];

export const mockMetrics = {
  date: new Date().toISOString().split('T')[0],
  totalScans: 234,
  passedScans: 228,
  failedScans: 6,
  avgScanTime: 2.5,
};
