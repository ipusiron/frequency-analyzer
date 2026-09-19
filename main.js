let frequencyData = {};
let currentMapping = {};
let systemGuess = {};
let previousDecoded = '';
let confirmedPlainChars = new Set(); // 確定平文文字（小文字で入力された文字）
let manualChars = new Set();
let analysis = FrequencyLogic.analyzeText('');
let highlightTimer;
let copyTimer;

function analyze() {
  const input = document.getElementById("cipherText").value;

  // 大文字のみを抽出（暗号文文字）
  const cipherCharsOnly = input.replace(/[^A-Z]/g, '');
  // 小文字のみを抽出（平文文字）
  const plainCharsOnly = input.replace(/[^a-z]/g, '');

  // 手動調整は再分析しても保持する。
  analysis = FrequencyLogic.analyzeText(input);

  // 非英字文字が含まれているかチェック
  const hasNonAlpha = /[^A-Za-z]/.test(input);
  document.getElementById("nonAlphaWarning").hidden = !hasNonAlpha;

  // 確定平文文字を更新（小文字を大文字に変換してセットに格納）
  confirmedPlainChars = new Set([...plainCharsOnly].map(c => c.toUpperCase()));

  // 小文字（平文）が含まれる場合のUI表示
  const hasLowercase = plainCharsOnly.length > 0;
  if (hasLowercase) {
    document.getElementById("caseProcessingMessage").hidden = false;
    document.getElementById("confirmedStats").hidden = false;

    // 統計情報の更新
    const uniqueCipherChars = [...new Set(cipherCharsOnly)].sort();
    const uniquePlainChars = [...new Set(plainCharsOnly)].sort();
    document.getElementById("cipherCharCount").textContent = uniqueCipherChars.length;
    document.getElementById("cipherCharList").textContent = uniqueCipherChars.join('');
    document.getElementById("plainCharCount").textContent = uniquePlainChars.length;
    document.getElementById("plainCharList").textContent = uniquePlainChars.join('');
  } else {
    document.getElementById("caseProcessingMessage").hidden = true;
    document.getElementById("confirmedStats").hidden = true;
  }

  // 頻度カウント（大文字のみ対象）
  frequencyData = Object.fromEntries(analysis.rows.map(row => [row.char, row.count]));
  document.getElementById('charStats').hidden = false;
  document.getElementById('analysisStats').textContent =
    `英字${analysis.letterCount}字・異なり${analysis.uniqueCount}文字・語数${FrequencyLogic.wordsOf(input).length}`;
  const ic = FrequencyLogic.indexOfCoincidence(input);
  document.getElementById('icStats').textContent =
    `IC ${ic === null ? '—' : ic.toFixed(4)}：${FrequencyLogic.classifyIC(ic)}`;
  document.getElementById('reliabilityNote').textContent = FrequencyLogic.isICReliable(input)
    ? '' : '英字30字未満の短文のため信頼性が低い目安です。';

  // 頻度表の表示
  const freqLines = analysis.rows.map(({ char, count, percent, expected, diff }) =>
    `${char}: ${count}（${percent.toFixed(2)}%／英語 ${expected.toFixed(3)}%／差 ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}）`);

  const frequencyResults = document.getElementById("frequencyResults");
  frequencyResults.replaceChildren();
  freqLines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'frequency-item';
    div.textContent = line;
    frequencyResults.appendChild(div);
  });
  if (!analysis.letterCount) frequencyResults.textContent = '英字（A-Z）が含まれていません';
  displayNgrams(input);

  // システム推測の生成
  generateSystemGuess();

  // マッピングテーブルの作成
  createMappingTable();

  // 棒グラフの描画
  drawFrequencyChart();

  // 重複チェック
  checkDuplicates();

  // 初回分析時に復号を実行
  decodeText();
}

function generateSystemGuess() {
  // ETAOIN順から確定平文文字を除外
  systemGuess = FrequencyLogic.systemGuess(analysis.rows, confirmedPlainChars);

  // 現在の暗号文に存在しない文字のマッピングを削除
  manualChars.forEach(char => {
    if (!frequencyData[char]) {
      manualChars.delete(char);
    }
  });

  currentMapping = FrequencyLogic.mergeMapping(analysis.rows, currentMapping, manualChars, systemGuess);
}

