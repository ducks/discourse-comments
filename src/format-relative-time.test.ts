import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from './utils.js';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setNow(date: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
  }

  const now = new Date('2026-02-27T12:00:00Z');

  it('returns "just now" for less than 1 minute ago', () => {
    setNow(now);
    const date = new Date(now.getTime() - 30_000); // 30 seconds ago
    expect(formatRelativeTime(date)).toBe('just now');
  });

  it('returns "1 minute ago" (singular)', () => {
    setNow(now);
    const date = new Date(now.getTime() - 60_000);
    expect(formatRelativeTime(date)).toBe('1 minute ago');
  });

  it('returns "5 minutes ago" (plural)', () => {
    setNow(now);
    const date = new Date(now.getTime() - 5 * 60_000);
    expect(formatRelativeTime(date)).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" (singular)', () => {
    setNow(now);
    const date = new Date(now.getTime() - 3_600_000);
    expect(formatRelativeTime(date)).toBe('1 hour ago');
  });

  it('returns "12 hours ago" (plural)', () => {
    setNow(now);
    const date = new Date(now.getTime() - 12 * 3_600_000);
    expect(formatRelativeTime(date)).toBe('12 hours ago');
  });

  it('returns "1 day ago" (singular)', () => {
    setNow(now);
    const date = new Date(now.getTime() - 86_400_000);
    expect(formatRelativeTime(date)).toBe('1 day ago');
  });

  it('returns "15 days ago" (plural)', () => {
    setNow(now);
    const date = new Date(now.getTime() - 15 * 86_400_000);
    expect(formatRelativeTime(date)).toBe('15 days ago');
  });

  it('returns locale date string for 30+ days ago', () => {
    setNow(now);
    const date = new Date(now.getTime() - 45 * 86_400_000);
    expect(formatRelativeTime(date)).toBe(date.toLocaleDateString());
  });
});
