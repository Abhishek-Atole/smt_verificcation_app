import { db, schema } from '@smt/db';
import { eq, and } from 'drizzle-orm';

export type ValidationStatus =
  | 'pass'
  | 'fail'
  | 'alternate'
  | 'manual'
  | 'free_scan'
  | 'error';

export interface ValidationResult {
  status: ValidationStatus;
  message: string;
  matchedMPN?: string;
  stage: number;
}

/**
 * Normalize value for exact string matching
 * - Uppercase
 * - Trim whitespace
 * - Treat "N/A" variants as empty string
 */
export function normalizeExact(value: string): string {
  if (!value) return '';
  
  const normalized = value.toUpperCase().trim();
  
  // Treat N/A variants as empty
  if (normalized === 'N/A' || normalized === 'NA' || normalized === 'NONE') {
    return '';
  }
  
  return normalized;
}

/**
 * Tokenize value for partial matching
 * - Split by whitespace
 * - Uppercase each token
 * - Filter empty tokens
 */
export function tokenizeInternal(value: string): string[] {
  if (!value) return [];
  
  return value
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Check if session is currently active
 */
export async function isSessionActive(sessionId: string): Promise<boolean> {
  const sessions = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);

  if (!sessions.length) return false;
  
  const session = sessions[0];
  return session.status === 'active';
}

/**
 * 7-Stage Scan Validation Pipeline
 *
 * Stage 1: Session must be active
 * Stage 2: Feeder slot must exist in BOM
 * Stage 3: If feeder has no expected values, pass (free scan)
 * Stage 4: Match MPN1 (primary)
 * Stage 5: Match MPN2 (secondary)
 * Stage 6: Match MPN3 (tertiary)
 * Stage 7: Match internal part number (tokenized partial matching)
 */
export async function validateScan(
  sessionId: string,
  feederSlot: string,
  scannedValue: string,
): Promise<ValidationResult> {
  // Stage 1: Verify session is active
  const session = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .limit(1);

  if (!session.length) {
    return {
      status: 'error',
      message: 'Session not found',
      stage: 1,
    };
  }

  if (session[0].status !== 'active') {
    return {
      status: 'error',
      message: `Session is ${session[0].status}, not active`,
      stage: 1,
    };
  }

  // Stage 2: Verify feeder slot exists in BOM
  const feeder = await db
    .select()
    .from(schema.bomItems)
    .where(
      and(
        eq(schema.bomItems.bomId, session[0].bomId),
        eq(schema.bomItems.feederSlot, feederSlot),
      ),
    )
    .limit(1);

  if (!feeder.length) {
    return {
      status: 'error',
      message: `Feeder slot ${feederSlot} not found in BOM`,
      stage: 2,
    };
  }

  const bomItem = feeder[0];
  const scannedNormalized = normalizeExact(scannedValue);

  // Stage 3: If no expected values (all MPNs are empty), treat as free scan
  const hasExpectedValues =
    normalizeExact(bomItem.mpn1 || '') ||
    normalizeExact(bomItem.mpn2 || '') ||
    normalizeExact(bomItem.mpn3 || '');

  if (!hasExpectedValues) {
    return {
      status: 'free_scan',
      message: 'No expected values for this feeder (free scan)',
      stage: 3,
    };
  }

  // Stage 4: Try to match MPN1 (primary)
  const mpn1Normalized = normalizeExact(bomItem.mpn1 || '');
  if (mpn1Normalized && scannedNormalized === mpn1Normalized) {
    return {
      status: 'pass',
      message: 'Matched MPN1 (primary)',
      matchedMPN: bomItem.mpn1 || undefined,
      stage: 4,
    };
  }

  // Stage 5: Try to match MPN2 (secondary)
  const mpn2Normalized = normalizeExact(bomItem.mpn2 || '');
  if (mpn2Normalized && scannedNormalized === mpn2Normalized) {
    return {
      status: 'alternate',
      message: 'Matched MPN2 (secondary - alternate part)',
      matchedMPN: bomItem.mpn2 || undefined,
      stage: 5,
    };
  }

  // Stage 6: Try to match MPN3 (tertiary)
  const mpn3Normalized = normalizeExact(bomItem.mpn3 || '');
  if (mpn3Normalized && scannedNormalized === mpn3Normalized) {
    return {
      status: 'alternate',
      message: 'Matched MPN3 (tertiary - alternate part)',
      matchedMPN: bomItem.mpn3 || undefined,
      stage: 6,
    };
  }

  // Stage 7: Try tokenized matching on internal part number
  const internalTokens = tokenizeInternal(bomItem.internalPartNumber || '');
  const scannedTokens = tokenizeInternal(scannedValue);

  if (internalTokens.length > 0 && scannedTokens.length > 0) {
    // Check if all scanned tokens exist in internal part tokens
    const allTokensMatch = scannedTokens.every((token) =>
      internalTokens.includes(token),
    );

    if (allTokensMatch) {
      return {
        status: 'manual',
        message: 'Partial tokenized match on internal part number',
        matchedMPN: bomItem.internalPartNumber || undefined,
        stage: 7,
      };
    }
  }

  // No match at any stage
  return {
    status: 'fail',
    message: 'Scanned value does not match any expected part number',
    stage: 7,
  };
}

/**
 * Get session statistics (pass/fail counts)
 */
export async function getSessionStats(sessionId: string) {
  const scans = await db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.sessionId, sessionId));

  const stats = {
    total: scans.length,
    passed: scans.filter((s) => s.validationResult === 'pass').length,
    alternate: scans.filter((s) => s.validationResult === 'alternate').length,
    manual: scans.filter((s) => s.validationResult === 'manual').length,
    failed: scans.filter((s) => s.validationResult === 'fail').length,
    freeScan: scans.filter((s) => s.validationResult === 'free_scan').length,
    error: scans.filter((s) => s.validationResult === 'error').length,
  };

  // Calculate FPY (First Pass Yield)
  const countable = stats.passed + stats.failed;
  const fpy = countable > 0 ? (stats.passed / countable) * 100 : 0;

  return {
    ...stats,
    fpy,
  };
}
