// 초기화 + 게임 루프 (4단계: 결과 화면, 최고 기록, 설정 저장)
import { createScene, handleResize } from './scene.js';
import { createInput } from './input.js';
import { createGame } from './game.js';
import { applyCrosshair } from './ui.js';
import { loadBest, saveIfBest, loadSettings, saveSettings } from './storage.js';
import { SENS_MIN, SENS_MAX, SENS_DEFAULT } from './config.js';

const $ = (id) => document.getElementById(id);
const el = {
  canvas: $('game'),
  overlay: $('overlay'),
  title: $('overlay-title'),
  result: $('result'),
  newRecord: $('new-record'),
  resKills: $('res-kills'),
  resAcc: $('res-acc'),
  resHead: $('res-head'),
  resTtk: $('res-ttk'),
  resShots: $('res-shots'),
  bestLine: $('best-line'),
  sens: $('sens-input'),
  startBtn: $('start-btn'),
  lockHint: $('lock-hint'),
  rawStatus: $('raw-status'),
  timer: $('timer'),
  centerMsg: $('center-msg'),
  hudKills: $('hud-kills'),
  hudAcc: $('hud-acc'),
  hudHead: $('hud-head'),
};

const { renderer, scene, camera } = createScene(el.canvas);
const input = createInput(el.canvas);
const game = createGame(scene, camera);
applyCrosshair($('crosshair'));

// ── 설정 (감도) ──
function clampSens(v) {
  if (Number.isNaN(v)) return SENS_DEFAULT;
  return Math.min(SENS_MAX, Math.max(SENS_MIN, v));
}
input.state.sens = clampSens(parseFloat(loadSettings().sens ?? SENS_DEFAULT));
el.sens.value = input.state.sens;

// ── 기록 계산 ──
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null);
const pctText = (v) => (v === null || v === undefined ? '-' : `${v}%`);

function summarize(s) {
  const avg = s.killTimes.length
    ? Math.round((s.killTimes.reduce((a, b) => a + b, 0) / s.killTimes.length) * 1000)
    : null;
  return {
    kills: s.kills,
    shots: s.shots,
    hits: s.hits,
    accuracy: pct(s.hits, s.shots),
    headRate: pct(s.heads, s.hits),
    avgKillMs: avg,
    date: new Date().toISOString().slice(0, 10),
  };
}

function renderBest() {
  const b = loadBest();
  el.bestLine.textContent = b
    ? `최고 기록: 처치 ${b.kills} · 명중률 ${pctText(b.accuracy)} · 헤드샷률 ${pctText(b.headRate)} (${b.date})`
    : '최고 기록: 없음';
}

let lastResult = null;   // 마지막 판 결과
let lastWasRecord = false;

// ── 시작 / 일시정지 / 결과 화면 ──
function showOverlay() {
  const ended = game.state === 'ended';
  el.result.classList.toggle('hidden', !ended);

  if (game.state === 'paused') {
    el.title.textContent = '일시정지';
    el.startBtn.textContent = '클릭해서 계속';
  } else if (ended && lastResult) {
    el.title.textContent = '결과';
    el.startBtn.textContent = '다시하기';
    el.newRecord.classList.toggle('hidden', !lastWasRecord);
    el.resKills.textContent = lastResult.kills;
    el.resAcc.textContent = pctText(lastResult.accuracy);
    el.resHead.textContent = pctText(lastResult.headRate);
    el.resTtk.textContent = lastResult.avgKillMs === null ? '-' : `${lastResult.avgKillMs} ms`;
    el.resShots.textContent = `${lastResult.shots} / ${lastResult.hits}`;
  } else {
    el.title.textContent = '플릭 모드';
    el.startBtn.textContent = '클릭해서 시작';
  }

  renderBest();
  el.lockHint.textContent = '';
  el.overlay.classList.remove('hidden');
}

el.startBtn.addEventListener('click', async () => {
  input.state.sens = clampSens(parseFloat(el.sens.value));
  el.sens.value = input.state.sens;
  saveSettings({ sens: input.state.sens });
  const ok = await input.requestLock();
  if (!ok) el.lockHint.textContent = '잠시 후 다시 눌러주세요.';
});

input.onLockChange((locked) => {
  if (locked) {
    el.overlay.classList.add('hidden');
    el.rawStatus.textContent = rawLabel(input.state.raw);
    if (game.state === 'paused') game.resume();
    else if (game.state === 'idle' || game.state === 'ended') game.start();
  } else {
    game.pause();
    showOverlay();
  }
});

game.onEnd((stats) => {
  lastResult = summarize(stats);
  lastWasRecord = saveIfBest(lastResult);
  // 마우스 잠금을 풀면 onLockChange에서 결과 화면이 뜸
  if (document.pointerLockElement) document.exitPointerLock();
  else showOverlay();
});

input.onShoot(() => {
  // 클릭 직전 마우스 움직임까지 반영한 시점으로 판정 (화면 갱신을 기다리지 않음)
  input.applyTo(camera);
  camera.updateMatrixWorld();
  game.shoot();
});

window.addEventListener('resize', () => handleResize(renderer, camera));

function rawLabel(raw) {
  if (raw === true) return '사용 중';
  if (raw === false) return '미지원 (마우스 가속이 섞일 수 있음)';
  return '확인 불가';
}

// ── HUD ──
function updateHud() {
  const s = game.stats;
  el.hudKills.textContent = s.kills;
  el.hudAcc.textContent = pctText(pct(s.hits, s.shots));
  el.hudHead.textContent = pctText(pct(s.heads, s.hits));
  el.timer.textContent = Math.ceil(game.timeLeft);
  el.centerMsg.textContent = game.state === 'countdown' ? Math.ceil(game.countdownLeft) : '';
}

// ── 게임 루프 ──
let prev = performance.now();
function loop(now) {
  // 탭 전환 등으로 프레임이 크게 밀려도 한 번에 0.1초 이상은 진행하지 않음
  const dt = Math.min((now - prev) / 1000, 0.1);
  prev = now;

  game.update(dt);
  input.applyTo(camera);
  updateHud();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

renderBest();
requestAnimationFrame(loop);
