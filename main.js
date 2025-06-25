function analyze() {
  const input = document.getElementById("cipherText").value;
  const counts = {};
  const total = input.replace(/[^A-Za-z]/g, "").length;

  for (const char of input.toUpperCase()) {
    if (char.match(/[A-Z]/)) {
      counts[char] = (counts[char] || 0) + 1;
    }
  }

  const frequencies = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([char, count]) => {
      const percent = ((count / total) * 100).toFixed(2);
      const guess = guessPlaintextChar(char);
      return `${char}: ${count} (${percent}%) ⇒ likely: ${guess}`;
    });

  document.getElementById("results").innerText = frequencies.join("\n");
}

function guessPlaintextChar(cipherChar) {
  const englishFreq = "ETAOINSHRDLCUMWFGYPBVKJXQZ";
  const commonMap = {
    A: "E",
    B: "T",
    C: "A",
    D: "O",
    E: "I",
    F: "N",
    G: "S",
    H: "H",
    I: "R",
    J: "D",
    K: "L",
    L: "C",
    M: "U",
    N: "M",
    O: "W",
    P: "F",
    Q: "G",
    R: "Y",
    S: "P",
    T: "B",
    U: "V",
    V: "K",
    W: "J",
    X: "X",
    Y: "Q",
    Z: "Z"
  };
  return commonMap[cipherChar] || "?";
}
