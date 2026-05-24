import type {
  BomLine,
  BomRow,
  DashboardActivity,
  DashboardStat,
  FailedPartStat,
  MetricBarPoint,
  MetricStackPoint,
  OperatorStat,
  ScanHistoryRow,
  SessionRow,
  StitchUser,
} from '../types';

export const AUTH_USERS = {
  admin: { id: '1', name: 'John Doe', email: 'john.doe@logicvera.io', role: 'admin', initials: 'JD' },
  operator: { id: '2', name: 'Sarah Miller', email: 's.miller@logicvera.io', role: 'operator', initials: 'SM' },
} as const;

export const DASHBOARD_STATS: DashboardStat[] = [
  { label: 'Total Users', value: '24', delta: '↑2 this week', deltaType: 'up', icon: 'users', href: '/users' },
  { label: 'Active Sessions', value: '3', delta: 'Live Monitoring', deltaType: 'up', icon: 'pulse', href: '/sessions' },
  { label: 'BOM Library', value: '156', delta: '12 added today', deltaType: 'up', icon: 'package', href: '/boms' },
  { label: 'Scans Today', value: '1,247', delta: '↑8% vs avg', deltaType: 'up', icon: 'scan', href: '/scans' },
];

export const SYSTEM_HEALTH = [
  { name: 'API Server', status: 'OK', detail: 'http://localhost:3000', tone: 'success' as const },
  { name: 'PostgreSQL', status: 'OK', detail: 'postgresql://localhost:5432/test', tone: 'success' as const },
  { name: 'Socket.IO', status: 'OK', detail: 'ws://localhost:3000', tone: 'success' as const },
];

export const DASHBOARD_ACTIVITY: DashboardActivity[] = [
  { id: '1', kind: 'verified', text: 'Verified part', code: 'C0402-100NF-10%', operator: 'John D.', time: '2 min ago' },
  { id: '2', kind: 'failed', text: 'Failed scan on', code: 'NOT-IN-BOM', operator: 'Sarah M.', time: '7 min ago' },
  { id: '3', kind: 'session', text: 'Started session', code: 'Session #1042', operator: 'Admin', time: '14 min ago' },
  { id: '4', kind: 'user', text: 'Added new operator', code: 's.miller@logicvera.io', operator: 'System', time: '31 min ago' },
];

export const SCAN_ACTIVITY: MetricBarPoint[] = [
  { label: 'Mon', value: 980 },
  { label: 'Tue', value: 1380 },
  { label: 'Wed', value: 1140 },
  { label: 'Thu', value: 1270 },
  { label: 'Fri', value: 1195 },
  { label: 'Sat', value: 1105 },
  { label: 'Sun', value: 1040 },
];

export const STACKED_RATIO: MetricStackPoint[] = [
  { label: 'Mon', pass: 82, fail: 18 },
  { label: 'Tue', pass: 90, fail: 10 },
  { label: 'Wed', pass: 86, fail: 14 },
  { label: 'Thu', pass: 92, fail: 8 },
  { label: 'Fri', pass: 88, fail: 12 },
  { label: 'Sat', pass: 84, fail: 16 },
  { label: 'Sun', pass: 89, fail: 11 },
];

export const OPERATORS: OperatorStat[] = [
  { name: 'John D.', initials: 'JD', scans: 1247 },
  { name: 'Sarah M.', initials: 'SM', scans: 1085 },
  { name: 'Ava T.', initials: 'AT', scans: 946 },
  { name: 'Chris P.', initials: 'CP', scans: 778 },
];

export const FAILED_PARTS: FailedPartStat[] = [
  { part: 'NOT-IN-BOM', fails: 24 },
  { part: 'WRONG-PART-XYZ', fails: 18 },
  { part: 'EXPIRED-COMPONENT', fails: 12 },
  { part: 'COUNTERFEIT-ALERT', fails: 8 },
];