function createMappingTable() {
  // 登場している暗号文文字のみを対象（頻度順でソート）
  const cipherChars = Object.entries(frequencyData)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const table = document.getElementById('mappingTable');
  table.replaceChildren();
  cipherChars.forEach(char => {
    const count = frequencyData[char] || 0;
    const countText = ` (${count})`;
    const guess = systemGuess[char] || '';
    const candidates = getCandidates(char);

    const row = document.createElement('div');
    row.className = 'mapping-row';
    for (const [className, text] of [
      ['cipher-char', `${char}${countText}`], ['system-guess-container', ''],
      ['arrow', '→'], ['mapping-input-container', ''], ['candidates', candidates]
    ]) {
      const cell = document.createElement('div');
      cell.className = className;
      cell.textContent = text;
      row.appendChild(cell);
    }
    const guessElement = document.createElement('div');
    guessElement.className = 'system-guess';
    guessElement.textContent = guess;
    row.children[1].appendChild(guessElement);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'mapping-input';
    input.id = `map_${char}`;
    input.maxLength = 1;
    input.value = currentMapping[char] || '';
    input.setAttribute('aria-label', `暗号文文字${char}に対応する平文文字`);
    row.children[3].appendChild(input);
    table.appendChild(row);

    // DOM構築は同期なので、待たずにリスナーを登録する。
    input.addEventListener('input', function(event) {
      const plainChar = event.target.value;

      if (plainChar === '') {
        currentMapping[char] = '';
      } else if (plainChar === '?') {
        currentMapping[char] = '?';
      } else {
        const upperChar = plainChar.toUpperCase();
        if (/^[A-Z]$/.test(upperChar)) {
          currentMapping[char] = upperChar;
        } else {
          event.target.value = currentMapping[char] || '';
          return;
        }
      }
      event.target.value = currentMapping[char];
      manualChars.add(char);
      checkDuplicates();
      updateCandidates();
      decodeText();
    });
  });
}

function getCandidates(cipherChar) {
  const candidates = FrequencyLogic.candidatesFor(cipherChar, currentMapping, confirmedPlainChars);
  return candidates.text + (candidates.remaining ? `（ほか${candidates.remaining}字）` : '');
}

function updateCandidates() {
  // 登場している暗号文文字のみを対象
  Object.keys(frequencyData).forEach(char => {
    const input = document.getElementById(`map_${char}`);
    if (input) {
      const row = input.closest('.mapping-row');
      if (row) {
        const candidatesElement = row.querySelector('.candidates');
        if (candidatesElement) {
          candidatesElement.textContent = getCandidates(char);
        }
      }
    }
  });
}

function checkDuplicates() {
  // 重複チェック（?と空文字は除外）
  const usedChars = {};
  const duplicates = new Set();

  Object.values(currentMapping).forEach(char => {
    if (char && char !== '?' && char !== '') {
      if (usedChars[char]) {
        duplicates.add(char);
      }
      usedChars[char] = true;
    }
  });

  // すべての入力フィールドをリセット
  document.querySelectorAll('.mapping-input').forEach(input => {
    input.classList.remove('duplicate');
    input.removeAttribute('aria-invalid');
  });

  // 重複している文字の入力フィールドを赤く表示
  Object.entries(currentMapping).forEach(([cipher, plain]) => {
    if (plain && duplicates.has(plain)) {
      document.getElementById(`map_${cipher}`).classList.add('duplicate');
      document.getElementById(`map_${cipher}`).setAttribute('aria-invalid', 'true');
    }
  });
  const message = document.getElementById('duplicateMessage');
  message.hidden = !duplicates.size;
  message.textContent = duplicates.size ? `重複している平文文字: ${[...duplicates].sort().join(', ')}` : '';
}

function decodeText() {
  const input = document.getElementById("cipherText").value;
  const decoded = FrequencyLogic.decodeWithMapping(input, currentMapping);

  // 変更箇所を特定してハイライト表示
  displayDecodedTextWithHighlight(decoded);

  // 前回の結果を保存
  previousDecoded = decoded;
}

function displayDecodedTextWithHighlight(newDecoded) {
  const decodedElement = document.getElementById("decodedText");

  // textareaの場合はプレーンテキストで表示
  decodedElement.value = newDecoded;

  // 変更があった場合の視覚的フィードバック（背景色の一時変更）
  if (newDecoded !== previousDecoded && previousDecoded !== '') {
    clearTimeout(highlightTimer);
    decodedElement.classList.add('is-highlighted');
    highlightTimer = setTimeout(() => {
      decodedElement.classList.remove('is-highlighted');
    }, 300);
  }
}

