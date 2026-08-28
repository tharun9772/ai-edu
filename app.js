const views = { home: 'Overview', calculator: 'Math lab', quiz: 'Practice room', game: 'Blox sprint' };
const els = (id) => document.getElementById(id);
const profileKey = 'bloxEducationProfile';
const todayKey = new Date().toISOString().slice(0, 10);
let profile = JSON.parse(localStorage.getItem(profileKey) || 'null') || { name: '', theme: 'light', session: 0, solved: 0, solvedToday: 0, minutes: 0, minutesToday: 0, lastDate: todayKey, startedAt: Date.now() };
if (profile.lastDate !== todayKey) { profile.solvedToday = 0; profile.minutesToday = 0; profile.lastDate = todayKey; }
profile.session += 1;
profile.startedAt = Date.now();
const saveProfile = () => localStorage.setItem(profileKey, JSON.stringify(profile));
const formatDate = () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
function applyTheme() { document.body.classList.toggle('dark-theme', profile.theme === 'dark'); }
function updateDashboard() {
  const weeklyGoal = 300;
  const progress = Math.min(100, Math.round((profile.minutes / weeklyGoal) * 100));
  els('todayDate').textContent = formatDate(); els('sessionNumber').textContent = String(profile.session).padStart(2, '0');
  els('progressRing').textContent = `${progress}%`; els('weeklyProgress').textContent = `${progress}%`;
  els('problemsSolved').textContent = profile.solved; els('solvedToday').innerHTML = `${profile.solvedToday} <small>today</small>`;
  els('learningTime').textContent = profile.minutes < 60 ? `${profile.minutes}m` : `${Math.floor(profile.minutes / 60)}h ${profile.minutes % 60}m`;
  els('timeToday').innerHTML = `${profile.minutesToday}m <small>today</small>`;
  els('profileName').textContent = profile.name || 'Explorer'; els('profileAvatar').textContent = (profile.name || 'BE').slice(0, 2).toUpperCase();
  els('streakValue').textContent = `${Math.max(1, Math.min(profile.session, 99))} day${profile.session === 1 ? '' : 's'} streak`;
  document.querySelector('.progress-ring').style.background = `conic-gradient(var(--coral) 0 ${progress}%, #e9eeeb ${progress}% 100%)`;
  saveProfile();
}
function recordActivity(minutes = 1, solved = 0) { profile.minutes += minutes; profile.minutesToday += minutes; profile.solved += solved; profile.solvedToday += solved; updateDashboard(); }
function closeModal(modal) { modal.classList.add('hidden'); }
function openSettings() { els('settingsName').value = profile.name; document.querySelector(`#settingsForm input[value="${profile.theme}"]`).checked = true; els('settingsModal').classList.remove('hidden'); }

applyTheme(); updateDashboard();
if (!profile.name) els('welcomeModal').classList.remove('hidden');
els('welcomeForm').addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); profile.name = data.get('name').trim(); profile.theme = data.get('theme'); applyTheme(); updateDashboard(); closeModal(els('welcomeModal')); });
els('settingsButton').addEventListener('click', openSettings);
els('settingsForm').addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(event.target); profile.name = data.get('name').trim(); profile.theme = data.get('theme'); applyTheme(); updateDashboard(); closeModal(els('settingsModal')); });
document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop'))));
els('resetProgress').addEventListener('click', () => { profile.solved = 0; profile.solvedToday = 0; profile.minutes = 0; profile.minutesToday = 0; updateDashboard(); });

function showView(view) {
  document.querySelectorAll('.view').forEach((section) => section.classList.toggle('active-view', section.id === `${view}-view`));
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view && button.classList.contains('nav-item')));
  els('breadcrumb').textContent = views[view];
  if (view === 'quiz' && !quizStarted) startQuiz();
  if (view === 'game' && !gameStarted) startGame();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('[data-view]');
  if (target) showView(target.dataset.view);
});

let calcValue = '';
let calcExpression = '';
function updateCalc() { els('calcDisplay').textContent = calcValue || '0'; }
function calculate() {
  try {
    const safeExpression = calcExpression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
    const result = Function(`"use strict"; return (${safeExpression})`)();
    calcValue = Number.isFinite(result) ? String(Math.round(result * 100000) / 100000) : 'Error';
    els('calcHistory').textContent = `${calcExpression} =`;
    calcExpression = calcValue === 'Error' ? '' : calcValue;
  } catch { calcValue = 'Error'; calcExpression = ''; }
  updateCalc();
}
document.querySelectorAll('[data-calc]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.calc;
  if (key === 'clear') { calcValue = ''; calcExpression = ''; els('calcHistory').textContent = 'Ready when you are'; }
  else if (key === 'back') { calcExpression = calcExpression.slice(0, -1); calcValue = calcExpression; }
  else if (key === '=') { calculate(); recordActivity(1); }
  else if (key === '%') { calcExpression = String(Number(calcExpression || calcValue || 0) / 100); calcValue = calcExpression; }
  else { calcExpression += key; calcValue = calcExpression; }
  updateCalc();
}));

