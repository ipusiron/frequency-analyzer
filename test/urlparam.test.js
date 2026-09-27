const test = require('node:test');
const assert = require('node:assert/strict');
const { readTextParam } = require('../freq-logic.js');

for (const [query, expected] of [
  ['?text=100%25', '100%'], ['?text=%2541BC', '%41BC'], ['?text=LW%20LV', 'LW LV'],
  ['?text=A%2BB', 'A+B'], ['?text=A+B', 'A B']
]) {
  test(`URLを一度だけデコード ${query}`, () => {
    assert.deepEqual(readTextParam(new URLSearchParams(query)), { text: expected, warningKey: '' });
  });
}

test('URLの5000字境界・未指定・明示的空文字', () => {
  const accepted = readTextParam(new URLSearchParams({ text: 'A'.repeat(5000) }));
  assert.equal(accepted.text.length, 5000);
  assert.equal(accepted.warningKey, '');
  const rejected = readTextParam(new URLSearchParams({ text: 'A'.repeat(5001) }));
  assert.equal(rejected.text, null);
  // 警告は文言ではなく辞書のキーで返る。
  assert.equal(rejected.warningKey, 'url.tooLong');
  assert.equal(readTextParam(new URLSearchParams()).warningKey, '');
  assert.equal(readTextParam(new URLSearchParams()).text, null);
  assert.equal(readTextParam(new URLSearchParams('text=')).text, '');
});
