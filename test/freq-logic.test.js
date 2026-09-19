const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../freq-logic.js');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const initial = html.match(/<textarea id="cipherText"[^>]*>([^<]+)<\/textarea>/)[1];
const plaintext = 'it is impossible to say how first the idea entered my brain; '
  + 'but once conceived, it haunted me day and night.';
const solution = { H: 'E', L: 'I', W: 'T', Q: 'N', D: 'A', G: 'D', V: 'S', R: 'O', K: 'H', P: 'M',
  E: 'B', B: 'Y', U: 'R', F: 'C', X: 'U', S: 'P', O: 'L', Z: 'W', I: 'F', Y: 'V', J: 'G' };

test('初期暗号文の86字・21種類・109文字と先頭6行', () => {
  const result = L.analyzeText(initial);
  assert.equal(result.letterCount, 86);
  assert.equal(result.uniqueCount, 21);
  assert.equal(result.totalLength, 109);
  const expected = [
    ['H', 11, '12.79', 6.094, '6.70'], ['L', 10, '11.63', 4.025, '7.60'],
    ['W', 9, '10.47', 2.360, '8.11'], ['Q', 7, '8.14', 0.095, '8.04'],
    ['D', 6, '6.98', 4.253, '2.72'], ['G', 6, '6.98', 2.015, '4.96']
  ];
  assert.deepEqual(result.rows.slice(0, 6).map(r =>
    [r.char, r.count, r.percent.toFixed(2), r.expected, r.diff.toFixed(2)]), expected);
  assert.deepEqual(L.analyzeText('CBACBA').rows.map(r => r.char), ['C', 'B', 'A']);
  assert.equal(L.wordsOf(initial).length, 21);
});

