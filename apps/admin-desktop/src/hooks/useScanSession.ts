import { useMemo, useState } from 'react';
import type { ScanPart, SessionScanEntry } from '../types';

export const MOCK_PARTS: ScanPart[] = [
  { barcode: '4250149365234', part: 'C0402-100NF-10%', feeder: '#12', bomRef: 'Line 1', pass: true },
  { barcode: '4250149365218', part: 'R0805-10K-1%', feeder: '#8', bomRef: 'Line 2', pass: true },
  { barcode: '4250149365087', part: 'C0402-47NF', feeder: '#11', bomRef: 'Line 5', pass: true },
  { barcode: '4250149364900', part: 'IC-STM32F103C8T6', feeder: '#1', bomRef: 'Line 3', pass: true },
  { barcode: '4250149364850', part: 'LED-0603-RED', feeder: '#24', bomRef: 'Line 4', pass: true },
  { barcode: '4250149364800', part: 'C0805-10UF-20%', feeder: '#13', bomRef: 'Line 6', pass: true },
  { barcode: '4250149364750', part: 'R0402-100R-5%', feeder: '#6', bomRef: 'Line 7', pass: true },
  { barcode: '4250149364700', part: 'IC-LM358', feeder: '#5', bomRef: 'Line 8', pass: true },
  { barcode: '4250149364650', part: 'C1206-100UF', feeder: '#15', bomRef: 'Line 9', pass: true },
  { barcode: '4250149364600', part: 'CRYSTAL-8MHZ', feeder: '#3', bomRef: 'Line 10', pass: true },
  { barcode: '4250149365100', part: 'UNKNOWN', feeder: '—', bomRef: 'N/A', pass: false },
  { barcode: '4250149365050', part: 'WRONG-PART-XYZ', feeder: '—', bomRef: 'N/A', pass: false },
  { barcode: '4250149365000', part: 'NOT-IN-BOM', feeder: '—', bomRef: 'N/A', pass: false },
  { barcode: '0000000000001', part: 'EXPIRED-COMPONENT', feeder: '—', bomRef: 'N/A', pass: false },
  { barcode: '9999999999999', part: 'COUNTERFEIT-ALERT', feeder: '—', bomRef: 'N/A', pass: false },
];

function randomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function useScanSession() {
  const [history, setHistory] = useState<SessionScanEntry[]>([]);
  const [failures, setFailures] = useState<SessionScanEntry[]>([]);
  const [scanTotal, setScanTotal] = useState(0);
  const [scanPass, setScanPass] = useState(0);
  const [scanFail, setScanFail] = useState(0);
  const [lastResult, setLastResult] = useState<SessionScanEntry | null>(null);

  const scanRate = useMemo(() => (scanTotal > 0 ? Math.round((scanPass / scanTotal) * 100) : 0), [scanPass, scanTotal]);

  const pushEntry = (entry: SessionScanEntry) => {
    setHistory((current) => [entry, ...current].slice(0, 40));
    setLastResult(entry);
    setScanTotal((current) => current + 1);

    if (entry.status === 'PASS') {
      setScanPass((current) => current + 1);
      return true;
    }

    setScanFail((current) => current + 1);
    setFailures((current) => [entry, ...current].slice(0, 5));
    return false;
  };

  const processScan = (barcode: string) => {
    const match = MOCK_PARTS.find((part) => part.barcode === barcode.trim());
    const entry: SessionScanEntry = {
      id: randomId(),
      time: new Date().toLocaleTimeString([], { hour12: false }),
      barcode,
      part: match?.part ?? 'NOT-IN-BOM',
      feeder: match?.feeder ?? '—',
      status: match?.pass ? 'PASS' : 'FAIL',
      result: match?.pass ? 'Verified against BOM' : 'Rejected — part not allowed',
      bomRef: match?.bomRef ?? 'N/A',
    };

    return pushEntry(entry);
  };

  const simulateScan = (type: 'pass' | 'fail') => {
    const items = MOCK_PARTS.filter((part) => (type === 'pass' ? part.pass : !part.pass));
    return processScan(randomFrom(items).barcode);
  };

  const reset = () => {
    setHistory([]);
    setFailures([]);
    setScanTotal(0);
    setScanPass(0);
    setScanFail(0);
    setLastResult(null);
  };

  return { scanTotal, scanPass, scanFail, scanRate, history, failures, lastResult, processScan, simulateScan, reset };
}
