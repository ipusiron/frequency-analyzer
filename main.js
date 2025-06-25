function analyze() {
  const input = document.getElementById("cipherText").value;
  const sanitized = input.toUpperCase().replace(/[^A-Z]/g, '');

  const counts = {};
  for (const char of sanitized) {
    counts[char] = (counts[char] || 0) + 1;
  }

  const total = sanitized.length;

  const sortedByFreq = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const englishFreq = "ETAOINSHRDLCUMWFGYPBVKJXQZ".split("");

  // 文字対応の推測マッピングを作成
  const guessMap = {};
  sortedByFreq.forEach((cipherChar, i) => {
    guessMap[cipherChar] = englishFreq[i] || '?';
  });

  // 推測マッピングによる平文生成
  let decoded = '';
  for (const c of input) {
    const upper = c.toUpperCase();
    if (upper >= 'A' && upper <= 'Z') {
      const guessed = guessMap[upper] || '?';
      // 元の大文字小文字を保持
      decoded += (c === c.toLowerCase()) ? guessed.toLowerCase() : guessed;
    } else {
      decoded += c;
    }
  }

  // 出力表示
  const freqLines = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([char, count], idx) => {
      const percent = ((count / total) * 100).toFixed(2);
      const guess = guessMap[char] || '?';
      return `${char}: ${count} (${percent}%) ⇒ likely: ${guess}`;
    });

  const output = `
[Frequency Table]
${freqLines.join("\n")}

[Guessed Plaintext]
${decoded}
  `.trim();

  document.getElementById("results").innerText = output;
}