test('英語頻度合計とICの既知値', () => {
  assert.ok(Math.abs(Object.values(L.ENGLISH_FREQ).reduce((a, b) => a + b) - 99.999) < 1e-10);
  assert.equal(L.indexOfCoincidence(initial).toFixed(6), '0.062654');
  assert.equal(L.indexOfCoincidence('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), 0);
  assert.equal(L.indexOfCoincidence('AAAA'), 1);
  assert.equal(L.indexOfCoincidence('A'), null);
  assert.equal(L.indexOfCoincidence(''), null);
});

test('IC分類の0.060・0.045境界と低信頼29/30字', () => {
  assert.equal(L.classifyIC(0.060), '英語平文に近い（単一換字や転置の可能性）');
  assert.equal(L.classifyIC(0.059999), '判定保留');
  assert.equal(L.classifyIC(0.045), '判定保留');
  assert.equal(L.classifyIC(0.044999), '均等分布に近い（多表式の可能性）');
  assert.match(L.classifyIC(null), /算出不可/);
  assert.equal(L.isICReliable('A'.repeat(29)), false);
  assert.equal(L.isICReliable('A'.repeat(30)), true);
});

test('混在入力の頻度とICは大文字だけを集計する', () => {
  assert.equal(L.analyzeText('AAaaBBbb').letterCount, 4);
  assert.equal(L.indexOfCoincidence('AAaaBBbb'), 1 / 3);
  assert.equal(L.indexOfCoincidence('aaaa'), null);
  assert.equal(L.isICReliable('A'.repeat(29) + 'a'.repeat(100)), false);
  assert.equal(L.isICReliable('A'.repeat(30) + 'a'), true);
});

test('小文字をn-gramの区切りにし、大文字同士をつなげない', () => {
  assert.deepEqual(L.wordsOf('ABcDE fGH'), ['AB', 'DE', 'GH']);
  assert.deepEqual(L.ngramCounts('ABcDE AB', 2), [{ text: 'AB', count: 2 }, { text: 'DE', count: 1 }]);
  assert.deepEqual(L.ngramCounts('ABcDE', 3), []);
  assert.deepEqual(L.doubledLetters('AaA BBccDD'), [{ text: 'BB', count: 1 }, { text: 'DD', count: 1 }]);
  assert.deepEqual(L.ngramCounts('abc', 2), []);
});

test('二重字56種65件、反復8件は回数順・辞書順', () => {
  const grams = L.ngramCounts(initial, 2);
  assert.equal(grams.length, 56);
  assert.equal(grams.reduce((sum, r) => sum + r.count, 0), 65);
  assert.deepEqual(grams.filter(r => r.count >= 2).map(r => [r.text, r.count]),
    [['HG', 3], ['DB', 2], ['FH', 2], ['LW', 2], ['QF', 2], ['QW', 2], ['RQ', 2], ['WH', 2]]);
});

test('三重字41種44件、反復3件とダブルレターVV', () => {
  const grams = L.ngramCounts(initial, 3);
  assert.equal(grams.length, 41);
  assert.equal(grams.reduce((sum, r) => sum + r.count, 0), 44);
  assert.deepEqual(grams.filter(r => r.count >= 2).map(r => [r.text, r.count]),
    [['QFH', 2], ['QWH', 2], ['RQF', 2]]);
  assert.deepEqual(L.doubledLetters(initial), [{ text: 'VV', count: 1 }]);
  assert.deepEqual(L.ngramCounts('AB CD!EF\nGH', 2).map(r => r.text), ['AB', 'CD', 'EF', 'GH']);
  assert.deepEqual(L.ngramCounts('AB CD', 3), []);
  assert.deepEqual(L.ngramCounts('ABC', 0), []);
});

test('ETAOIN方式を保持し、初期推測の正解はHとVの2/21', () => {
  assert.equal(L.ETAOIN_ORDER, 'ETAOINSHRDLCUMWFGYPBVKJXQZ');
  const guesses = L.systemGuess(L.analyzeText(initial).rows);
  assert.deepEqual(Object.keys(guesses).filter(c => guesses[c] === solution[c]), ['H', 'V']);
  assert.equal(L.systemGuess([{ char: 'A' }], new Set(['E'])).A, 'T');
});

test('全21行の候補K J X Q Z、H空欄ではEを先頭に追加', () => {
  const rows = L.analyzeText(initial).rows;
  const mapping = L.systemGuess(rows);
  for (const { char } of rows) assert.equal(L.candidatesFor(char, mapping).text, 'K J X Q Z', char);
  mapping.H = '';
  assert.equal(L.candidatesFor('H', mapping).text, 'E K J X Q Z');
  const many = L.candidatesFor('A', {}, new Set(['E']));
  assert.equal(many.letters.length, 8);
  assert.equal(many.remaining, 17);
  assert.ok(many.text.endsWith('…'));
  assert.ok(!many.letters.includes('E'));
});

test('mergeMappingは手動値と空欄を保持、消失文字を除外、その他を更新', () => {
  const rows = L.analyzeText('AABBCC').rows;
  const before = { A: 'Z', B: '', C: 'Q', D: 'P' };
  assert.deepEqual(L.mergeMapping(rows, before, new Set(['A', 'B', 'D']), { A: 'E', B: 'T', C: 'A' }),
    { A: 'Z', B: '', C: 'A' });
  assert.deepEqual(before, { A: 'Z', B: '', C: 'Q', D: 'P' });
});

test('正解マッピングで既知平文、未設定・?・小文字・Unicodeを保持', () => {
  assert.equal(L.decodeWithMapping(initial, solution), plaintext);
  assert.equal(L.decodeWithMapping('AB CD? xy 日本語😀', { A: 'Z', B: '?' }), 'z? CD? xy 日本語😀');
  assert.equal(L.decodeWithMapping('', {}), '');
  assert.equal(L.analyzeText('日本語😀abc').letterCount, 0);
  assert.equal(L.analyzeText('A'.repeat(5000)).letterCount, 5000);
  assert.deepEqual(L.analyzeText('').rows, []);
});
