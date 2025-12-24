let frequencyData = {};
let currentMapping = {};
let systemGuess = {};
let previousDecoded = '';
let confirmedPlainChars = new Set(); // 確定平文文字（小文字で入力された文字）

function analyze() {
  const input = document.getElementById("cipherText").value;

  // 大文字のみを抽出（暗号文文字）
  const cipherCharsOnly = input.replace(/[^A-Z]/g, '');
  // 小文字のみを抽出（平文文字）
  const plainCharsOnly = input.replace(/[^a-z]/g, '');

  // マッピングをリセット（新しい暗号文の分析時）
  currentMapping = {};

  // 非英字文字が含まれているかチェック
  const hasNonAlpha = /[^A-Za-z]/.test(input);
  document.getElementById("nonAlphaWarning").style.display = hasNonAlpha ? "block" : "none";

  // 確定平文文字を更新（小文字を大文字に変換してセットに格納）
  confirmedPlainChars = new Set([...plainCharsOnly].map(c => c.toUpperCase()));

  // 小文字（平文）が含まれる場合のUI表示
  const hasLowercase = plainCharsOnly.length > 0;
  if (hasLowercase) {
    document.getElementById("caseProcessingMessage").style.display = "block";
    document.getElementById("charStats").style.display = "block";

    // 統計情報の更新
    const uniqueCipherChars = [...new Set(cipherCharsOnly)].sort();
    const uniquePlainChars = [...new Set(plainCharsOnly)].sort();
    document.getElementById("cipherCharCount").textContent = uniqueCipherChars.length;
    document.getElementById("cipherCharList").textContent = uniqueCipherChars.join('');
    document.getElementById("plainCharCount").textContent = uniquePlainChars.length;
    document.getElementById("plainCharList").textContent = uniquePlainChars.join('');
  } else {
    document.getElementById("caseProcessingMessage").style.display = "none";
    document.getElementById("charStats").style.display = "none";
  }

  // 頻度カウント（大文字のみ対象）
  const counts = {};
  for (const char of cipherCharsOnly) {
    counts[char] = (counts[char] || 0) + 1;
  }

  const total = cipherCharsOnly.length;
  frequencyData = counts;

  // 頻度表の表示
  const freqLines = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([char, count]) => {
      const percent = ((count / total) * 100).toFixed(2);
      return `${char}: ${count} (${percent}%)`;
    });

  const frequencyResults = document.getElementById("frequencyResults");
  frequencyResults.innerHTML = '';
  freqLines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'frequency-item';
    div.textContent = line;
    frequencyResults.appendChild(div);
  });

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
  const sortedByFreq = Object.entries(frequencyData)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  // ETAOIN順から確定平文文字を除外
  const englishFreq = "ETAOINSHRDLCUMWFGYPBVKJXQZ".split("")
    .filter(c => !confirmedPlainChars.has(c));

  systemGuess = {};
  // 登場している文字のみにシステム推測を設定
  sortedByFreq.forEach((cipherChar, i) => {
    systemGuess[cipherChar] = englishFreq[i] || '?';
  });

  // 現在の暗号文に存在しない文字のマッピングを削除
  Object.keys(currentMapping).forEach(char => {
    if (!frequencyData[char]) {
      delete currentMapping[char];
    }
  });

  // 現在のマッピングにシステム推測をデフォルト設定（登場している文字のみ）
  sortedByFreq.forEach(char => {
    if (!currentMapping.hasOwnProperty(char)) {
      currentMapping[char] = systemGuess[char] || '';
    }
  });
}

function createMappingTable() {
  // 登場している暗号文文字のみを対象（頻度順でソート）
  const cipherChars = Object.entries(frequencyData)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const mappingHtml = cipherChars.map(char => {
    const count = frequencyData[char] || 0;
    const countText = ` (${count})`;
    const guess = systemGuess[char] || '';
    const candidates = getCandidates(char);

    const systemGuessHtml = `<div class="system-guess">${guess}</div>`;

    return `
      <div class="mapping-row">
        <div class="cipher-char">${char}${countText}</div>
        <div class="system-guess-container">${systemGuessHtml}</div>
        <div class="arrow">→</div>
        <div class="mapping-input-container">
          <input type="text"
                 class="mapping-input"
                 id="map_${char}"
                 maxlength="1"
                 value="${currentMapping[char] || ''}"
                 placeholder="">
        </div>
        <div class="candidates">${candidates}</div>
      </div>
    `;
  }).join('');

  document.getElementById("mappingTable").innerHTML = mappingHtml;

  // イベントリスナーを追加
  setTimeout(() => {
    cipherChars.forEach(char => {
      const input = document.getElementById(`map_${char}`);
      if (input) {
        input.addEventListener('input', function(event) {
          const plainChar = event.target.value;

          if (plainChar === '') {
            currentMapping[char] = '';
          } else if (plainChar === '?') {
            currentMapping[char] = '?';
          } else {
            const upperChar = plainChar.toUpperCase();
            if (upperChar.match(/[A-Z]/)) {
              currentMapping[char] = upperChar;
            } else {
              event.target.value = currentMapping[char] || '';
              return;
            }
          }

          checkDuplicates();
          updateCandidates();
          decodeText();
        });
      }
    });
  }, 10);
}

