const test = require('node:test');
const assert = require('node:assert');

const axios = require('axios');
const {
  clearYoutubeCache,
  decodeXml,
  fetchChannelLivestream,
  fetchPremiereDetails,
  fetchYoutubeLivestreams,
  isYoutubeHtmlRateLimited,
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
  clearYoutubeCache();
  const recentPublished = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  try {
    axios.get = async (url) => {
      if (url.includes('/feeds/videos.xml')) {
        return {
          data: `
            <entry>
              <yt:videoId>specProg123</yt:videoId>
              <title>Version 5.6 Special Program</title>
              <published>${recentPublished}</published>
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
    clearYoutubeCache();
  }
});

test('fetchPremiereDetails skips HTML scraping for archive videos older than 48 hours', async () => {
  const originalGet = axios.get;
  clearYoutubeCache();
  let requests = 0;

  try {
    axios.get = async () => {
      requests += 1;
      throw new Error('Should not scrape old archive videos');
    };

    const oldVideo = {
      videoId: 'oldArchive1',
      title: 'Version 5.0 Special Program',
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      url: 'https://www.youtube.com/watch?v=oldArchive1'
    };
    const result = await fetchPremiereDetails(oldVideo);
    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(requests, 0);
  } finally {
    axios.get = originalGet;
    clearYoutubeCache();
  }
});

test('YouTube HTTP 429 triggers HTML scrape cooldown instead of hammering watch pages', async () => {
  const originalGet = axios.get;
  clearYoutubeCache();
  let requests = 0;

  try {
    axios.get = async () => {
      requests += 1;
      const err = new Error('Request failed with status code 429');
      err.response = { status: 429 };
      throw err;
    };

    const recentVideo = {
      videoId: 'recentVid1',
      title: 'Version 6.0 Special Program',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/watch?v=recentVid1'
    };

    await fetchPremiereDetails(recentVideo);
    assert.strictEqual(requests, 1);
    assert.strictEqual(isYoutubeHtmlRateLimited(), true);

    // Subsequent call during cooldown must not issue another HTTP request.
    await fetchPremiereDetails({ ...recentVideo, videoId: 'recentVid2', url: 'https://www.youtube.com/watch?v=recentVid2' });
    assert.strictEqual(requests, 1);
  } finally {
    axios.get = originalGet;
    clearYoutubeCache();
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
