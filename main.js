let frequencyData = {};
let currentMapping = {};
let systemGuess = {};

function analyze() {
  const input = document.getElementById("cipherText").value;
  const sanitized = input.toUpperCase().replace(/[^A-Z]/g, '');

  const counts = {};
  for (const char of sanitized) {
    counts[char] = (counts[char] || 0) + 1;
  }

  const total = sanitized.length;
  frequencyData = counts;

  // 頻度表の表示
  const freqLines = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([char, count]) => {
      const percent = ((count / total) * 100).toFixed(2);
      return `${char}: ${count} (${percent}%)`;
    });

  document.getElementById("frequencyResults").innerHTML = 
    freqLines.map(line => `<div class="frequency-item">${line}</div>`).join('');

  // システム推測の生成
  generateSystemGuess();
  
  // マッピングテーブルの作成
  createMappingTable();
  
  // 棒グラフの描画
  drawFrequencyChart();
  
  // 初回分析時に復号を実行
  decodeText();
}

function generateSystemGuess() {
  const sortedByFreq = Object.entries(frequencyData)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const englishFreq = "ETAOINSHRDLCUMWFGYPBVKJXQZ".split("");

  systemGuess = {};
  // 登場している文字のみにシステム推測を設定
  sortedByFreq.forEach((cipherChar, i) => {
    systemGuess[cipherChar] = englishFreq[i] || '?';
  });

  // 現在のマッピングにシステム推測をデフォルト設定（登場している文字のみ）
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  alphabet.split('').forEach(char => {
    if (frequencyData[char] && !currentMapping.hasOwnProperty(char)) {
      currentMapping[char] = systemGuess[char] || '';
    }
  });
}

function createMappingTable() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const mappingHtml = alphabet.split('').map(char => {
    const isPresent = frequencyData[char];
    const count = frequencyData[char] || 0;
    const countText = count > 0 ? ` (${count})` : '';
    const opacity = isPresent ? '' : ' style="opacity: 0.3;"';
    const guess = systemGuess[char] || '';
    const candidates = getCandidates(char);
    
    // システム推測欄の表示を決定
    let systemGuessHtml;
    if (guess) {
      // 登場している文字：推測文字を表示
      systemGuessHtml = `<div class="system-guess">${guess}</div>`;
    } else {
      // 登場していない文字：空のdiv（半角スペース）
      systemGuessHtml = `<div class="system-guess"> </div>`;
    }
    
    return `
      <div class="mapping-row"${opacity}>
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
    alphabet.split('').forEach(char => {
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
  
  // 未使用の文字を取得
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const available = alphabet.split('').filter(char => !usedChars.has(char));
  
  if (available.length === 0) {
    return '';
  }
  
  // 文字のみを8文字まで表示
  const candidates = available.slice(0, 8).join(' ');
  return candidates + (available.length > 8 ? '...' : '');
}

function updateCandidates() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  alphabet.split('').forEach(char => {
    const row = document.querySelector(`#map_${char}`).closest('.mapping-row');
    if (row) {
      const candidatesElement = row.querySelector('.candidates');
      if (candidatesElement) {
        candidatesElement.textContent = getCandidates(char);
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
    const upper = c.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const mapped = currentMapping[upper];
      if (mapped === '') {
        decoded += '*'; // 未入力
      } else if (mapped === '?') {
        decoded += '?'; // ?入力
      } else if (mapped) {
        // 元の大文字小文字を保持
        decoded += (c === c.toLowerCase()) ? mapped.toLowerCase() : mapped;
      } else {
        decoded += '*'; // マッピングがない場合
      }
    } else {
      decoded += c;
    }
  }

  const decodedElement = document.getElementById("decodedText");
  decodedElement.textContent = decoded;
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
  // システム推測を再適用
  generateSystemGuess();
  createMappingTable();
  decodeText();
}

function copyResult() {
  const resultText = document.getElementById("decodedText").textContent;
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
  document.getElementById("decodedText").textContent = 'マッピングを設定すると解読結果が表示されます';
  frequencyData = {};
  currentMapping = {};
  systemGuess = {};
  
  // 表示をクリア
  document.getElementById("frequencyResults").innerHTML = '';
  document.getElementById("mappingTable").innerHTML = '';
  document.getElementById('frequencyChart').innerHTML = '';
}

// 初期化
window.onload = function() {
  analyze();
};
