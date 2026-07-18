'use strict';

const test = require('node:test');
const assert = require('node:assert');

const {
  isTrackingPastDistributionWindow,
  isLivestreamCodeExpired,
  getActiveLivestreamCodes
} = require('../utils/livestreamWindow');

test('closes livestream tracking after its distribution window', () => {
  const now = 1_000_000;

  assert.strictEqual(isTrackingPastDistributionWindow(
    { streamTime: now - 48 * 60 * 60 - 1 },
    now,
    48 * 60 * 60
  ), true);
  assert.strictEqual(isTrackingPastDistributionWindow(
    { streamTime: now - 60 },
    now,
    48 * 60 * 60
  ), false);
});

test('treats only a positive past expireAt as expired', () => {
  assert.strictEqual(isLivestreamCodeExpired({ expireAt: 999 }, 1000), true);
  assert.strictEqual(isLivestreamCodeExpired({ expireAt: 1000 }, 1000), true);
  assert.strictEqual(isLivestreamCodeExpired({ expireAt: 1001 }, 1000), false);
  assert.strictEqual(isLivestreamCodeExpired({ expireAt: 0 }, 1000), false);
});

test('keeps active and unknown-expiry codes while dropping expired codes', () => {
  assert.deepStrictEqual(getActiveLivestreamCodes([
    { code: 'EXPIRED', expireAt: 999 },
    { code: 'ACTIVE', expireAt: 1001 },
    { code: 'UNKNOWN', expireAt: 0 },
    { expireAt: 1001 }
  ], 1000), [
    { code: 'ACTIVE', expireAt: 1001 },
    { code: 'UNKNOWN', expireAt: 0 }
  ]);
});
