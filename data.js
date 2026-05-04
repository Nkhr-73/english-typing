function convert() {
  const input = document.getElementById("csvInput").value.trim();
  const lines = input.split("\n");

  const result = lines
    .filter(line => line.trim())
    .map(line => {
      const [q, a] = line.split(",");
      return `  { q: ${JSON.stringify(q)}, a: ${JSON.stringify(a)}, correct: 0, wrong: 0 }`;
    });

  const jsCode = `const quizData = [\n${result.join(",\n")}\n];`;

  document.getElementById("output").textContent = jsCode;
}
