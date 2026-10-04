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

test('「#」より後ろのtextを優先し、なければ「?」から読む', () => {
  const { linkParams } = require('../freq-logic.js');
  assert.equal(readTextParam(linkParams('?text=QUERY', '#text=HASH')).text, 'HASH');
  assert.equal(readTextParam(linkParams('?text=QUERY', '')).text, 'QUERY');
  assert.equal(readTextParam(linkParams('', '#text=A%2BB')).text, 'A+B');
  assert.equal(readTextParam(linkParams('?lang=en', '#other=1')).text, null);
  // 「#」なら長さの上限はURLでなく、このツールの5000字だけ
  assert.equal(readTextParam(linkParams('', `#text=${'A'.repeat(5000)}`)).text.length, 5000);
  assert.equal(readTextParam(linkParams('', `#text=${'A'.repeat(5001)}`)).warningKey, 'url.tooLong');
});

test('読み込んだtextは「?」と「#」の両方から消す（ほかの値と、textのない「#」は残す）', () => {
  const { urlWithoutText } = require('../freq-logic.js');
  const base = 'https://ipusiron.github.io/frequency-analyzer/';
  assert.equal(urlWithoutText(`${base}?text=ABC&lang=en`), '/frequency-analyzer/?lang=en');
  assert.equal(urlWithoutText(`${base}?lang=en#text=ABC`), '/frequency-analyzer/?lang=en');
  assert.equal(urlWithoutText(`${base}#text=ABC&x=1`), '/frequency-analyzer/#x=1');
  assert.equal(urlWithoutText(`${base}?text=ABC#top`), '/frequency-analyzer/#top');
  assert.equal(urlWithoutText(`${base}?lang=en#top`), null);
});
