const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');

function tokens(selector) {
  const block = css.match(selector);
  assert.ok(block, 'CSS変数ブロックが存在する');
  const entries = [...block[1].matchAll(/--([\w-]+):\s*([^;]+);/g)];
  assert.ok(entries.length >= 37);
  return Object.fromEntries(entries.map(([, key, value]) => {
    assert.match(value, /^#[a-fA-F0-9]{6}$/, key);
    return [key, value];
  }));
}

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

const textPairs = [
  ['text-color', 'body-bg'], ['text-color', 'card-bg'], ['text-color', 'row-even-bg'],
  ['heading-color', 'card-bg'], ['heading-color', 'body-bg'],
  ['muted-text', 'card-bg'], ['muted-text', 'row-even-bg'], ['muted-text', 'body-bg'],
  ['accent', 'row-even-bg'], ['accent', 'card-bg'], ['accent', 'info-bg'], ['accent', 'body-bg'],
  ['button-text', 'button-bg'], ['button-text', 'button-hover'],
  ['danger-text', 'danger-bg'], ['danger-text', 'danger-hover'],
  ['success-text', 'success-bg'], ['success-text', 'success-hover'],
  ['neutral-text', 'neutral-bg'], ['neutral-text', 'neutral-hover'], ['dup-text', 'dup-bg'],
  ['info-text', 'info-bg'], ['warning-text', 'warning-bg'], ['notice-text', 'notice-bg'],
  ['stats-text', 'stats-bg'], ['input-text', 'input-bg'], ['input-text', 'highlight-bg'], ['axis-color', 'chart-bg']
];
// 棒とマーカーの相互比は対象外。背景色の4px下線で分離する設計。
const graphicsPairs = [['bar-color', 'chart-bg'], ['expected-color', 'chart-bg'], ['axis-color', 'chart-bg']];
const light = tokens(/:root\s*\{([^}]+)\}/);
const dark = { ...light, ...tokens(/\[data-theme="dark"\]\s*\{([^}]+)\}/) };

for (const [theme, colors] of [['light', light], ['dark', dark]]) {
  for (const [pairs, minimum] of [[textPairs, 4.5], [graphicsPairs, 3]]) {
    for (const [foreground, background] of pairs) {
      test(`${theme} ${foreground}/${background} >= ${minimum}`, () => {
        assert.ok(colors[foreground], foreground);
        assert.ok(colors[background], background);
        const a = luminance(colors[foreground]);
        const b = luminance(colors[background]);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        assert.ok(ratio >= minimum, `${ratio.toFixed(4)}:1`);
      });
    }
  }
}
