<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>頻度分析ツール（Frequency Analyzer）</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>頻度分析ツール（Frequency Analyzer）</h1>
  
  <div style="background: #e7f3ff; padding: 12px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #007bff;">
    💡 <strong>暗号文作成：</strong> <a href="https://ipusiron.github.io/caesar-cipher-wheel/" target="_blank" style="color: #007bff; text-decoration: none;">Caesar Cipher Wheel Tool</a> で暗号文を作成できます。
  </div>
  
  <textarea id="cipherText" rows="6" placeholder="暗号文を入力してください">LW LV LPSRVVLEOH WR VDB KRZ ILUVW WKH LGHD HQWHUHG PB EUDLQ; EXW RQFH FRQFHLYHG, LW KDXQWHG PH GDB DQG QLJKW.</textarea>
  
  <div class="controls">
    <button onclick="analyze()">頻度分析</button>
    <button onclick="clearMapping()" class="clear-btn">マッピングクリア</button>
  </div>

  <div class="container">
    <div class="frequency-table">
      <h3>頻度表</h3>
      <div id="frequencyResults"></div>
      <div class="chart-container">
        <div class="chart-title">文字出現頻度グラフ</div>
        <svg id="frequencyChart" class="frequency-chart" viewBox="0 0 400 200">
          <!-- グラフがここに描画されます -->
        </svg>
      </div>
    </div>
    
    <div class="mapping-table">
      <h3>文字マッピング (A-Z)</h3>
      <div class="mapping-container">
        <div class="mapping-header">
          <span>暗号文文字</span>
          <span>システム推測</span>
          <span></span>
          <span>手動調整</span>
          <span>候補文字</span>
        </div>
        <div id="mappingTable"></div>
      </div>
    </div>
  </div>

  <div class="results">
    <h3>解読結果</h3>
    <div id="decodedText">マッピングを設定すると解読結果が表示されます</div>
    <div class="result-controls">
      <button onclick="copyResult()" class="copy-btn">📋 コピー</button>
      <button onclick="clearResult()" class="clear-btn">🗑️ クリア</button>
    </div>
  </div>

<div style="margin-top: 30px; padding: 15px; text-align: center; border-top: 1px solid var(--border-color); color: var(--text-color);">
	🔗 GitHubリポジトリはこちら（<a href="https://github.com/ipusiron/frequency-analyzer" target="_blank" style="color: var(--link-color); text-decoration: none;">ipusiron/frequency-analyzer</a>）
</div>

  <script src="main.js"></script>
</body>
</html>
