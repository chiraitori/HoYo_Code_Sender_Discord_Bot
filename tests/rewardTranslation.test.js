const test = require('node:test');
const assert = require('node:assert');
const {
  formatRewardItems,
  parseRewardItems,
  translateRewardItem
} = require('../utils/dictionary');
const {
  clearRewardTranslationCache,
  translateRewardWithAi
} = require('../utils/aiRewardTranslator');

test('semicolon rewards keep the compact Discord style', () => {
  const items = parseRewardItems(
    "Mora10000;adventurer's experience10;Mystic Enhancement Ore5"
  ).map(item => ({
    ...item,
    name: translateRewardItem(item.name, 'vi').text
  }));

  assert.strictEqual(
    formatRewardItems(items),
    'Mora ×10,000; EXP Nhà Mạo Hiểm ×10; Quặng Cường Hóa Thần Bí ×5'
  );
});

test('commas inside quantities are not treated as reward separators', () => {
  assert.deepStrictEqual(
    parseRewardItems('Denny30,000, Polychrome ×300'),
    [
      { name: 'Denny', quantity: '30,000' },
      { name: 'Polychrome', quantity: '300' }
    ]
  );
});

test('plus-separated rewards are displayed as separate items', () => {
  assert.deepStrictEqual(
    parseRewardItems("Mora ×10,000 + Hero's Wit ×5"),
    [
      { name: 'Mora', quantity: '10,000' },
      { name: "Hero's Wit", quantity: '5' }
    ]
  );
});

test('AI translates only unknown item names and preserves quantities', async () => {
  const previousApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'test-key';
  clearRewardTranslationCache();
  let requestCount = 0;
  const httpClient = {
    async post(url, body) {
      requestCount++;
      assert.strictEqual(
        url,
        'https://generativelanguage.googleapis.com/v1beta/models/'
          + 'gemini-3.5-flash-lite:generateContent'
      );
      assert.strictEqual(
        body.generationConfig.responseFormat.text.mimeType,
        'application/json'
      );
      return {
        data: {
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  translations: [{
                    source: 'Mystery Token',
                    translated: 'Vé Bí Ẩn'
                  }]
                })
              }]
            }
          }]
        }
      };
    }
  };

  try {
    assert.strictEqual(
      await translateRewardWithAi('Mystery Token2', 'vi', httpClient),
      'Vé Bí Ẩn ×2'
    );
    assert.strictEqual(
      await translateRewardWithAi('Mystery Token2', 'vi', httpClient),
      'Vé Bí Ẩn ×2'
    );
    assert.strictEqual(requestCount, 1);
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousApiKey;
    }
    clearRewardTranslationCache();
  }
});

test('missing AI configuration keeps the dictionary fallback usable', async () => {
  const previousApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  clearRewardTranslationCache();

  try {
    assert.strictEqual(
      await translateRewardWithAi('Unknown Material3', 'vi'),
      'Unknown Material ×3'
    );
  } finally {
    if (previousApiKey !== undefined) {
      process.env.GEMINI_API_KEY = previousApiKey;
    }
    clearRewardTranslationCache();
  }
});
