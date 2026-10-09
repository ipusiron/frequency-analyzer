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

test('ユースケースの「このツールならではの使い方」の数値は計算部と同じ（日英）', () => {
  const readmeEn = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');
  const vowelShare = (t) => {
    const r = L.analyzeText(t);
    const v = r.rows.filter((x) => 'AEIOU'.includes(x.char)).reduce((a, x) => a + x.count, 0);
    return [r.letterCount, v, (v / r.letterCount * 100).toFixed(1), L.indexOfCoincidence(t).toFixed(3)];
  };
  const iroha = 'IROHANIHOHETO CHIRINURUWO WAKAYOTAREZO TSUNENARAMU UINOOKUYAMA KEFUKOETE ASAKIYUMEMISHI WEHIMOSEZU';
  const g = 'FOUR SCORE AND SEVEN YEARS AGO OUR FATHERS BROUGHT FORTH ON THIS CONTINENT A NEW NATION CONCEIVED '
    + 'IN LIBERTY AND DEDICATED TO THE PROPOSITION THAT ALL MEN ARE CREATED EQUAL';
  const [a, b] = [vowelShare(iroha), vowelShare(g)];
  assert.deepEqual(a, [91, 47, '51.6', '0.066']);
  assert.deepEqual(b, [143, 58, '40.6', '0.068']);
  for (const t of [iroha, g]) assert.equal(L.classifyIC(L.indexOfCoincidence(t)), 'ic.plainLike');
  const F = L.ENGLISH_FREQ;
  const share = (s) => [...s].reduce((x, c) => x + F[c], 0).toFixed(1);
  const [vow, top, home, bottom] = [share('AEIOU'), share('QWERTYUIOP'), share('ASDFGHJKL'), share('ZXCVBNM')];
  assert.deepEqual([vow, top, home, bottom], ['38.1', '51.3', '34.0', '14.6']);
  const ja = [`英字${a[0]}字）は母音が${a[1]}字で${a[2]}%`, `英字${b[0]}字）は${b[2]}%`, `標準の頻度表では${vow}%`,
    `いろは歌が${a[3]}、演説が${b[3]}`, `上の段で打つ字が${top}%、ホーム段が${home}%、下の段が${bottom}%`];
  for (const part of ja) assert.ok(readme.includes(part), part);
  const en = [`(${a[0]} letters) has ${a[1]} vowels, or ${a[2]}%`, `(${b[0]} letters) has ${b[2]}%`,
    `${vow}% in the standard English`, `${a[3]} for the Iroha poem and ${b[3]} for the address`,
    `top row of a QWERTY keyboard make up ${top}%, the home row ${home}% and the bottom row ${bottom}%`];
  for (const part of en) assert.ok(readmeEn.includes(part), part);
  assert.ok(L.ETAOIN_ORDER.startsWith('ETAOINSHR'));
  assert.ok(readme.includes('E・T・A・O・I・N・S・H・R') && readmeEn.includes('E, T, A, O, I, N, S, H, R'));
});