function drawFrequencyChart() {
  const svg = document.getElementById('frequencyChart');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // 最大値を取得（グラフのスケール調整用）
  const maxPercent = Math.max(1, Math.ceil(Math.max(
    ...analysis.rows.map(row => row.percent), ...Object.values(FrequencyLogic.ENGLISH_FREQ))));

  // SVG要素をクリア
  svg.replaceChildren();
  svg.dataset.yMax = String(maxPercent);
  if (!analysis.letterCount) return;
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = '観測％の棒と英語期待％のマーカー';
  svg.appendChild(title);

  const chartWidth = 380;
  const chartHeight = 160;
  const marginLeft = 40;
  const barWidth = chartWidth / 26;

  // Y軸（左側の線）
  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('class', 'axis-line');
  yAxis.setAttribute('x1', marginLeft);
  yAxis.setAttribute('y1', 10);
  yAxis.setAttribute('x2', marginLeft);
  yAxis.setAttribute('y2', chartHeight);
  svg.appendChild(yAxis);

  // X軸（下側の線）
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('class', 'axis-line');
  xAxis.setAttribute('x1', marginLeft);
  xAxis.setAttribute('y1', chartHeight);
  xAxis.setAttribute('x2', marginLeft + chartWidth);
  xAxis.setAttribute('y2', chartHeight);
  svg.appendChild(xAxis);
  for (const value of [0, maxPercent]) {
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    tick.setAttribute('class', 'axis-label');
    tick.setAttribute('x', 2);
    tick.setAttribute('y', chartHeight - value / maxPercent * (chartHeight - 20) + 4);
    tick.textContent = `${value}%`;
    svg.appendChild(tick);
  }

  // 各文字の棒グラフを描画
  alphabet.split('').forEach((char, index) => {
    const count = frequencyData[char] || 0;
    const percent = count / analysis.letterCount * 100;
    const barHeight = percent / maxPercent * (chartHeight - 20);
    const x = marginLeft + (index * barWidth) + 2;
    const y = chartHeight - barHeight;

    // 棒
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('class', 'bar');
    bar.setAttribute('x', x);
    bar.setAttribute('y', y);
    bar.setAttribute('width', barWidth - 4);
    bar.setAttribute('height', barHeight);
    const barTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    barTitle.textContent = `${char}: ${count}回、観測${percent.toFixed(2)}%／英語${FrequencyLogic.ENGLISH_FREQ[char]}%`;
    bar.appendChild(barTitle);
    svg.appendChild(bar);
    const expectedY = chartHeight - FrequencyLogic.ENGLISH_FREQ[char] / maxPercent * (chartHeight - 20);
    // 背景色の縁で、輝度の近い棒と期待値マーカーを分離する。
    for (const [className, width] of [['expected-underlay', 4], ['expected-marker', 2]]) {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      marker.setAttribute('class', className);
      marker.setAttribute('stroke-width', width);
      marker.setAttribute('x1', x - 1);
      marker.setAttribute('x2', x + barWidth - 3);
      marker.setAttribute('y1', expectedY);
      marker.setAttribute('y2', expectedY);
      svg.appendChild(marker);
    }

    // X軸ラベル（文字）
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('class', 'axis-label');
    label.setAttribute('x', x + (barWidth - 4) / 2);
    label.setAttribute('y', chartHeight + 15);
    label.setAttribute('text-anchor', 'middle');
    label.textContent = char;
    svg.appendChild(label);

    // 棒の上に数値を表示（数値が0より大きい場合のみ）
    if (count > 0) {
      const countLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      countLabel.setAttribute('class', 'axis-label');
      countLabel.setAttribute('x', x + (barWidth - 4) / 2);
      countLabel.setAttribute('y', y - 3);
      countLabel.setAttribute('text-anchor', 'middle');
      countLabel.setAttribute('font-size', '9px');
      countLabel.textContent = count;
      svg.appendChild(countLabel);
    }
  });
}

function displayNgrams(input) {
  for (const [id, rows, all] of [
    ['bigramResults', FrequencyLogic.ngramCounts(input, 2), false],
    ['trigramResults', FrequencyLogic.ngramCounts(input, 3), false],
    ['doubleResults', FrequencyLogic.doubledLetters(input), true]
  ]) {
    const visible = all ? rows : rows.filter(row => row.count >= 2).slice(0, 10);
    document.getElementById(id).textContent = visible.length
      ? visible.map(row => `${row.text} ${row.count}`).join('／')
      : all ? '連続同一文字はありません' : '2回以上出現するものはありません';
  }
}

