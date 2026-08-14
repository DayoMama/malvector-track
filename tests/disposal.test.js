import { describe, it, expect } from 'vitest';
import { computeDueDate, isOverdue } from '../lib/disposal.js';

describe('computeDueDate', () => {
  it('adds 3 years for ITN distributions', () => {
    expect(computeDueDate('ITN', '2023-06-01')).toBe('2026-06-01');
  });

  it('adds 1 year for IRS distributions', () => {
    expect(computeDueDate('IRS', '2025-01-15')).toBe('2026-01-15');
  });

  it('defaults to 3 years for an unrecognised intervention type', () => {
    expect(computeDueDate('UNKNOWN', '2023-06-01')).toBe('2026-06-01');
  });

  it('handles leap-year distribution dates', () => {
    expect(computeDueDate('IRS', '2024-02-29')).toBe('2025-03-01');
  });
});

describe('isOverdue', () => {
  it('returns false for non-pending items regardless of due date', () => {
    expect(isOverdue({ status: 'disposed', due_date: '2020-01-01' })).toBe(false);
  });

  it('returns true for pending items with a due date in the past', () => {
    expect(isOverdue({ status: 'pending', due_date: '2020-01-01' })).toBe(true);
  });

  it('returns false for pending items with a due date in the future', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isOverdue({ status: 'pending', due_date: future.toISOString().slice(0, 10) })).toBe(false);
  });
});
