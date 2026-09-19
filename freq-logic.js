(() => {
  // 英語文字頻度（％）。合計99.999をそのまま使用する。
  const ENGLISH_FREQ = Object.freeze({
    A: 8.167, B: 1.492, C: 2.782, D: 4.253, E: 12.702, F: 2.228, G: 2.015,
    H: 6.094, I: 6.966, J: 0.153, K: 0.772, L: 4.025, M: 2.406, N: 6.749,
    O: 7.507, P: 1.929, Q: 0.095, R: 5.987, S: 6.327, T: 9.056, U: 2.758,
    V: 0.978, W: 2.360, X: 0.150, Y: 1.974, Z: 0.074
  });

  // 現行の順位対応付けを維持する。数値頻度による候補順とは区別する。
  const ETAOIN_ORDER = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';

  function wordsOf(text) {
    // 小文字は確定平文なので集計せず、n-gramの区切りとして扱う。
    return text.match(/[A-Z]+/g) || [];
  }

  function analyzeText(input) {
    const counts = new Map();
    const letters = input.match(/[A-Z]/g) || [];
    for (const char of letters) counts.set(char, (counts.get(char) || 0) + 1);
    const rows = [...counts].sort((a, b) => b[1] - a[1]).map(([char, count]) => {
      const percent = count / letters.length * 100;
      const expected = ENGLISH_FREQ[char];
      return { char, count, percent, expected, diff: percent - expected };
    });
    return { letterCount: letters.length, uniqueCount: counts.size, totalLength: input.length, rows };
  }

  function indexOfCoincidence(text) {
    const { letterCount: n, rows } = analyzeText(text);
    if (n < 2) return null;
    return rows.reduce((sum, row) => sum + row.count * (row.count - 1), 0) / (n * (n - 1));
  }

  function classifyIC(ic) {
    if (ic === null || !Number.isFinite(ic)) return '算出不可（英字2字未満）';
    if (ic >= 0.060) return '英語平文に近い（単一換字や転置の可能性）';
    if (ic >= 0.045) return '判定保留';
    return '均等分布に近い（多表式の可能性）';
  }

  function isICReliable(text) {
    return (text.match(/[A-Z]/g) || []).length >= 30;
  }

  function ngramCounts(text, n) {
    if (!Number.isInteger(n) || n < 1) return [];
    const counts = new Map();
    for (const word of wordsOf(text)) {
      for (let index = 0; index + n <= word.length; index++) {
        const gram = word.slice(index, index + n);
        counts.set(gram, (counts.get(gram) || 0) + 1);
      }
    }
    return [...counts].map(([text, count]) => ({ text, count })).sort((a, b) =>
      b.count - a.count || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
  }

  function doubledLetters(text) {
    return ngramCounts(text, 2).filter(row => row.text[0] === row.text[1]);
  }

  function systemGuess(rows, confirmedPlainChars = new Set()) {
    const englishFreq = [...ETAOIN_ORDER].filter(char => !confirmedPlainChars.has(char));
    return Object.fromEntries(rows.map((row, index) => [row.char, englishFreq[index] || '?']));
  }

  function candidatesFor(cipherChar, mapping, confirmedPlainChars = new Set()) {
    // 他行と現在値の両方を除外する。値が空でも候補を返す。
    const used = new Set([...confirmedPlainChars, ...Object.entries(mapping)
      .filter(([char]) => char !== cipherChar).map(([, value]) => value)]);
    used.add(mapping[cipherChar]);
    const available = Object.keys(ENGLISH_FREQ).filter(char => !used.has(char)).sort((a, b) =>
      ENGLISH_FREQ[b] - ENGLISH_FREQ[a] || (a < b ? -1 : a > b ? 1 : 0));
    const letters = available.slice(0, 8);
    const remaining = Math.max(0, available.length - letters.length);
    return { letters, remaining, text: letters.join(' ') + (remaining ? '…' : '') };
  }

  function mergeMapping(rows, mapping, manualChars, guesses) {
    // 登場しなくなった文字は返さない。空欄・?も手動編集として保持する。
    return Object.fromEntries(rows.map(({ char }) => [char,
      manualChars.has(char) && Object.hasOwn(mapping, char) ? mapping[char] : (guesses[char] || '')]));
  }

  function decodeWithMapping(input, mapping) {
    let decoded = '';
    for (const char of input) {
      if (char >= 'A' && char <= 'Z' && Object.hasOwn(mapping, char) && mapping[char]) {
        decoded += mapping[char] === '?' ? '?' : mapping[char].toLowerCase();
      } else {
        // 未設定の大文字、小文字、記号・空白、日本語・絵文字は保持する。
        decoded += char;
      }
    }
    return decoded;
  }

  function readTextParam(params) {
    const text = params.get('text'); // URLSearchParamsですでにデコードされている。
    if (text === null) return { text: null, warning: '' };
    if (text.length > 5000) return { text: null, warning: 'URLのテキストが5,000文字を超えるため読み込みませんでした。' };
    return { text, warning: '' };
  }

  globalThis.FrequencyLogic = {
    ENGLISH_FREQ, ETAOIN_ORDER, analyzeText, indexOfCoincidence, classifyIC, isICReliable,
    ngramCounts, doubledLetters, wordsOf, systemGuess, candidatesFor, decodeWithMapping, mergeMapping, readTextParam
  };
  if (typeof module === 'object' && module.exports) module.exports = FrequencyLogic;
})();
