// 초기화 + 게임 루프 (3단계: 플릭 모드)
import { createScene, handleResize } from './scene.js';
import { createInput } from './input.js';
import { createGame } from './game.js';
import { applyCrosshair, partLabel } from './ui.js';
import { SENS_MIN, SENS_MAX, SENS_DEFAULT } from './config.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const overlay = $('overlay');
const startBtn = $('start-btn');
const sensInput = $('sens-input');
const overlayTitle = $('overlay-title');
const overlayInfo = $('overlay-info');
const lockHint = $('lock-hint');
const timerEl = $('timer');
const centerMsg = $('center-msg');
const hud = {
  yaw: $('hud-yaw'),
  pitch: $('hud-pitch'),
  sens: $('hud-sens'),
  raw: $('hud-raw'),
  lastHit: $('hud-last-hit'),
  shots: $('hud-shots'),
  hits: $('hud-hits'),
  heads: $('hud-heads'),
  kills: $('hud-kills'),
};

const { renderer, scene, camera } = createScene(canvas);
const input = createInput(canvas);
const game = createGame(scene, camera);
applyCrosshair($('crosshair'));

sensInput.value = SENS_DEFAULT;

function readSens() {
  const v = parseFloat(sensInput.value);
  if (Number.isNaN(v)) return SENS_DEFAULT;
  return Math.min(SENS_MAX, Math.max(SENS_MIN, v));
}

// ── 시작 / 일시정지 / 종료 화면 ──
function pct(a, b) {
  return b > 0 ? `${Math.round((a / b) * 100)}%` : '-';
}

function showOverlay() {
  const s = game.stats;
  if (game.state === 'paused') {
    overlayTitle.textContent = '일시정지';
    overlayInfo.textContent = '';
    startBtn.textContent = '클릭해서 계속';
  } else if (game.state === 'ended') {
    overlayTitle.textContent = '종료';
    // 정식 결과 화면은 4단계에서
    overlayInfo.textContent =
      `처치 ${s.kills} · 명중률 ${pct(s.hits, s.shots)} · 헤드샷률 ${pct(s.heads, s.hits)}`;
    startBtn.textContent = '다시하기';
  } else {
    overlayTitle.textContent = '플릭 모드';
    overlayInfo.textContent = '';
    startBtn.textContent = '클릭해서 시작';
  }
  lockHint.textContent = '';
  overlay.classList.remove('hidden');
}

startBtn.addEventListener('click', async () => {
  input.state.sens = readSens();
  sensInput.value = input.state.sens;
  const ok = await input.requestLock();
  if (!ok) lockHint.textContent = '잠시 후 다시 눌러주세요.';
});

input.onLockChange((locked) => {
  if (locked) {
    overlay.classList.add('hidden');
    if (game.state === 'paused') game.resume();
    else if (game.state === 'idle' || game.state === 'ended') game.start();
  } else {
    game.pause();
    showOverlay();
  }
});

game.onEnd(() => {
  // 마우스 잠금을 풀면 onLockChange에서 종료 화면이 뜸
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

// ── HUD ──
function rawLabel(raw) {
  if (raw === true) return '사용 중';
  if (raw === false) return '미지원';
  return '확인 불가';
}

function lastHitLabel(r) {
  if (!r) return '-';
  if (!r.hit) return '빗나감';
  return `${partLabel(r.part)} ${r.damage}${r.killed ? ' · 처치' : ''}`;
}

function updateHud() {
  hud.yaw.textContent = input.normalizedYaw().toFixed(1);
  hud.pitch.textContent = input.state.pitch.toFixed(1);
  hud.sens.textContent = input.state.sens.toFixed(2);
  hud.raw.textContent = rawLabel(input.state.raw);

  const s = game.stats;
  hud.lastHit.textContent = lastHitLabel(game.lastHit);
  hud.shots.textContent = s.shots;
  hud.hits.textContent = s.hits;
  hud.heads.textContent = s.heads;
  hud.kills.textContent = s.kills;

  timerEl.textContent = Math.ceil(game.timeLeft);

  // 카운트다운 숫자
  centerMsg.textContent = game.state === 'countdown' ? Math.ceil(game.countdownLeft) : '';
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

requestAnimationFrame(loop);
