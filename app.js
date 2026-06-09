/**
 * High-Precision Stopwatch Engine
 * Standalone vanilla JS implementation for Webview integration
 */

let isRunning = false;
let time = 0;
let laps = [];

let startTime = 0;
let lastTime = 0;
let frameId = null;

// DOM Elements
const stopwatchDisplay = document.getElementById('stopwatch-display');
const speechBubble = document.getElementById('speech-bubble');
const speechText = document.getElementById('speech-text');
const speechGlow = document.getElementById('speech-glow');
const resetBtn = document.getElementById('reset-btn');
const startStopBtn = document.getElementById('start-stop-btn');
const clearLapsBtn = document.getElementById('clear-laps-btn');
const lapsContainer = document.getElementById('laps-container');
const lapsList = document.getElementById('laps-list');
const emptyState = document.getElementById('empty-state');

// SVGs for Start/Stop Button
const playIconSvg = `
  <svg class="w-12 h-12 fill-current ml-1" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>
`;

const pauseIconSvg = `
  <svg class="w-12 h-12 fill-current" viewBox="0 0 24 24" fill="currentColor">
    <rect x="14" y="4" width="4" height="16" rx="1"/>
    <rect x="6" y="4" width="4" height="16" rx="1"/>
  </svg>
`;

// Helper: Formatting high-precision ms to MM:SS.CC
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

// Stopwatch RequestAnimationFrame Loop
function animate(now) {
  if (startTime === 0) {
    startTime = now - lastTime;
  }
  time = now - startTime;
  updateDisplay();
  frameId = requestAnimationFrame(animate);
}

// DOM Rendering Updates
function updateDisplay() {
  // Update time digits
  stopwatchDisplay.textContent = formatTime(time);
}

function updateState() {
  // Update Display Colors based on Running State
  if (isRunning) {
    stopwatchDisplay.classList.remove('text-slate-600');
    stopwatchDisplay.classList.add('text-[#006CFF]');
    speechText.classList.remove('text-slate-600');
    speechText.classList.add('text-[#006CFF]');
  } else {
    stopwatchDisplay.classList.add('text-slate-600');
    stopwatchDisplay.classList.remove('text-[#006CFF]');
    speechText.classList.add('text-slate-600');
    speechText.classList.remove('text-[#006CFF]');
  }

  // Speech Bubble Message
  if (isRunning) {
    speechText.innerHTML = `열심히 측정 중이에요!<br>조금만 더 힘내세요!`;
    speechGlow.classList.remove('opacity-0');
    speechGlow.classList.add('opacity-100', 'animate-pulse-glow');
  } else if (time > 0) {
    speechText.innerHTML = `수고하셨어요!<br>기록을 확인해보세요.`;
    speechGlow.classList.add('opacity-0');
    speechGlow.classList.remove('opacity-100', 'animate-pulse-glow');
  } else {
    speechText.innerHTML = `준비됐나요?<br>시작 버튼을 눌러보세요!`;
    speechGlow.classList.add('opacity-0');
    speechGlow.classList.remove('opacity-100', 'animate-pulse-glow');
  }

  // Update Buttons
  if (isRunning) {
    // Running styles
    startStopBtn.className = "h-[180px] rounded-[32px] shadow-xl flex flex-col items-center justify-center gap-3 text-white transition-all bg-gradient-to-b from-rose-400 to-rose-600 shadow-rose-200 active:scale-95";
    startStopBtn.innerHTML = `
      ${pauseIconSvg}
      <span class="text-3xl font-bold">일시정지</span>
    `;
  } else {
    // Stopped/Ready styles
    startStopBtn.className = "h-[180px] rounded-[32px] shadow-xl flex flex-col items-center justify-center gap-3 text-white transition-all bg-gradient-to-b from-[#006CFF] to-[#0052cc] shadow-blue-200 active:scale-95";
    const label = time > 0 ? '재시작' : '시작';
    startStopBtn.innerHTML = `
      ${playIconSvg}
      <span class="text-3xl font-bold">${label}</span>
    `;
  }

  // Reset button state
  if (time === 0 && !isRunning) {
    resetBtn.setAttribute('disabled', 'true');
  } else {
    resetBtn.removeAttribute('disabled');
  }
}

// Interaction Handlers
function handleStartStop() {
  if (isRunning) {
    // Current state is running: Action = PAUSE
    if (frameId) cancelAnimationFrame(frameId);
    lastTime = time;
    isRunning = false;
    
    // AutoLap when pausing as requested
    handleLap();
  } else {
    // Current state is paused/ready: Action = START
    startTime = 0;
    isRunning = true;
    frameId = requestAnimationFrame(animate);
  }
  updateState();
}

function handleReset() {
  if (frameId) cancelAnimationFrame(frameId);
  isRunning = false;
  time = 0;
  lastTime = 0;
  laps = [];
  
  updateDisplay();
  updateState();
  renderLaps();
}

function handleLap() {
  if (!isRunning && time === 0) return;
  
  const newLap = {
    id: Date.now(),
    time: formatTime(time)
  };
  
  // Prepend so latest lap split is at the very top
  laps.unshift(newLap);
  renderLaps();
}

function renderLaps() {
  if (laps.length === 0) {
    emptyState.classList.remove('hidden');
    lapsList.classList.add('hidden');
    lapsList.innerHTML = '';
  } else {
    emptyState.classList.add('hidden');
    lapsList.classList.remove('hidden');
    
    // Clear & populate
    lapsList.innerHTML = '';
    laps.forEach((lap, index) => {
      const lapNum = laps.length - index;
      const lapItem = document.createElement('div');
      lapItem.className = "flex items-center justify-between bg-slate-50/50 rounded-2xl p-8 border border-slate-100/50 transform translate-y-0 opacity-100 transition-all duration-300";
      lapItem.innerHTML = `
        <span class="text-[24px] font-black text-blue-400 tracking-wider">LAP ${lapNum}</span>
        <span class="font-mono text-4xl font-bold text-slate-600">${lap.time}</span>
      `;
      lapsList.appendChild(lapItem);
    });
  }
}

function clearLaps() {
  laps = [];
  renderLaps();
}

// Event Listeners
startStopBtn.addEventListener('click', handleStartStop);
resetBtn.addEventListener('click', handleReset);
clearLapsBtn.addEventListener('click', clearLaps);

// Initialize App View State
updateDisplay();
updateState();
renderLaps();
