document.addEventListener("keydown", (e) => {

  // 入力欄にフォーカスあるときは無効
  if (e.target.tagName === "INPUT") return;

  switch (e.key) {

    case "f":
      showAnswer();
      break;

    case "h":
      markWrong();
      break;

    case "g":
      markCorrect();
      break;

    case "j":
      nextQuestion();
      break;
  }
});

let current = 0;
let wrongList = [];
let currentData = quizData;

let isRandom = false;

function toggleRandom() {
  isRandom = !isRandom;

  const btn = document.querySelector("button[onclick='toggleRandom()']");
  btn.textContent = isRandom ? "ランダムON" : "ランダムOFF";

  if (isRandom) {
    shuffleArray(currentData);
  }

  current = 0;
  showQuestion();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ----------------------
// 表示
// ----------------------
function showQuestion() {
  const q = currentData[current];

  document.getElementById("question").textContent = q.q;
  document.getElementById("answer").textContent = q.a;
  document.getElementById("answer").classList.add("hidden");

  document.getElementById("stats").textContent =
    `⭕ ${q.correct || 0}回 / ❌ ${q.wrong || 0}回`;
}

// ----------------------
// ボタン処理
// ----------------------
function showAnswer() {
  document.getElementById("answer").classList.remove("hidden");
}

function markCorrect() {
  currentData[current].correct = (currentData[current].correct || 0) + 1;
  saveAll();
  nextQuestion();
}

function markWrong() {
  currentData[current].wrong = (currentData[current].wrong || 0) + 1;
  wrongList.push(currentData[current]);
  saveAll();
  nextQuestion();
}

function nextQuestion() {

  if (isRandom) {
    current = Math.floor(Math.random() * currentData.length);
  } else {
    current++;
    if (current >= currentData.length) {
      alert("終了！");
      current = 0;
    }
  }

  saveAll();
  showQuestion();
}

// ----------------------
// 復習モード
// ----------------------
function startReview() {
  if (wrongList.length === 0) {
    alert("ミスなし！強すぎ笑");
    return;
  }

  currentData = wrongList;
  current = 0;
  showQuestion();
}

// ----------------------
// 保存処理
// ----------------------
function saveAll() {
  localStorage.setItem("quizData", JSON.stringify(quizData));
  localStorage.setItem("wrongList", JSON.stringify(wrongList));
  localStorage.setItem("current", current);
}

// ----------------------
// 読み込み
// ----------------------
function loadAll() {
  const savedQuiz = localStorage.getItem("quizData");
  const savedWrong = localStorage.getItem("wrongList");
  const savedCurrent = localStorage.getItem("current");

  if (savedQuiz) {
    const parsed = JSON.parse(savedQuiz);
    for (let i = 0; i < quizData.length; i++) {
      quizData[i].correct = parsed[i]?.correct || 0;
      quizData[i].wrong = parsed[i]?.wrong || 0;
    }
  }

  if (savedWrong) {
    wrongList = JSON.parse(savedWrong);
  }

  if (savedCurrent) {
    current = parseInt(savedCurrent);
  }
}

// ----------------------
// リセット
// ----------------------
function resetData() {
  localStorage.clear();
  wrongList = [];
  current = 0;
  alert("リセット完了");
  showQuestion();
}

// ----------------------
// 初期化
// ----------------------
loadAll();
showQuestion();

//-----------------------データ入力-------------

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
