const test = require('node:test');
const assert = require('node:assert');
const {
  extractVersion,
  isSpecialProgramPost,
  parseStreamInfo,
} = require('../utils/hoyolabPostTracker');

test('extractVersion reads a numeric version like "Version 2.5"', () => {
  assert.strictEqual(
    extractVersion('Zenless Zone Zero Version 2.5 "To Be Fuel" Special Program'),
    '2.5'
  );
  assert.strictEqual(extractVersion('Honkai: Star Rail Version 3.0 Special Program'), '3.0');
});

test('extractVersion reads a quoted subtitle like Version "Luna IV"', () => {
  assert.strictEqual(
    extractVersion('Genshin Impact Version "Luna IV" Special Program Preview'),
    'Luna IV'
  );
});

test('extractVersion reads Japanese バージョン titles', () => {
  assert.strictEqual(extractVersion('バージョン 4.0 Special Program'), '4.0');
});

test('extractVersion returns null when no version is present', () => {
  assert.strictEqual(extractVersion('Maintenance notice'), null);
  assert.strictEqual(extractVersion(''), null);
  assert.strictEqual(extractVersion(), null);
});

test('isSpecialProgramPost detects special program subjects', () => {
  assert.strictEqual(
    isSpecialProgramPost({ subject: 'Genshin Impact Version 5.5 Special Program Preview', content: '' }),
    true
  );
});

test('isSpecialProgramPost matches via content keywords', () => {
  assert.strictEqual(
    isSpecialProgramPost({ subject: 'Version 3.0 Preview', content: 'includes redemption code' }),
    true
  );
  assert.strictEqual(
    isSpecialProgramPost({ subject: 'Version 2.0', content: 'livestream coming soon' }),
    true
  );
});

test('isSpecialProgramPost rejects posts without a version or keywords', () => {
  assert.strictEqual(isSpecialProgramPost({ subject: 'Some random post', content: '' }), false);
});

test('isSpecialProgramPost handles empty / null input', () => {
  assert.strictEqual(isSpecialProgramPost({}), false);
  assert.strictEqual(isSpecialProgramPost(null), false);
  assert.strictEqual(isSpecialProgramPost(undefined), false);
});

// ---------------- parseStreamInfo ----------------

test('parseStreamInfo returns null for falsy input', () => {
  assert.strictEqual(parseStreamInfo(null, 'nap'), null);
  assert.strictEqual(parseStreamInfo(undefined, 'nap'), null);
});

test('parseStreamInfo returns null when no version can be extracted', () => {
  const post = { post_id: 'p1', subject: 'Just an announcement', created_at: 1700000000 };
  assert.strictEqual(parseStreamInfo(post, 'nap'), null);
});

test('parseStreamInfo parses an explicit UTC-offset timestamp', () => {
  const post = {
    post_id: 'p2',
    subject: 'Honkai: Star Rail Version 2.5 Special Program',
    desc: 'Stream starts 09/15/2025 at 19:30 (UTC-5)',
    cover_list: [{ url: 'https://x/banner.png' }],
  };
  const info = parseStreamInfo(post, 'hkrpg');
  assert.strictEqual(info.game, 'hkrpg');
  assert.strictEqual(info.version, '2.5');
  assert.strictEqual(info.streamTimeEstimated, false);
  assert.strictEqual(info.streamTime, 1757982600);
  assert.strictEqual(info.bannerUrl, 'https://x/banner.png');
  assert.strictEqual(info.postId, 'p2');
  assert.strictEqual(info.source, 'hoyolab');
});

test('parseStreamInfo computes time from a "Countdown: N hours left" subject', () => {
  const created = 1700000000;
  const post = {
    post_id: 'p3',
    subject: 'Version 3.0 Countdown: 2 hours left',
    created_at: created,
  };
  const info = parseStreamInfo(post, 'nap');
  assert.strictEqual(info.version, '3.0');
  assert.strictEqual(info.streamTimeEstimated, false);
  assert.strictEqual(info.streamTime, created + 2 * 60 * 60);
});

test('parseStreamInfo computes time from "Countdown: N minutes left"', () => {
  const created = 1700000000;
  const post = {
    post_id: 'p4',
    subject: 'Version 3.1 Countdown: 30 minutes left',
    created_at: created,
  };
  const info = parseStreamInfo(post, 'nap');
  assert.strictEqual(info.streamTime, created + 30 * 60);
});

test('parseStreamInfo falls back to created_at and marks time as estimated', () => {
  const created = 1700000000;
  const post = {
    post_id: 'p5',
    subject: 'Version 4.0 Special Program',
    created_at: created,
  };
  const info = parseStreamInfo(post, 'genshin');
  assert.strictEqual(info.version, '4.0');
  assert.strictEqual(info.streamTime, created);
  assert.strictEqual(info.streamTimeEstimated, true);
});

test('parseStreamInfo prefers cover_list over image_list for the banner', () => {
  const post = {
    post_id: 'p6',
    subject: 'Version 5.0 Special Program',
    desc: 'Stream starts 01/02/2026 at 00:00 (UTC-5)',
    cover_list: [{ url: 'https://x/cover.png' }],
    image_list: [{ url: 'https://x/image.png' }],
  };
  const info = parseStreamInfo(post, 'genshin');
  assert.strictEqual(info.bannerUrl, 'https://x/cover.png');
});

test('parseStreamInfo uses image_list when cover_list is absent', () => {
  const post = {
    post_id: 'p7',
    subject: 'Version 5.1 Special Program',
    desc: 'Stream starts 01/02/2026 at 00:00 (UTC-5)',
    image_list: [{ url: 'https://x/image.png' }],
  };
  const info = parseStreamInfo(post, 'genshin');
  assert.strictEqual(info.bannerUrl, 'https://x/image.png');
});
