const test = require('node:test');
const assert = require('node:assert');

const axios = require('axios');
const {
  clearYoutubeCache,
  decodeXml,
  fetchChannelLivestream,
  fetchYoutubeLivestreams,
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

test('fetchChannelLivestream does not overwrite a Special Program candidate with an unrelated live stream', async () => {
  const originalGet = axios.get;
  try {
    axios.get = async (url) => {
      if (url.includes('/feeds/videos.xml')) {
        return {
          data: `
            <entry>
              <yt:videoId>specProg123</yt:videoId>
              <title>Version 5.6 Special Program</title>
              <published>2026-07-18T00:00:00Z</published>
            </entry>
          `
        };
      }
      if (url.includes('/watch?v=specProg123')) {
        return { data: '<html><body>No premiere markers yet</body></html>' };
      }
      if (url.includes('/channel/UCtest/live')) {
        return {
          data: '<link rel="canonical" href="https://www.youtube.com/watch?v=unrelatedOst247">"isLiveNow":true'
        };
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    const result = await fetchChannelLivestream({ locale: 'en', channelId: 'UCtest' });
    assert.strictEqual(result.videoId, 'specProg123');
    assert.strictEqual(result.url, 'https://www.youtube.com/watch?v=specProg123');
    assert.strictEqual(result.status, 'unknown');
  } finally {
    axios.get = originalGet;
  }
});

test('fetchYoutubeLivestreams does not negative-cache transient all-channel outages', async () => {
  const originalGet = axios.get;
  clearYoutubeCache();
  let requests = 0;

  try {
    axios.get = async () => {
      requests += 1;
      throw new Error('YouTube 503');
    };
    const first = await fetchYoutubeLivestreams('hkrpg');
    assert.deepStrictEqual(first, []);
    const afterFirst = requests;

    // Must retry on the next call instead of serving a 5-minute cached empty array.
    axios.get = async () => {
      requests += 1;
      return { data: '<feed></feed>' };
    };
    const second = await fetchYoutubeLivestreams('hkrpg');
    assert.deepStrictEqual(second, []);
    assert.ok(requests > afterFirst);
  } finally {
    axios.get = originalGet;
    clearYoutubeCache();
  }
});
