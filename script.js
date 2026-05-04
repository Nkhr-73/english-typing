let current = 0;

function showQuestion() {
  document.getElementById("question").textContent = quizData[current].q;
  document.getElementById("answer").textContent = quizData[current].a;
  document.getElementById("answer").classList.add("hidden");
}

function showAnswer() {
  document.getElementById("answer").classList.remove("hidden");
}

function nextQuestion() {
  current = (current + 1) % quizData.length;
  showQuestion();
}

showQuestion();
