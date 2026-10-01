// cgm-simulation.js

const N = 150;                  // large lattice
const canvas = document.getElementById("cgmCanvas");
const ctx = canvas.getContext("2d");
const centerX = canvas.width / 2;  // center horizontally

let weights, T;
let m = 30;
let delay = 150;
let currentTime = 0;
let timer = null;
let running = false;

// UI elements
const sizeSlider  = document.getElementById('sizeSlider');
const sizeVal     = document.getElementById('sizeVal');
const speedSlider = document.getElementById('speedSlider');
const speedVal    = document.getElementById('speedVal');
const runBtn      = document.getElementById('runBtn');
const pauseBtn    = document.getElementById('pauseBtn');
const newBtn      = document.getElementById('newWeightsBtn');

// exponential(1) random variable
function expRand() { return -Math.log(Math.random()); }

// compute infection times
function computeInfectionTimes() {
  weights = Array.from({length: N}, () => Array(N));
  T       = Array.from({length: N}, () => Array(N).fill(Infinity));

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      weights[i][j] = expRand();
    }
  }
  for (let i = 0; i < N; i++) T[i][0] = 0;
  for (let j = 0; j < N; j++) T[0][j] = 0;

  for (let i = 1; i < N; i++) {
    for (let j = 1; j < N; j++) {
      T[i][j] = Math.max(T[i-1][j], T[i][j-1]) + weights[i][j];
    }
  }
}

// compute scaling so lattice touches top of canvas
function getScales(m) {
  const rt2 = Math.SQRT2;
  const verticalSpan = m / rt2;               // max Y_rot = m / √2
  const cellSize = (canvas.height * 0.95) / verticalSpan; // fit snugly
  const baseY = canvas.height;                // bottom at canvas bottom
  return {cellSize, baseY};
}

// lattice (i,j) → rotated screen coords
function latticeToScreen(i, j, cellSize, baseY) {
  const rt2 = Math.SQRT2;
  const Xr = (i - j) / rt2;
  const Yr = (i + j) / rt2;
  return [centerX + Xr * cellSize, baseY - Yr * cellSize];
}

// draw current state
function drawFrame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const {cellSize, baseY} = getScales(m);
  const infectedRadius = Math.max(2, 5 * (30/m));

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= m; j++) {
      if (i + j > m) continue;
      const [x, y] = latticeToScreen(i, j, cellSize, baseY);
      ctx.beginPath();
      if (T[i][j] <= currentTime) {
        ctx.fillStyle = "#4a90e2";
        ctx.arc(x, y, infectedRadius, 0, 2*Math.PI);
      } else {
        ctx.fillStyle = "#111";
        ctx.arc(x, y, Math.max(1, infectedRadius/3), 0, 2*Math.PI);
      }
      ctx.fill();
    }
  }

  // limit shape curve
  const t = currentTime;
  if (t > 0) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const steps = 400;
    for (let k = 0; k <= steps; k++) {
      const u = (k/steps) * t;
      const y = (Math.sqrt(t) - Math.sqrt(u))**2;
      const Xr = (u - y) / Math.SQRT2;
      const Yr = (u + y) / Math.SQRT2;
      const sx = centerX + Xr * cellSize;
      const sy = baseY   - Yr * cellSize;
      if (k === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
}

// advance time
function step() {
  currentTime += 0.5;
  drawFrame();
  if (currentTime >= m) {
    if (timer) clearInterval(timer);
    running = false;
  }
}

function start() {
  if (running) return;
  running = true;
  if (timer) clearInterval(timer);
  timer = setInterval(step, delay);
}

function pause() {
  running = false;
  if (timer) clearInterval(timer);
}

function resetRun() {
  m = parseInt(sizeSlider.value, 10);
  delay = parseInt(speedSlider.value, 10);
  currentTime = 0;
  drawFrame();
  start();
}

// UI listeners
sizeSlider.addEventListener('input', () => { sizeVal.textContent = sizeSlider.value; });
speedSlider.addEventListener('input', () => { speedVal.textContent = `${speedSlider.value} ms`; });
runBtn.addEventListener('click', resetRun);
pauseBtn.addEventListener('click', () => {
  running ? pause() : start();
  pauseBtn.textContent = running ? 'Pause' : 'Resume';
});
newBtn.addEventListener('click', () => {
  pause();
  computeInfectionTimes();
  currentTime = 0;
  drawFrame();
  pauseBtn.textContent = 'Pause';
});

// boot
computeInfectionTimes();
drawFrame();
