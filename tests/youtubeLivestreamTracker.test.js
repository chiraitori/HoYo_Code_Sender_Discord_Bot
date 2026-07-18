const test = require('node:test');
const assert = require('node:assert');

const {
  decodeXml,
  parseYoutubeFeed
} = require('../utils/youtubeLivestreamTracker');

test('decodes one layer of standard XML entities', () => {
  assert.strictEqual(
    decodeXml('Fish &amp; Chips &lt;Preview&gt; &quot;Live&quot;'),
    'Fish & Chips <Preview> "Live"'
  );
});

test('does not double-decode nested XML entities', () => {
  assert.strictEqual(
    decodeXml('&amp;lt;script&amp;gt;'),
    '&lt;script&gt;'
  );
});

test('RSS parsing preserves a second layer of escaped title content', () => {
  const [entry] = parseYoutubeFeed(`
    <entry>
      <yt:videoId>abc123</yt:videoId>
      <title>Version 3.1 &amp;lt;Special Program&amp;gt;</title>
      <published>2026-07-18T00:00:00Z</published>
    </entry>
  `);

  assert.strictEqual(entry.title, 'Version 3.1 &lt;Special Program&gt;');
});
