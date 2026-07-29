const test = require('node:test');
const assert = require('node:assert');
const { buildCodesEmbed } = require('../utils/livestreamDistribution');

test('livestream rewards use vertical fields and the centralized footer', async () => {
  const embed = await buildCodesEmbed('nap', {
    version: '3.1',
    bannerUrl: null,
    codes: [{
      code: 'ZZZTEST',
      title: "Denny30000;Senior Investigator Log2",
      expireAt: 0
    }]
  }, null, {
    fetchEventsBanner: async () => null
  });
  const data = embed.toJSON();

  assert.strictEqual(data.fields[0].inline, false);
  assert.match(data.fields[0].value, /• Denny ×30,000/);
  assert.match(data.fields[0].value, /• Senior Investigator Log ×2/);
  assert.strictEqual(
    data.footer.text,
    'Support: github.com/sponsors/chiraitori | chiraitori.dev'
  );
});