function getCandidates(cipherChar) {
  const currentValue = currentMapping[cipherChar];

  // 手動調整が入力されている場合は候補を表示しない
  if (currentValue && currentValue !== '' && currentValue !== '?') {
    return '';
  }

  // 使用済み文字を取得
  const usedChars = new Set();
  Object.values(currentMapping).forEach(char => {
    if (char && char !== '?' && char !== '') {
      usedChars.add(char);
    }
  });

  // 未使用の文字を取得（確定平文文字も除外）
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const available = alphabet.split('').filter(char =>
    !usedChars.has(char) && !confirmedPlainChars.has(char)
  );

  if (available.length === 0) {
    return '';
  }

  // 文字のみを8文字まで表示
  const candidates = available.slice(0, 8).join(' ');
  return candidates + (available.length > 8 ? '...' : '');
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
  });

  // 重複している文字の入力フィールドを赤く表示
  Object.entries(currentMapping).forEach(([cipher, plain]) => {
    if (plain && duplicates.has(plain)) {
      document.getElementById(`map_${cipher}`).classList.add('duplicate');
    }
  });
}

function decodeText() {
  const input = document.getElementById("cipherText").value;
  let decoded = '';

  for (const c of input) {
    if (c >= 'A' && c <= 'Z') {
      // 大文字 = 暗号文文字 → マッピングで変換
      const mapped = currentMapping[c];
      if (!mapped || mapped === '') {
        // 未設定は大文字のまま表示
        decoded += c;
      } else if (mapped === '?') {
        decoded += '?';
      } else {
        // 解読済みは小文字で出力
        decoded += mapped.toLowerCase();
      }
    } else if (c >= 'a' && c <= 'z') {
      // 小文字 = 平文文字 → そのまま出力
      decoded += c;
    } else {
      // 記号・空白 → そのまま出力
      decoded += c;
    }
  }

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
    decodedElement.style.backgroundColor = '#fff3cd';
    setTimeout(() => {
      decodedElement.style.backgroundColor = '#f8f9fa';
    }, 300);
  }
}

function drawFrequencyChart() {
  const svg = document.getElementById('frequencyChart');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // 最大値を取得（グラフのスケール調整用）
  const maxCount = Math.max(...Object.values(frequencyData), 1);
  
  // SVG要素をクリア
  svg.innerHTML = '';
  
  const chartWidth = 380;
  const chartHeight = 160;
  const marginLeft = 20;
  const marginBottom = 30;
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
  
  // 各文字の棒グラフを描画
  alphabet.split('').forEach((char, index) => {
    const count = frequencyData[char] || 0;
    const barHeight = maxCount > 0 ? (count / maxCount) * (chartHeight - 20) : 0;
    const x = marginLeft + (index * barWidth) + 2;
    const y = chartHeight - barHeight;
    
    // 棒
    const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bar.setAttribute('class', 'bar');
    bar.setAttribute('x', x);
    bar.setAttribute('y', y);
    bar.setAttribute('width', barWidth - 4);
    bar.setAttribute('height', barHeight);
    bar.setAttribute('title', `${char}: ${count}`);
    svg.appendChild(bar);
    
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

function clearMapping() {
  currentMapping = {};
  previousDecoded = '';
  // システム推測を再適用
  generateSystemGuess();
  createMappingTable();
  decodeText();
}

function copyResult() {
  const resultText = document.getElementById("decodedText").value;
  navigator.clipboard.writeText(resultText).then(() => {
    // 一時的にボタンのテキストを変更してフィードバック
    const button = document.querySelector('.copy-btn');
    const originalText = button.textContent;
    button.textContent = "✅ コピー完了!";
    button.style.background = "#20c997";
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "#28a745";
    }, 1000);
  }).catch(err => {
    alert('コピーに失敗しました: ' + err);
  });
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

  // 警告メッセージを非表示
  document.getElementById("nonAlphaWarning").style.display = "none";

  // 新しい要素を非表示
  document.getElementById("caseProcessingMessage").style.display = "none";
  document.getElementById("charStats").style.display = "none";

  // 表示をクリア
  document.getElementById("frequencyResults").innerHTML = '';
  document.getElementById("mappingTable").innerHTML = '';
  document.getElementById('frequencyChart').innerHTML = '';
}

function loadTextFromURL() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const textParam = urlParams.get('text');
    
    if (textParam) {
      // URLデコード
      const decodedText = decodeURIComponent(textParam);
      
      // 文字数制限チェック（5,000文字）
      if (decodedText.length > 5000) {
        console.warn('Text parameter exceeds 5,000 character limit');
        return false;
      }
      
      // 入力欄にセット
      const textArea = document.getElementById("cipherText");
      textArea.value = decodedText;
      
      return true;
    }
  } catch (error) {
    console.error('Error processing URL text parameter:', error);
  }
  
  return false;
}

// 初期化
window.onload = function() {
  // URLパラメータからテキストを読み込み、なければデフォルトのまま
  loadTextFromURL();

  // イベントリスナーの設定
  document.getElementById('analyzeBtn').addEventListener('click', analyze);
  document.getElementById('clearBtn').addEventListener('click', clearResult);
  document.getElementById('resetMappingBtn').addEventListener('click', clearMapping);
  document.getElementById('copyBtn').addEventListener('click', copyResult);

  // 解析実行
  analyze();
};