export const SESSIONS: SessionRow[] = [
  { id: '1042', status: 'ACTIVE', session: 'Session #1042', bom: 'BOM-2024-001', operator: 'John D.', scans: 44, duration: '1h 24m', line: 'Line 3', initials: 'JD' },
  { id: '1041', status: 'DONE', session: 'Session #1041', bom: 'BOM-2024-002', operator: 'Sarah M.', scans: 247, duration: '2h 03m', line: 'Line 1', initials: 'SM' },
  { id: '1040', status: 'FAILED', session: 'Session #1040', bom: 'BOM-2024-005', operator: 'Ava T.', scans: 18, duration: '0h 19m', line: 'Line 2', initials: 'AT' },
  { id: '1039', status: 'DONE', session: 'Session #1039', bom: 'BOM-2023-117', operator: 'Chris P.', scans: 183, duration: '1h 45m', line: 'Line 3', initials: 'CP' },
  { id: '1038', status: 'ACTIVE', session: 'Session #1038', bom: 'BOM-2024-009', operator: 'John D.', scans: 66, duration: '0h 52m', line: 'Line 1', initials: 'JD' },
];

export const BOMS: BomRow[] = [
  { id: 'BOM-2024-001', name: 'Logic Module A', revision: 'Rev 3.1', parts: 247, lastUsed: 'today', active: true },
  { id: 'BOM-2024-002', name: 'Power Supply Board', revision: 'Rev 2.4', parts: 198, lastUsed: '2 hours ago', active: true },
  { id: 'BOM-2024-005', name: 'Control Sensor Pack', revision: 'Rev 1.8', parts: 112, lastUsed: 'yesterday', active: false },
  { id: 'BOM-2024-009', name: 'Connectivity Core', revision: 'Rev 4.0', parts: 164, lastUsed: 'today', active: true },
];

export const BOM_DETAILS: Record<string, BomLine[]> = {
  'BOM-2024-001': [
    { line: '1', partNumber: 'C0402-100NF', description: 'Ceramic Capacitor 100nF', qty: 2, feederSlot: '#12' },
    { line: '2', partNumber: 'R0805-10K', description: 'Resistor 10k 1%', qty: 4, feederSlot: '#8' },
    { line: '3', partNumber: 'IC-STM32F103', description: 'MCU Package', qty: 1, feederSlot: '#1' },
  ],
  'BOM-2024-002': [
    { line: '1', partNumber: 'IC-LM358', description: 'Operational Amplifier', qty: 2, feederSlot: '#5' },
    { line: '2', partNumber: 'C1206-100UF', description: 'Electrolytic Capacitor', qty: 2, feederSlot: '#15' },
  ],
};

export const SCAN_HISTORY: ScanHistoryRow[] = Array.from({ length: 50 }, (_, index) => {
  const pass = index % 5 !== 0;
  return {
    id: `${index + 1}`,
    time: `2026-05-22 08:${String(12 + index).padStart(2, '0')}:24`,
    barcode: pass ? `4250149365${String(100 + index).padStart(3, '0')}` : '9999999999999',
    part: pass ? `Part-${index + 1}` : 'NOT-IN-BOM',
    session: `#10${42 - (index % 4)}`,
    operator: index % 2 ? 'John D.' : 'Sarah M.',
    status: pass ? 'PASS' : 'FAIL',
  };
});

export const METRIC_VOLUME: MetricBarPoint[] = [
  { label: 'Mon', value: 900 },
  { label: 'Tue', value: 1200 },
  { label: 'Wed', value: 1120 },
  { label: 'Thu', value: 1375 },
  { label: 'Fri', value: 1280 },
  { label: 'Sat', value: 1030 },
  { label: 'Sun', value: 1185 },
];

export const METRIC_RATIO = STACKED_RATIO;

export const STITCH_USERS: StitchUser[] = [
  { id: 'u1', initials: 'EK', name: 'Elias Kaelin', email: 'elias.kaelin@logicvera.io', role: 'Lead Architect', lastAccess: '2023-10-24 09:12:04', status: 'ACTIVE', avatarTone: 'secondary' },
  { id: 'u2', initials: 'SM', name: 'Sarah Moss', email: 's.moss@logicvera.io', role: 'Logic Verifier', lastAccess: '2023-10-23 14:45:12', status: 'ACTIVE', avatarTone: 'primary' },
  { id: 'u3', initials: 'AR', name: 'Avery Reed', email: 'avery.reed@logicvera.io', role: 'Admin', lastAccess: '2023-10-22 08:13:44', status: 'ACTIVE', avatarTone: 'tertiary' },
  { id: 'u4', initials: 'JP', name: 'Jordan Price', email: 'jordan.price@logicvera.io', role: 'Operator', lastAccess: '2023-10-19 11:03:22', status: 'INACTIVE', avatarTone: 'primary' },
];

export const USER_SUMMARY = { totalSeats: 128, activeNow: 42, integrity: '99.98%' };
