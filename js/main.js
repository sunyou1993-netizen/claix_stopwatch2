/**
 * 1080x1920 Fixed Signage Touch Engine
 */

let isRunning = false;
let time = 0;
let laps = [];

let startTime = 0;
let lastTime = 0;
let frameId = null;

// DOM Elements
const canvas = document.getElementById('signage-canvas');
const stopwatchDisplay = document.getElementById('stopwatch-display');
const speechText = document.getElementById('speech-text');
const speechGlow = document.getElementById('speech-glow');
const resetBtn = document.getElementById('reset-btn');
const lapBtn = document.getElementById('lap-btn');
const startStopBtn = document.getElementById('start-stop-btn');
const viewRecordsBtn = document.getElementById('view-records-btn');
const lapsList = document.getElementById('laps-list');
const emptyState = document.getElementById('empty-state');
const bearCharacter = document.getElementById('bear-character');

// Modal Elements
const recordsModal = document.getElementById('records-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalClearLapsBtn = document.getElementById('modal-clear-laps-btn');
const modalEmptyState = document.getElementById('modal-empty-state');
const modalLapsList = document.getElementById('modal-laps-list');

// SVGs for Start/Stop Button
const playIconSvg = `
  <svg class="w-18 h-18 fill-current translate-x-1" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
`;

const pauseIconSvg = `
  <svg class="w-18 h-18 fill-current" viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
`;

// Helper: Resize signage canvas to fit parent window dynamically while preserving 1080x1920 resolution
function resizeSignage() {
  const winW = window.innerWidth;
  const winH = window.innerHeight;
  const scaleX = winW / 1080;
  const scaleY = winH / 1920;
  
  // Use the smaller scaling ratio to prevent viewport clipping
  const scale = Math.min(scaleX, scaleY);
  
  canvas.style.transform = `translate(-50%, -50%) scale(${scale})`;
  canvas.style.transformOrigin = 'center center';
}

// Format millies to high-precision standard (MM:SS.CC)
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

// Precision clock cycle
function animate(now) {
  if (startTime === 0) {
    startTime = now - lastTime;
  }
  time = now - startTime;
  stopwatchDisplay.textContent = formatTime(time);
  frameId = requestAnimationFrame(animate);
}

// Update text, icons, colors, speaking states
function updateState() {
  if (isRunning) {
    stopwatchDisplay.classList.remove('text-slate-600');
    stopwatchDisplay.classList.add('text-[#006CFF]');
    speechText.classList.remove('text-slate-600');
    speechText.classList.add('text-[#006CFF]');
    speechText.innerHTML = `열심히 측정 중이에요!<br>조금만 더 힘내세요!`;
    speechGlow.classList.remove('opacity-0');
    speechGlow.classList.add('opacity-100', 'animate-pulse-glow');
  } else {
    stopwatchDisplay.classList.add('text-slate-600');
    stopwatchDisplay.classList.remove('text-[#006CFF]');
    speechText.classList.add('text-slate-600');
    speechText.classList.remove('text-[#006CFF]');
    
    if (time > 0) {
      speechText.innerHTML = `수고하셨어요!<br>기록을 확인해보세요.`;
    } else {
      speechText.innerHTML = `준비됐나요?<br>시작 버튼을 눌러보세요!`;
    }
    speechGlow.classList.add('opacity-0');
    speechGlow.classList.remove('opacity-100', 'animate-pulse-glow');
  }

  // Handle bear swinging interaction when isRunning
  if (bearCharacter) {
    if (isRunning) {
      bearCharacter.classList.add('animate-bear-swing');
    } else {
      bearCharacter.classList.remove('animate-bear-swing');
    }
  }

  // Render start & stop button content
  if (isRunning) {
    startStopBtn.className = "flex flex-col items-center justify-center gap-4 text-white h-full rounded-[32px] shadow-2xl bg-gradient-to-b from-rose-400 to-rose-600 shadow-rose-200/50 active:scale-95 transition-all outline-none border-none select-none duration-150";
    startStopBtn.innerHTML = `
      ${pauseIconSvg}
      <span class="text-[52px] font-medium">일시정지</span>
    `;
  } else {
    startStopBtn.className = "flex flex-col items-center justify-center gap-4 text-white h-full rounded-[32px] shadow-2xl bg-gradient-to-b from-[#006CFF] to-[#0052cc] shadow-blue-200/50 active:scale-95 transition-all outline-none border-none select-none duration-150";
    const label = time > 0 ? "재시작" : "시작";
    startStopBtn.innerHTML = `
      ${playIconSvg}
      <span class="text-[52px] font-medium">${label}</span>
    `;
  }

  // Toggle reset state
  if (time === 0 && !isRunning) {
    resetBtn.setAttribute('disabled', 'true');
    resetBtn.style.opacity = "0.5";
  } else {
    resetBtn.removeAttribute('disabled');
    resetBtn.style.opacity = "1";
  }

  // Toggle lap state
  if (isRunning) {
    lapBtn.removeAttribute('disabled');
    lapBtn.style.opacity = "1";
  } else {
    lapBtn.setAttribute('disabled', 'true');
    lapBtn.style.opacity = "0.5";
  }
}

// Action Handlers
function handleStartStop() {
  if (isRunning) {
    // Action: PAUSE
    if (frameId) cancelAnimationFrame(frameId);
    lastTime = time;
    isRunning = false;
    // Automatically record lap when pausing as requested
    handleLap();
  } else {
    // Action: START
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
  
  stopwatchDisplay.textContent = formatTime(time);
  updateState();
  renderLaps();
}

function handleLap() {
  if (!isRunning && time === 0) return;
  
  const newLap = {
    id: Date.now(),
    time: formatTime(time)
  };
  
  laps.unshift(newLap);
  renderLaps();
}

function renderLaps() {
  // 1. Render on-screen main list
  if (laps.length === 0) {
    emptyState.classList.remove('hidden');
    lapsList.classList.add('hidden');
    lapsList.innerHTML = '';
  } else {
    emptyState.classList.add('hidden');
    lapsList.classList.remove('hidden');
    lapsList.innerHTML = '';
    
    laps.forEach((lap, index) => {
      const lapNum = laps.length - index;
      const item = document.createElement('div');
      item.className = "flex items-center justify-between bg-slate-50 rounded-2xl p-6 border border-slate-100/80 shadow-sm";
      item.innerHTML = `
        <span class="text-[30px] font-black text-blue-500 tracking-wider">LAP ${lapNum}</span>
        <span class="font-mono text-4xl font-extrabold text-slate-700">${lap.time}</span>
      `;
      lapsList.appendChild(item);
    });
  }

  // 2. Render Modal records list
  if (laps.length === 0) {
    modalEmptyState.classList.remove('hidden');
    modalLapsList.classList.add('hidden');
    modalLapsList.innerHTML = '';
  } else {
    modalEmptyState.classList.add('hidden');
    modalLapsList.classList.remove('hidden');
    modalLapsList.innerHTML = '';
    
    laps.forEach((lap, index) => {
      const lapNum = laps.length - index;
      const item = document.createElement('div');
      item.className = "flex items-center justify-between bg-slate-100/60 rounded-2xl p-6 border border-slate-200/50 shadow-sm";
      item.innerHTML = `
        <span class="text-[30px] font-black text-blue-500 tracking-wider">LAP ${lapNum}</span>
        <span class="font-mono text-4xl font-extrabold text-slate-700">${lap.time}</span>
      `;
      modalLapsList.appendChild(item);
    });
  }
}

function clearLaps() {
  laps = [];
  renderLaps();
}

// Modal Toggle Handlers
function openRecordsModal() {
  recordsModal.classList.remove('hidden');
  renderLaps();
}

function closeRecordsModal() {
  recordsModal.classList.add('hidden');
}

// Wire Event Listeners
startStopBtn.addEventListener('click', handleStartStop);
resetBtn.addEventListener('click', handleReset);
lapBtn.addEventListener('click', handleLap);

// Modal listeners
viewRecordsBtn.addEventListener('click', openRecordsModal);
closeModalBtn.addEventListener('click', closeRecordsModal);
modalConfirmBtn.addEventListener('click', closeRecordsModal);
modalClearLapsBtn.addEventListener('click', clearLaps);

// Handle window resizing / centering scale
window.addEventListener('resize', resizeSignage);
window.addEventListener('load', resizeSignage);

// Initialize display and sizing on launch
resizeSignage();
updateState();
renderLaps();
stopwatchDisplay.textContent = formatTime(0);
