// 日本語と英語のメッセージ。表示側のスクリプトは言語ごとの文字列を持たない。
const I18n = (() => {
  const ja = {
    'app.title': '頻度分析ツール（Frequency Analyzer）',
    'app.description': '英文の暗号文を英語標準頻度・一致指数・n-gramで分析し、単一換字式暗号の手動解読を支援するツール。',
    'app.langButton': 'English',
    'app.langAria': '言語を切り替える',
    'theme.toDark': 'ダークモードに切り替える',
    'theme.toLight': 'ライトモードに切り替える',
    'tool.makerLabel': '暗号文作成：',
    'tool.makerLink': 'Caesar Cipher Wheel Tool',
    'tool.makerSuffix': 'で暗号文を作成できます。',
    'input.label': '解読対象の暗号文を入力してください。',
    'input.placeholder': '暗号文を入力してください',
    'help.aria': '入力の説明',
    'help.tooltip': '大文字は暗号文文字、小文字は確定平文文字として扱います。記号・空白はそのまま出力されます。',
    'button.clear': '🗑️ クリア',
    'button.analyze': '📊 頻度分析',
    'button.reset': '🔄 リセット',
    'button.copy': '📋 コピー',
    'button.copyDone': '✅ コピー完了!',
    'warning.nonAlpha':
      'ℹ️ 入力には空白・記号・数字が含まれています。これらは頻度分析の対象外ですが、解読結果にはそのまま表示されます。',
    'info.caseProcessing': '大文字を暗号文文字、小文字を平文文字として扱いました。',
    'stats.analysis': '英字{letters}字・異なり{unique}文字・語数{words}',
    'stats.ic': 'IC {value}：{verdict}',
    'stats.reliability': '英字30字未満の短文のため信頼性が低い目安です。',
    'stats.confirmed':
      '暗号文文字の種類: {cipherCount}種 ({cipherList})、確定平文文字の種類: {plainCount}種 ({plainList})',
    'ic.unavailable': '算出不可（英字2字未満）',
    'ic.plainLike': '英語平文に近い（単一換字や転置の可能性）',
    'ic.undecided': '判定保留',
    'ic.flat': '均等分布に近い（多表式の可能性）',
    'freq.heading': '頻度表',
    'freq.row': '{char}: {count}（{percent}%／英語 {expected}%／差 {diff}）',
    'freq.none': '英字（A-Z）が含まれていません',
    'chart.heading': '文字出現頻度グラフ（％）',
    'chart.legendObserved': '観測％（棒）',
    'chart.legendExpected': '英語の期待％（横線）',
    'chart.svgAria': '観測頻度と英語標準頻度の比較',
    'chart.svgTitle': '観測％の棒と英語期待％のマーカー',
    'chart.barTitle': '{char}: {count}回、観測{percent}%／英語{expected}%',
    'ngram.heading': '二重字・三重字',
    'ngram.note': '語の内側で2回以上のものだけ／上位10件',
    'ngram.bigramLabel': '二重字：',
    'ngram.trigramLabel': '三重字：',
    'ngram.none': '2回以上出現するものはありません',
    'double.heading': '連続同一文字',
    'double.note': '1回でも全件表示',
    'double.none': '連続同一文字はありません',
    'list.separator': '／',
    'mapping.heading': '文字マッピング',
    'mapping.note': '頻度順位を機械的に対応付けた出発点です。そのままで正解になるとは限りません。',
    'mapping.colCipher': '暗号文文字',
    'mapping.colGuess': 'システム推測',
    'mapping.colManual': '手動調整',
    'mapping.colCandidates': '候補文字',
    'mapping.inputAria': '暗号文文字{char}に対応する平文文字',
    'mapping.moreCandidates': '（ほか{count}字）',
    'mapping.duplicate': '重複している平文文字: {letters}',
    'results.heading': '解読結果',
    'results.decodedAria': '解読結果',
    'results.placeholder': 'マッピングを設定すると解読結果が表示されます',
    'copy.success': '解読結果をコピーしました。',
    'copy.failure': '自動コピーが使えません。選択された解読結果を手動でコピーしてください。',
    'url.tooLong': 'URLのテキストが5,000文字を超えるため読み込みませんでした。',
    'footer.repo': '🔗 GitHubリポジトリはこちら（',
    'footer.repoEnd': '）'
  };

  const en = {
    'app.title': 'Frequency Analyzer',
    'app.description':
      'Frequency analysis for English ciphertext: letter counts, index of coincidence and n-grams for breaking '
      + 'monoalphabetic substitution ciphers by hand.',
    'app.langButton': '日本語',
    'app.langAria': 'Switch language',
    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',
    'tool.makerLabel': 'Need a ciphertext? ',
    'tool.makerLink': 'Caesar Cipher Wheel Tool',
    'tool.makerSuffix': ' can build one for you.',
    'input.label': 'Enter the ciphertext you want to break.',
    'input.placeholder': 'Enter a ciphertext',
    'help.aria': 'About the input',
    'help.tooltip':
      'Uppercase letters are ciphertext letters; lowercase letters are plaintext you have already confirmed. '
      + 'Punctuation and spaces pass through unchanged.',
    'button.clear': '🗑️ Clear',
    'button.analyze': '📊 Analyze',
    'button.reset': '🔄 Reset',
    'button.copy': '📋 Copy',
    'button.copyDone': '✅ Copied!',
    'warning.nonAlpha':
      'ℹ️ The input contains spaces, punctuation or digits. They are left out of the frequency counts, '
      + 'but they still appear in the decrypted output.',
    'info.caseProcessing': 'Uppercase letters were read as ciphertext, lowercase letters as plaintext.',
    'stats.analysis': '{letters} letters · {unique} distinct · {words} words',
    // 値が無いときは{value}が「—」になる。区切りにダッシュを使うと二重になる。
    'stats.ic': 'IC {value}: {verdict}',
    'stats.reliability': 'Fewer than 30 letters, so the index of coincidence is only a rough hint.',
    'stats.confirmed':
      'Ciphertext letters: {cipherCount} kinds ({cipherList}); confirmed plaintext letters: '
      + '{plainCount} kinds ({plainList})',
    'ic.unavailable': 'Not available (fewer than 2 letters)',
    'ic.plainLike': 'Close to English plaintext (monoalphabetic substitution or transposition)',
    'ic.undecided': 'Inconclusive',
    'ic.flat': 'Close to a flat distribution (polyalphabetic cipher)',
    'freq.heading': 'Letter frequencies',
    'freq.row': '{char}: {count} (observed {percent}%, English {expected}%, diff {diff})',
    'freq.none': 'No letters (A-Z) in the input',
    'chart.heading': 'Letter frequency chart (%)',
    'chart.legendObserved': 'Observed % (bars)',
    'chart.legendExpected': 'Expected English % (rules)',
    'chart.svgAria': 'Observed letter frequencies compared with standard English frequencies',
    'chart.svgTitle': 'Bars show the observed %, rules show the expected English %',
    'chart.barTitle': '{char}: {count} times, observed {percent}%, English {expected}%',
    'ngram.heading': 'Bigrams and trigrams',
    'ngram.note': 'Inside words only, 2 or more occurrences, top 10',
    'ngram.bigramLabel': 'Bigrams: ',
    'ngram.trigramLabel': 'Trigrams: ',
    'ngram.none': 'Nothing occurs twice or more',
    'double.heading': 'Doubled letters',
    'double.note': 'Every occurrence, even a single one',
    'double.none': 'No doubled letters',
    'list.separator': ' / ',
    'mapping.heading': 'Letter mapping',
    'mapping.note':
      'This is a starting point produced by matching frequency ranks. It is not guaranteed to be correct.',
    'mapping.colCipher': 'Ciphertext',
    'mapping.colGuess': 'Auto guess',
    'mapping.colManual': 'Manual',
    'mapping.colCandidates': 'Candidates',
    'mapping.inputAria': 'Plaintext letter for ciphertext letter {char}',
    'mapping.moreCandidates': ' (+{count} more)',
    'mapping.duplicate': 'Duplicate plaintext letters: {letters}',
    'results.heading': 'Decrypted text',
    'results.decodedAria': 'Decrypted text',
    'results.placeholder': 'Set the mapping and the decrypted text appears here',
    'copy.success': 'Copied the decrypted text.',
    'copy.failure': 'Automatic copy is unavailable. The decrypted text is selected, so copy it by hand.',
    'url.tooLong': 'The text in the URL is longer than 5,000 characters, so it was not loaded.',
    'footer.repo': '🔗 GitHub repository: ',
    'footer.repoEnd': ''
  };

  let language = 'ja';
  const STORAGE_KEY = 'frequency-analyzer-language';

  function t(key, values = {}) {
    const dict = language === 'en' ? en : ja;
    const message = dict[key];
    if (typeof message !== 'string') throw new Error('Unknown message: ' + key);
    return message.replace(/\{(\w+)\}/g, (whole, name) =>
      (Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : whole));
  }

  function apply(root = document) {
    document.documentElement.lang = language;
    document.title = t('app.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('app.description'));
    root.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.getAttribute('data-i18n'));
    });
    for (const attr of ['aria-label', 'title', 'placeholder']) {
      root.querySelectorAll(`[data-i18n-${attr}]`).forEach(element =>
        element.setAttribute(attr, t(element.getAttribute(`data-i18n-${attr}`))));
    }
  }

  function setLanguage(value) {
    if (value !== 'ja' && value !== 'en') return;
    language = value;
    try { localStorage.setItem(STORAGE_KEY, value); } catch { /* 保存できない環境でも画面は動かす。 */ }
    apply();
    document.dispatchEvent(new Event('languagechange'));
  }

  function init() {
    let saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* 保存値が読めない環境では既定に従う。 */ }
    const query = new URLSearchParams(location.search).get('lang');
    language = [query, saved].find(value => value === 'ja' || value === 'en')
      || (/^ja\b/i.test(navigator.language || '') ? 'ja' : 'en');
    apply();
  }

  return { ja, en, t, apply, init, setLanguage, get language() { return language; } };
})();

if (typeof window !== 'undefined') window.I18n = I18n;
if (typeof module !== 'undefined' && module.exports) module.exports = I18n;
