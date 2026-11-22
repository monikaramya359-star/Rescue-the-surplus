import { describe, it, expect } from 'vitest';
import {
  MATCH_WEIGHTS,
  DEFAULT_RECEIVER_NEED,
  scoreListing,
  isListingFeedEligible,
} from './matchingScore';

const NOW = new Date('2030-01-01T12:00:00.000Z');
const HOURS_FROM_NOW = (h) => new Date(NOW.getTime() + h * 3600000).toISOString();

const receiver = { area: 'Central', capacityMeals: 20 };

describe('scoreListing', () => {
  it('scores a nearer listing higher when other inputs are equal', () => {
    const base = {
      quantity: 10,
      unit: 'Meals',
      pickupDeadline: HOURS_FROM_NOW(10),
    };
    const near = scoreListing({ ...base, pickupArea: 'Riverside' }, receiver, NOW);
    const far = scoreListing({ ...base, pickupArea: 'North' }, receiver, NOW);
    expect(near.score).toBeGreaterThan(far.score);
  });

  it('scores a listing exceeding receiver capacity lower than a fitting one', () => {
    const base = {
      pickupArea: 'Central',
      unit: 'Meals',
      pickupDeadline: HOURS_FROM_NOW(10),
    };
    const fitting = scoreListing({ ...base, quantity: 10 }, receiver, NOW);
    const exceeding = scoreListing({ ...base, quantity: 40 }, receiver, NOW);
    expect(exceeding.score).toBeLessThan(fitting.score);
  });

  it('computes the score as the weighted sum of components using MATCH_WEIGHTS', () => {
    // Same area (distance 1), fits capacity (quantity 1), ample time (timing 1),
    // no need given (default 0.5).
    const listing = {
      pickupArea: 'Central',
      quantity: 10,
      unit: 'Meals',
      pickupDeadline: HOURS_FROM_NOW(10),
    };
    const expected =
      MATCH_WEIGHTS.distance * 1 +
      MATCH_WEIGHTS.quantityFit * 1 +
      MATCH_WEIGHTS.timing * 1 +
      MATCH_WEIGHTS.need * DEFAULT_RECEIVER_NEED;
    const { score, reasons } = scoreListing(listing, receiver, NOW);
    expect(score).toBeCloseTo(Number(expected.toFixed(2)), 2);
    expect(reasons).toContain('fits your 20-meal capacity');
  });

  it('gives timing 0 when the receiver cannot reach before the deadline', () => {
    const listing = {
      pickupArea: 'North',
      quantity: 10,
      unit: 'Meals',
      pickupDeadline: new Date(NOW.getTime() + 5 * 60000).toISOString(),
    };
    const { reasons } = scoreListing(listing, receiver, NOW);
    expect(reasons).toContain('cannot reach before pickup deadline');
  });
});

describe('MATCH_WEIGHTS', () => {
  it('sums to 1', () => {
    const total = Object.values(MATCH_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe('isListingFeedEligible', () => {
  it('rejects an expired listing', () => {
    const listing = {
      status: 'Active',
      pickupDeadline: new Date(NOW.getTime() - 60000).toISOString(),
    };
    expect(isListingFeedEligible(listing, NOW)).toBe(false);
  });

  it('accepts an active listing with a future deadline', () => {
    const listing = { status: 'Active', pickupDeadline: HOURS_FROM_NOW(2) };
    expect(isListingFeedEligible(listing, NOW)).toBe(true);
  });

  it('rejects a listing whose status is not Active', () => {
    const listing = { status: 'Claimed', pickupDeadline: HOURS_FROM_NOW(2) };
    expect(isListingFeedEligible(listing, NOW)).toBe(false);
  });

  it('accepts a legacy Available listing with a future deadline, but still rejects Claimed', () => {
    const available = { status: 'Available', pickupDeadline: HOURS_FROM_NOW(2) };
    const claimed = { status: 'Claimed', pickupDeadline: HOURS_FROM_NOW(2) };
    expect(isListingFeedEligible(available, NOW)).toBe(true);
    expect(isListingFeedEligible(claimed, NOW)).toBe(false);
  });
});
