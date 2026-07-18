const test = require('node:test');
const assert = require('node:assert');

const {
  getLegacyCodeDeliveryIds,
  getSharedCodeDeliveryIds,
  getPendingCodeDeliveries,
  getCodeDeliveryProgress
} = require('../utils/livestreamDeliveryState');

test('migrates old target progress for only the codes known at that time', () => {
  assert.deepStrictEqual(
    getLegacyCodeDeliveryIds(
      ['bot-a:channel:one'],
      [{ code: 'ZZZLIVE1' }]
    ),
    ['bot-a:channel:one:code:ZZZLIVE1']
  );
});

test('queues only codes that a target has not received', () => {
  const targets = [{ id: 'bot-a:channel:one' }];
  const deliveries = getPendingCodeDeliveries(
    targets,
    [{ code: 'ZZZLIVE1' }, { code: 'ZZZLIVE2' }],
    ['bot-a:channel:one:code:ZZZLIVE1']
  );

  assert.strictEqual(deliveries.length, 1);
  assert.deepStrictEqual(deliveries[0].codes, [{ code: 'ZZZLIVE2' }]);
});

test('shares regular-code delivery markers with livestream delivery', () => {
  assert.deepStrictEqual(
    getSharedCodeDeliveryIds(
      [{ id: 'bot-a:channel:one' }, { id: 'bot-a:channel:two' }],
      [{
        code: 'ZZZLIVE1',
        notifiedTargets: ['bot-a:channel:one']
      }]
    ),
    ['bot-a:channel:one:code:ZZZLIVE1']
  );
});

test('does not queue a code that was already delivered', () => {
  const deliveries = getPendingCodeDeliveries(
    [{ id: 'bot-a:channel:one' }],
    [{ code: 'ZZZLIVE1' }],
    ['bot-a:channel:one:code:ZZZLIVE1']
  );

  assert.deepStrictEqual(deliveries, []);
});

test('records successful code-target deliveries and leaves failures pending', () => {
  const targets = [
    { id: 'bot-a:channel:one' },
    { id: 'bot-a:channel:two' }
  ];
  const codes = [{ code: 'ZZZLIVE1' }];
  const pending = getPendingCodeDeliveries(targets, codes, []);
  const progress = getCodeDeliveryProgress(targets, codes, [], pending, [
    { status: 'fulfilled', value: true },
    { status: 'rejected', reason: new Error('Missing Access') }
  ]);

  assert.deepStrictEqual(progress.successfulCodeTargetIds, [
    'bot-a:channel:one:code:ZZZLIVE1'
  ]);
  assert.strictEqual(progress.distributed, false);
  assert.strictEqual(progress.failCount, 1);
});
