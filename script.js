let current = 0;
let wrongList = [];
let reviewMode = false;
let currentData = quizData;

function showQuestion() {
  const q = currentData[current];
  document.getElementById("question").textContent = q.q;
  document.getElementById("answer").textContent = q.a;
  document.getElementById("answer").classList.add("hidden");
}

function showAnswer() {
  document.getElementById("answer").classList.remove("hidden");
}

function nextQuestion() {
  current++;
  if (current >= currentData.length) {
    alert("終了！");
    current = 0;
  }
  showQuestion();
}

function markWrong() {
  wrongList.push(currentData[current]);
  nextQuestion();
}

function startReview() {
  if (wrongList.length === 0) {
    alert("ミスなし！天才か？");
    return;
  }
  reviewMode = true;
  currentData = wrongList;
  current = 0;
  showQuestion();
}

showQuestion();
