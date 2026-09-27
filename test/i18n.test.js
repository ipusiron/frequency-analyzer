const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const I18n = require(path.join(root, 'i18n.js'));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const logic = fs.readFileSync(path.join(root, 'freq-logic.js'), 'utf8');
const readmeJa = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const readmeEn = fs.readFileSync(path.join(root, 'README.en.md'), 'utf8');
// gフラグを付けるとlastIndexが残り、ループでtestが交互に失敗する。
const JAPANESE = /[぀-ヿ一-鿿]/;

test('日本語と英語で、キーの集合が同じ', () => {
  assert.deepEqual(Object.keys(I18n.ja).filter(key => !(key in I18n.en)), [], '英語に無いキーがある');
  assert.deepEqual(Object.keys(I18n.en).filter(key => !(key in I18n.ja)), [], '日本語に無いキーがある');
  assert.ok(Object.keys(I18n.ja).length >= 60, `キーが少なすぎる: ${Object.keys(I18n.ja).length}`);
});

test('差し込みの名前が、日本語と英語で一致する', () => {
  const holes = value => [...String(value).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
  assert.deepEqual(Object.keys(I18n.ja).filter(key => holes(I18n.ja[key]) !== holes(I18n.en[key])), []);
});

test('index.htmlが指すキーは、すべて辞書にある', () => {
  const keys = new Set();
  for (const m of html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)) keys.add(m[1]);
  assert.ok(keys.size >= 35, `data-i18nが少なすぎる: ${keys.size}`);
  assert.deepEqual([...keys].filter(key => !(key in I18n.ja)), []);
});