function clearMapping() {
  currentMapping = {};
  manualChars.clear();
  previousDecoded = '';
  // システム推測を再適用
  generateSystemGuess();
  createMappingTable();
  checkDuplicates();
  decodeText();
}

async function copyResult() {
  const resultText = document.getElementById("decodedText").value;
  const button = document.getElementById('copyBtn');
  const message = document.getElementById('copyMessage');
  clearTimeout(copyTimer);
  button.classList.remove('copy-success', 'copy-error');
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(resultText);
    // 一時的にボタンのテキストを変更してフィードバック
    button.textContent = "✅ コピー完了!";
    button.classList.add('copy-success');
    message.textContent = '解読結果をコピーしました。';
  } catch {
    document.getElementById('decodedText').focus();
    document.getElementById('decodedText').select();
    button.classList.add('copy-error');
    message.textContent = '自動コピーが使えません。選択された解読結果を手動でコピーしてください。';
  }
  copyTimer = setTimeout(() => {
    button.textContent = '📋 コピー';
    button.classList.remove('copy-success', 'copy-error');
  }, 1000);
}

function clearResult() {
  document.getElementById("cipherText").value = '';
  document.getElementById("decodedText").value = '';
  document.getElementById("decodedText").placeholder = 'マッピングを設定すると解読結果が表示されます';
  frequencyData = {};
  currentMapping = {};
  systemGuess = {};
  previousDecoded = '';
  confirmedPlainChars = new Set();
  manualChars.clear();
  analysis = FrequencyLogic.analyzeText('');
  clearTimeout(highlightTimer);
  clearTimeout(copyTimer);
  document.getElementById('decodedText').classList.remove('is-highlighted');
  document.getElementById('copyBtn').classList.remove('copy-success', 'copy-error');
  document.getElementById('copyBtn').textContent = '📋 コピー';
  document.getElementById('copyMessage').textContent = '';

  // 警告メッセージを非表示
  document.getElementById("nonAlphaWarning").hidden = true;

  // 新しい要素を非表示
  for (const id of ['caseProcessingMessage', 'charStats', 'urlWarning', 'duplicateMessage']) {
    document.getElementById(id).hidden = true;
  }

  // 表示をクリア
  for (const id of ['frequencyResults', 'mappingTable', 'frequencyChart', 'bigramResults', 'trigramResults', 'doubleResults']) {
    document.getElementById(id).replaceChildren();
  }
}

function loadTextFromURL() {
  const result = FrequencyLogic.readTextParam(new URLSearchParams(window.location.search));
  const warning = document.getElementById('urlWarning');
  warning.hidden = !result.warning;
  warning.textContent = result.warning;
  if (result.text === null) return false;
  document.getElementById('cipherText').value = result.text;
  return true;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.getElementById('themeToggleBtn').setAttribute('aria-pressed', String(theme === 'dark'));
  document.getElementById('themeToggleBtn').textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initializeTheme() {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch { /* 保存不可でも画面は動かす。 */ }
  const initial = saved === null ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : saved === 'dark' ? 'dark' : 'light';
  applyTheme(initial);
  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('theme', theme); } catch { /* テーマ以外の値は保存しない。 */ }
  });
}

function initializeHelp() {
  const button = document.getElementById('helpBtn');
  const tooltip = document.getElementById('inputHelp');
  const setOpen = open => {
    button.setAttribute('aria-expanded', String(open));
    tooltip.hidden = !open;
  };
  // ポインター由来のfocusで先に開くとclickで即座に閉じるため区別する。
  let pointerFocus = false;
  button.addEventListener('pointerdown', () => { pointerFocus = true; });
  button.addEventListener('focus', () => { if (!pointerFocus) setOpen(true); });
  button.addEventListener('click', () => { setOpen(tooltip.hidden); pointerFocus = false; });
  button.addEventListener('blur', () => { setOpen(false); pointerFocus = false; });
  button.addEventListener('mouseenter', event => { if (event.sourceCapabilities?.firesTouchEvents !== true) setOpen(true); });
  button.addEventListener('mouseleave', () => { if (document.activeElement !== button) setOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  initializeHelp();
  // URLパラメータからテキストを読み込み、なければデフォルトのまま
  loadTextFromURL();

  // イベントリスナーの設定
  document.getElementById('analyzeBtn').addEventListener('click', analyze);
  document.getElementById('clearBtn').addEventListener('click', clearResult);
  document.getElementById('resetMappingBtn').addEventListener('click', clearMapping);
  document.getElementById('copyBtn').addEventListener('click', copyResult);

  // 解析実行
  analyze();
});
