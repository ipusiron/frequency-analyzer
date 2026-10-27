const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');

// theme-init.js を、保存値と OS 設定を差し替えた仮の window で動かし、付いた data-theme を返す。
function run({ saved = null, prefersDark = false, storageThrows = false } = {}) {
  const dataset = {};
  const window = {
    localStorage: { getItem: () => { if (storageThrows) throw new Error('blocked'); return saved; } },
    matchMedia: () => ({ matches: prefersDark }),
    document: { documentElement: { dataset } },
  };
  vm.runInNewContext(read('theme-init.js'), { window });
  return dataset.theme;
}

test('保存値がなければ OS の設定に従う', () => {
  assert.equal(run({ prefersDark: true }), 'dark');
  assert.equal(run({ prefersDark: false }), 'light');
});

test('保存値は OS の設定より優先する', () => {
  assert.equal(run({ saved: 'light', prefersDark: true }), 'light');
  assert.equal(run({ saved: 'dark', prefersDark: false }), 'dark');
});

test('"dark" 以外の保存値はライトとして扱う', () => {
  assert.equal(run({ saved: 'blue', prefersDark: true }), 'light');
});

test('localStorage が使えなくても落ちず、OS の設定に従う', () => {
  assert.equal(run({ storageThrows: true, prefersDark: true }), 'dark');
  assert.equal(run({ storageThrows: true, prefersDark: false }), 'light');
});

test('index.html の <head> で、stylesheet のあとに同期で読み込む', () => {
  const html = read('index.html');
  const head = html.slice(0, html.indexOf('</head>'));
  assert.ok(head.includes('<script src="theme-init.js"></script>'), '<head> に theme-init.js がない');
  assert.ok(head.indexOf('style.css') < head.indexOf('theme-init.js'));
});

test('main.js は初回にテーマを決め直さず、<head> で付けた値に合わせる', () => {
  const main = read('main.js');
  assert.doesNotMatch(main, /prefers-color-scheme/);
  assert.doesNotMatch(main, /localStorage\.getItem\('theme'\)/);
  assert.match(main, /applyTheme\(document\.documentElement\.dataset\.theme\)/);
});