test('main.jsが呼ぶキーは、すべて辞書にある', () => {
  const keys = new Set();
  for (const m of main.matchAll(/I18n\.t\(\s*['"]([\w.]+)['"]/g)) keys.add(m[1]);
  for (const m of main.matchAll(/['"]((?:theme|button|ngram|double)\.[a-zA-Z]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size >= 15, `I18n.tの呼び出しが少なすぎる: ${keys.size}`);
  assert.deepEqual([...keys].filter(key => !(key in I18n.ja)), []);
});

test('英語の辞書に、訳し忘れの日本語が残っていない', () => {
  // 言語の切り替えボタンだけは、相手の言語を出すのが正しい
  const expected = new Set(['app.langButton']);
  assert.deepEqual(Object.keys(I18n.en).filter(key => !expected.has(key) && JAPANESE.test(I18n.en[key])), []);
});

test('t()は差し込みを埋め、知らないキーは黙って通さない', () => {
  assert.equal(I18n.t('freq.row', { char: 'H', count: 11, percent: '12.79', expected: '6.094', diff: '+6.70' }),
    'H: 11（12.79%／英語 6.094%／差 +6.70）');
  assert.equal(I18n.t('mapping.inputAria', { char: 'Q' }), '暗号文文字Qに対応する平文文字');
  assert.throws(() => I18n.t('no.such.key'), /Unknown message/);
  assert.throws(() => I18n.t('ic.plainlike'), /Unknown message/);
});

test('純粋ロジックが返す分類キーは、すべて辞書にある', () => {
  const L = require(path.join(root, 'freq-logic.js'));
  for (const ic of [null, Number.NaN, 0.1, 0.060, 0.05, 0.0449, 0]) {
    assert.ok(L.classifyIC(ic) in I18n.ja, String(ic));
  }
  assert.ok(L.readTextParam(new URLSearchParams({ text: 'A'.repeat(5001) })).warningKey in I18n.ja);
});

test('freq-logic.jsの文字列に和文が残っていない', () => {
  // コメントは日本語のままでよい。返り値の文言だけを外に出す。
  const stripped = logic.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(stripped, JAPANESE);
});

test('子要素を持つ要素にdata-i18nを付けていない', () => {
  const offenders = [];
  for (const m of html.matchAll(/<(\w+)\b[^>]*data-i18n="[^"]+"[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (m[2].includes('<')) offenders.push(m[0].slice(0, 60));
  }
  assert.deepEqual(offenders, []);
});

test('状態の判定と書き戻しを、表示中の文言で行っていない', () => {
  // 言語を変えると文字列が変わるため、datasetの印で状態を持つ
  assert.match(main, /dataset\.copyState/);
  assert.match(main, /dataset\.messageKey/);
  assert.match(main, /dataset\.letters/);
  assert.doesNotMatch(main, /textContent\s*===/);
  assert.doesNotMatch(main, /=\s*['"]📋/);
  assert.doesNotMatch(main, /=\s*['"]✅/);
  // 状態で変わるaria-labelは、apply()に任せず毎回組み立てる
  assert.doesNotMatch(html, /id="themeToggleBtn"[^>]*data-i18n-aria-label/);
  assert.match(main, /setAttribute\('aria-label', I18n\.t\(isDark \? 'theme\.toLight' : 'theme\.toDark'\)\)/);
});

test('言語の切り替えで再描画し、クリア状態では再分析しない', () => {
  assert.match(main, /addEventListener\('languagechange'/);
  assert.match(main, /if \(!isCleared\) analyze\(\);/);
  for (const name of ['renderUrlWarning', 'renderCopyFeedback', 'renderDuplicateMessage', 'applyTheme']) {
    assert.ok(main.includes(`${name}(`), name);
  }
});

test('main.jsの文字列リテラルに和文が残っていない', () => {
  // 和文はコメントだけに残る。文言はすべてi18n.jsへ移す。
  const stripped = main.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const literals = [...stripped.matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)].map(m => m[1] ?? m[2]);
  assert.deepEqual(literals.filter(value => JAPANESE.test(value)), []);
});

test('index.htmlの和文には、必ず辞書のキーが添えられている', () => {
  const withoutKeys = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(\w+)\b[^>]*\sdata-i18n="[^"]+"[^>]*>[\s\S]*?<\/\1>/g, '')
    .replace(/<[^>]*\sdata-i18n-[a-z-]+="[^"]+"[^>]*>/g, '');
  const leftovers = withoutKeys.split(/\r?\n/).filter(line => JAPANESE.test(line)).map(line => line.trim());
  // 例外は3つだけ。metaのdescription、状態で文言が変わるテーマボタン、
  // そしてnoscript（JSなしでは切り替えられないので併記する）である。
  assert.equal(leftovers.length, 3, leftovers.join(' | '));
  assert.match(leftovers[0], /^<meta name="description"/);
  assert.match(leftovers[1], /^<button id="themeToggleBtn"/);
  assert.match(leftovers[2], /^<noscript>/);
});

test('i18n.jsを他のスクリプトより先に読み込む', () => {
  assert.ok(html.indexOf('<script src="i18n.js"') < html.indexOf('<script src="freq-logic.js"'));
  assert.ok(html.indexOf('<script src="freq-logic.js"') < html.indexOf('<script src="main.js"'));
  // 言語の保存はi18n.jsだけが持つ
  assert.match(fs.readFileSync(path.join(root, 'i18n.js'), 'utf8'), /frequency-analyzer-language/);
  assert.doesNotMatch(main, /-language/);
});

test('noscriptは日英を併記する', () => {
  const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/);
  assert.ok(noscript);
  assert.match(noscript[1], /JavaScriptが必要です/);
  assert.match(noscript[1], /requires JavaScript/);
});

test('READMEは日英を相互にリンクする', () => {
  assert.ok(readmeJa.includes('[English](README.en.md) · 日本語'));
  assert.ok(readmeEn.includes('English · [日本語](README.md)'));
  // 言語リンクはYAMLコメントより後（H1の直後）に置く
  assert.ok(readmeJa.indexOf('-->') < readmeJa.indexOf('[English](README.en.md)'));
  // 英語READMEに残る和文は、日本語版への案内か日本語資料の題だけ
  const cjkLines = readmeEn.split(/\r?\n/).filter(line => JAPANESE.test(line));
  assert.deepEqual(cjkLines.filter(line => !/日本語|Japanese/.test(line)), []);
  for (const name of ['i18n.js', 'README.en.md', 'test/i18n.test.js']) {
    assert.ok(readmeJa.includes(name), `README.mdに${name}が無い`);
    assert.ok(readmeEn.includes(name), `README.en.mdに${name}が無い`);
  }
});