const questions = [
  { subject: 'SCIENCE', text: 'Which planet is known as the Red Planet?', answers: ['Venus', 'Mars', 'Jupiter', 'Mercury'], correct: 1 },
  { subject: 'MATHS', text: 'What is 15% of 200?', answers: ['15', '20', '30', '35'], correct: 2 },
  { subject: 'NATURE', text: 'What gas do plants absorb from the atmosphere?', answers: ['Oxygen', 'Nitrogen', 'Helium', 'Carbon dioxide'], correct: 3 },
  { subject: 'GEOGRAPHY', text: 'What is the largest ocean on Earth?', answers: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], correct: 2 },
  { subject: 'MATHS', text: 'A triangle has angles of 60° and 70°. What is the third angle?', answers: ['40°', '50°', '60°', '70°'], correct: 1 }
];
let quizIndex = 0, quizPoints = 0, quizStarted = false, quizAnswered = false;
function startQuiz() { quizStarted = true; quizIndex = 0; quizPoints = 0; renderQuestion(); }
function renderQuestion() {
  const question = questions[quizIndex]; quizAnswered = false;
  els('questionCount').textContent = `QUESTION ${String(quizIndex + 1).padStart(2, '0')} / 05`;
  els('quizScore').textContent = `${quizPoints} points`; els('quizProgress').style.width = `${(quizIndex + 1) * 20}%`;
  els('questionSubject').textContent = question.subject; els('questionText').textContent = question.text;
  els('quizFeedback').textContent = 'Choose the answer you think is right.'; els('nextQuestion').disabled = true;
  els('nextQuestion').textContent = quizIndex === questions.length - 1 ? 'Finish round →' : 'Next question →';
  els('answers').innerHTML = question.answers.map((answer, index) => `<button class="answer" data-answer="${index}">${String.fromCharCode(65 + index)}. ${answer}</button>`).join('');
}
els('answers').addEventListener('click', (event) => {
  const answer = event.target.closest('.answer'); if (!answer || quizAnswered) return;
  quizAnswered = true; const chosen = Number(answer.dataset.answer); const question = questions[quizIndex];
  document.querySelectorAll('.answer').forEach((button, index) => { if (index === question.correct) button.classList.add('correct'); if (index === chosen && chosen !== question.correct) button.classList.add('wrong'); });
  if (chosen === question.correct) { quizPoints += 10; recordActivity(3, 1); els('quizFeedback').textContent = 'Correct. Nice bit of thinking.'; } else els('quizFeedback').textContent = `Not quite. The answer is ${question.answers[question.correct]}.`;
  els('quizScore').textContent = `${quizPoints} points`; els('nextQuestion').disabled = false;
});
els('nextQuestion').addEventListener('click', () => { if (quizIndex === questions.length - 1) { els('quizFeedback').textContent = `Round complete. You earned ${quizPoints} points.`; els('nextQuestion').disabled = true; return; } quizIndex += 1; renderQuestion(); });

let gameStarted = false, gameTimer, gameScore = 0, round = 1, currentAnswer;
function startGame() { gameStarted = true; gameScore = 0; round = 1; newRound(); }
function newRound() {
  clearInterval(gameTimer); const start = Math.floor(Math.random() * 8) + 2; const step = Math.floor(Math.random() * 8) + 2;
  currentAnswer = start + (step * 4); const sequence = [start, start + step, start + step * 2, start + step * 3];
  els('sequence').innerHTML = sequence.map((number) => `<b>${number}</b>`).join('') + '<b>?</b>';
  const options = [currentAnswer, currentAnswer + step, currentAnswer - step, currentAnswer + 2].sort(() => Math.random() - .5);
  els('gameOptions').innerHTML = options.map((option) => `<button data-game-answer="${option}">${option}</button>`).join('');
  els('gameMessage').textContent = 'Choose quickly. You have 30 seconds.'; els('gameScore').textContent = String(gameScore).padStart(3, '0'); els('roundNumber').textContent = String(round).padStart(2, '0');
  let seconds = 30; els('timerText').textContent = seconds; els('timerBar').style.width = '100%';
  gameTimer = setInterval(() => { seconds -= 1; els('timerText').textContent = seconds; els('timerBar').style.width = `${seconds / 30 * 100}%`; if (seconds <= 0) { clearInterval(gameTimer); els('gameMessage').textContent = `Time. The answer was ${currentAnswer}. Start a new round.`; document.querySelectorAll('[data-game-answer]').forEach((button) => { button.disabled = true; }); } }, 1000);
}
els('gameOptions').addEventListener('click', (event) => { const button = event.target.closest('[data-game-answer]'); if (!button || button.disabled) return; clearInterval(gameTimer); const selected = Number(button.dataset.gameAnswer); if (selected === currentAnswer) { gameScore += 10; recordActivity(2, 1); els('gameMessage').textContent = 'Correct. Your streak is building.'; } else els('gameMessage').textContent = `Almost. The answer was ${currentAnswer}.`; document.querySelectorAll('[data-game-answer]').forEach((option) => { option.disabled = true; if (Number(option.dataset.gameAnswer) === currentAnswer) option.classList.add('correct'); }); els('gameScore').textContent = String(gameScore).padStart(3, '0'); });
els('newGame').addEventListener('click', () => { round += 1; newRound(); });

els('themeButton').addEventListener('click', () => { profile.theme = profile.theme === 'dark' ? 'light' : 'dark'; applyTheme(); updateDashboard(); });
els('focusButton').addEventListener('click', () => { document.body.classList.toggle('focus-mode'); });
document.addEventListener('keydown', (event) => { if (event.key.toLowerCase() === 'f' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) document.body.classList.toggle('focus-mode'); });