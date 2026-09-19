const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../freq-logic.js');
const root = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const initial = html.match(/<textarea id="cipherText"[^>]*>([^<]+)<\/textarea>/)[1];
const result = L.analyzeText(initial);

test('READMEの混在入力例は小文字を区切りにする', () => {
  assert.ok(readme.includes('IC・n-gramも大文字だけを集計'));
  assert.ok(readme.includes('`ABcDE`は大文字4字・2語'));
  assert.equal(L.analyzeText('ABcDE').letterCount, 4);
  assert.equal(L.wordsOf('ABcDE').length, 2);
  assert.deepEqual(L.ngramCounts('ABcDE', 2).map(row => row.text), ['AB', 'DE']);
});

test('READMEの統計表と正解率を再計算', () => {
  const expected = {
    英字数: result.letterCount, 異なり文字数: result.uniqueCount, 総文字数: result.totalLength,
    語数: L.wordsOf(initial).length, 'IC（小数4桁）': L.indexOfCoincidence(initial).toFixed(4)
  };
  for (const [key, value] of Object.entries(expected)) {
    const line = readme.split('\n').find(line => line.startsWith(`| ${key} |`));
    assert.ok(line, key);
    assert.equal(line.split('|')[2].trim(), String(value));
  }
  const guessed = L.systemGuess(result.rows);
  const correct = Object.keys(guessed).filter(char =>
    guessed[char] === String.fromCharCode((char.charCodeAt(0) - 65 + 23) % 26 + 65)).length;
  assert.ok(readme.includes(`| ETAOIN推測の正解数 | ${correct}/${result.uniqueCount} |`));
});

test('README上位頻度表6行と英語頻度表26行', () => {
  const rows = [...readme.matchAll(/^\| ([A-Z]) \| (\d+) \| ([\d.]+) \| ([\d.]+) \| ([+-][\d.]+) \|$/gm)];
  assert.equal(rows.length, 6);
  rows.forEach((match, i) => {
    const r = result.rows[i];
    assert.deepEqual(match.slice(1), [r.char, String(r.count), r.percent.toFixed(2), r.expected.toFixed(3),
      `${r.diff >= 0 ? '+' : ''}${r.diff.toFixed(2)}`]);
  });
  const frequencies = [...readme.matchAll(/^\| ([A-Z]) \| ([\d.]+) \|$/gm)];
  assert.equal(frequencies.length, 26);
  frequencies.forEach(([, char, percent]) => assert.equal(Number(percent), L.ENGLISH_FREQ[char]));
});

test('READMEの暗号文・既知平文・短文IC・EAGLE例', () => {
  const examples = [...readme.matchAll(/```text\r?\n([^`]+?)\r?\n```/g)].map(m => m[1]);
  const cipher = examples.find(text => text.startsWith('LW LV'));
  const plain = examples.find(text => text.startsWith('it is impossible'));
  assert.equal(cipher, initial);
  assert.ok(plain);
  const mapping = Object.fromEntries([...new Set(initial.match(/[A-Z]/g))].map(char =>
    [char, String.fromCharCode((char.charCodeAt(0) - 65 + 23) % 26 + 65)]));
  assert.equal(L.decodeWithMapping(cipher, mapping), plain);
  const letters = initial.replace(/[^A-Z]/g, '');
  for (const n of [10, 20, 50, 86]) {
    assert.ok(readme.includes(`| ${n} | ${L.indexOfCoincidence(letters.slice(0, n)).toFixed(6)} |`));
  }
  let index = 0;
  const vigenere = plain.toUpperCase().replace(/[A-Z]/g, char => {
    const key = 'EAGLE'[index++ % 5].charCodeAt(0) - 65;
    return String.fromCharCode((char.charCodeAt(0) - 65 + key) % 26 + 65);
  });
  assert.ok(readme.includes(`ICは${L.indexOfCoincidence(vigenere).toFixed(6)}`));
});

test('READMEの全相対画像が実在し、スクリーンショット4枚を含む', () => {
  const paths = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src="([^"]+)"/g)]
    .map(m => m[1] || m[2]).filter(src => !/^https?:/.test(src));
  assert.ok(paths.length >= 5);
  for (const src of paths) assert.ok(fs.existsSync(path.join(root, src)), src);
  for (const name of ['screenshot.png', 'screenshot2.png', 'screenshot3.png', 'screenshot4.png']) {
    assert.ok(paths.includes(`assets/${name}`), name);
  }
});

test('YAML構造・固定値・シリーズ・MITを保持', () => {
  const metadata = readme.match(/^<!--\r?\n([\s\S]+?)\r?\n-->/);
  assert.ok(metadata);
  const keys = [...metadata[1].matchAll(/^(\w+):/gm)].map(m => m[1]);
  assert.deepEqual(keys, ['id', 'slug', 'title', 'subtitle_ja', 'subtitle_en', 'description_ja', 'description_en',
    'category_ja', 'category_en', 'difficulty', 'tags', 'repo_url', 'demo_url', 'hub']);
  for (const key of ['category_ja', 'category_en', 'tags']) {
    assert.match(metadata[1], new RegExp(`^${key}:\\r?\\n  - `, 'm'));
  }
  for (const [key, value] of Object.entries({ id: 'day009', slug: 'frequency-analyzer',
    repo_url: 'https://github.com/ipusiron/frequency-analyzer',
    demo_url: 'https://ipusiron.github.io/frequency-analyzer/', hub: 'true' })) {
    const line = metadata[1].split(/\r?\n/).find(line => line.startsWith(`${key}:`));
    assert.ok(line, key);
    assert.equal(line.slice(key.length + 1).trim().replace(/^"|"$/g, ''), value);
  }
  assert.ok(readme.includes('Day009 - 生成AIで作るセキュリティツール100'));
  assert.ok(readme.includes('page_id=42163'));
  assert.ok(readme.includes('[MITライセンス](./LICENSE)'));
  const license = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8');
  assert.ok(license.startsWith('MIT License\n') || license.startsWith('MIT License\r\n'));
  assert.ok(license.includes('Copyright (c) 2025 ipusiron'));
});
