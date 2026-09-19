const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const html = read('index.html');

test('CSPとmeta、インライン禁止、classic deferの順序', () => {
  assert.match(html, /<meta name="viewport"/);
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
  assert.ok(csp);
  assert.doesNotMatch(csp[1], /frame-ancestors|unsafe-inline/);
  for (const directive of ["script-src 'self'", "style-src 'self'", "base-uri 'none'", "object-src 'none'", "form-action 'none'"]) {
    assert.ok(csp[1].includes(directive), directive);
  }
  assert.match(html, /<meta name="referrer" content="no-referrer"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /<link rel="icon" href="data:,"/);
  assert.doesNotMatch(html, /\s(?:on\w+|style)\s*=/i);
  const scripts = [...html.matchAll(/<script\b[^>]*>/g)].map(m => m[0]);
  assert.deepEqual(scripts, ['<script src="freq-logic.js" defer>', '<script src="main.js" defer>']);
  assert.doesNotMatch(html, /type="module"/);
  assert.doesNotMatch(read('main.js'), /innerHTML|alert\(|decodeURIComponent|\.style\.|\bfetch\(|XMLHttpRequest/);
  assert.doesNotMatch(read('freq-logic.js'), /\bdocument\b|\bwindow\b/);
});

test('操作要素・入力名・live領域・SVG・見出し・外部リンク', () => {
  for (const id of ['cipherText', 'decodedText', 'analyzeBtn', 'clearBtn', 'resetMappingBtn', 'copyBtn',
    'mappingTable', 'frequencyChart', 'frequencyResults', 'themeToggleBtn']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  assert.match(html, /<label for="cipherText"/);
  assert.match(html, /<textarea id="decodedText"[^>]+aria-label="[^"]+"/);
  assert.match(html, /id="charStats"[^>]+aria-live="polite"/);
  assert.match(html, /<svg[^>]+role="img"[^>]+aria-label="[^"]+"/);
  assert.match(html, /<title>観測％/);
  assert.match(html, /id="helpBtn"[^>]+aria-expanded="false"/);
  const headings = [...html.matchAll(/<h([1-6])\b/g)].map(m => Number(m[1]));
  assert.equal(headings[0], 1);
  assert.ok(headings.slice(1).every(n => n === 2));
  const links = [...html.matchAll(/<a\s[^>]*href="https?:[^>]+>/g)];
  assert.ok(links.length >= 2);
  for (const link of links) assert.match(link[0], /rel="noopener noreferrer"/);
});

test('workflowはpushとPR、Node22、contents read、npm test', () => {
  const workflow = read('.github/workflows/test.yml');
  assert.match(workflow, /\n  push:/);
  assert.match(workflow, /\n  pull_request:/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /node-version: '22'/);
  assert.match(workflow, /run: npm test/);
  assert.deepEqual(JSON.parse(read('package.json')),
    { name: 'frequency-analyzer', private: true, scripts: { test: 'node --test' } });
});
