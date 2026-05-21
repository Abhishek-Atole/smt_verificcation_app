import { createHash } from 'crypto';
import { env } from '@smt/config';

export function hashIP(ip: string): string {
  return createHash('sha256').update(ip + env.HASH_PEPPER).digest('hex');
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function getSessionId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `SMT_${year}${month}${day}_${random}`;
}

export function extractIPAddress(headers: Record<string, any>): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    return typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
  }
  return headers['x-real-ip'] || headers['cf-connecting-ip'] || '127.0.0.1';
}
