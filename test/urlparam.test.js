const test = require('node:test');
const assert = require('node:assert/strict');
const { readTextParam } = require('../freq-logic.js');

for (const [query, expected] of [
  ['?text=100%25', '100%'], ['?text=%2541BC', '%41BC'], ['?text=LW%20LV', 'LW LV'],
  ['?text=A%2BB', 'A+B'], ['?text=A+B', 'A B']
]) {
  test(`URLを一度だけデコード ${query}`, () => {
    assert.deepEqual(readTextParam(new URLSearchParams(query)), { text: expected, warning: '' });
  });
}

test('URLの5000字境界・未指定・明示的空文字', () => {
  const accepted = readTextParam(new URLSearchParams({ text: 'A'.repeat(5000) }));
  assert.equal(accepted.text.length, 5000);
  assert.equal(accepted.warning, '');
  const rejected = readTextParam(new URLSearchParams({ text: 'A'.repeat(5001) }));
  assert.equal(rejected.text, null);
  assert.match(rejected.warning, /5,000文字を超える/);
  assert.equal(readTextParam(new URLSearchParams()).text, null);
  assert.equal(readTextParam(new URLSearchParams('text=')).text, '');
});
