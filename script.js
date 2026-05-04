let current = 0;
let wrongList = [];
let currentData = quizData;

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
  current++;
  if (current >= currentData.length) {
    alert("終了！");
    current = 0;
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
