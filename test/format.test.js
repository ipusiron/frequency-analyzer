const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const files = ['index.html', 'main.js', 'freq-logic.js', 'style.css',
  ...fs.readdirSync(__dirname).filter(n => n.endsWith('.test.js')).map(n => `test/${n}`)];
const minimums = { 'index.html': 80, 'main.js': 200, 'freq-logic.js': 90, 'style.css': 300 };

for (const file of files) {
  test(`${file}の複数行整形と行幅`, () => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    const lines = content.trimEnd().split(/\r?\n/);
    const limit = file === 'index.html' ? 250 : 160;
    assert.ok(lines.length >= (minimums[file] || 10), '行数が少なすぎる');
    lines.forEach((line, index) => assert.ok(line.length <= limit, `${index + 1}行目: ${line.length}文字`));
    assert.ok(content.endsWith('\n'), '末尾改行');
    assert.doesNotMatch(content, /[^\r\n\S]+\r?$/m, '行末の不要な空白');
  });
}
