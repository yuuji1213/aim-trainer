// 초기화 + 게임 루프 (2단계: 크로스헤어 + 사람형 표적 + 부위별 데미지)
import { createScene, handleResize } from './scene.js';
import { createInput } from './input.js';
import { createTarget, shootAt } from './targets.js';
import { applyCrosshair, partLabel } from './ui.js';
import { SENS_MIN, SENS_MAX, SENS_DEFAULT, TEST_TARGET_POS, TARGET_HP } from './config.js';

const canvas = document.getElementById('game');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const sensInput = document.getElementById('sens-input');
const $ = (id) => document.getElementById(id);
const hud = {
  yaw: $('hud-yaw'),
  pitch: $('hud-pitch'),
  sens: $('hud-sens'),
  raw: $('hud-raw'),
  targetHp: $('hud-target-hp'),
  lastHit: $('hud-last-hit'),
  shots: $('hud-shots'),
  hits: $('hud-hits'),
  heads: $('hud-heads'),
  kills: $('hud-kills'),
};

const { renderer, scene, camera } = createScene(canvas);
const input = createInput(canvas);
applyCrosshair($('crosshair'));

// 2단계 테스트용 표적 1개
const targets = [createTarget(scene, TEST_TARGET_POS)];

// 2단계 확인용 집계 (정식 기록 화면은 4단계)
const stats = { shots: 0, hits: 0, heads: 0, kills: 0 };
let lastHitText = '-';

input.onShoot(() => {
  stats.shots += 1;
  const r = shootAt(camera, targets);
  if (!r.hit) {
    lastHitText = '빗나감';
    return;
  }
  stats.hits += 1;
  if (r.part === 'head') stats.heads += 1;
  if (r.killed) stats.kills += 1;
  lastHitText = `${partLabel(r.part)} ${r.damage}${r.killed ? ' · 처치' : ''}`;
});

sensInput.value = SENS_DEFAULT;

function readSens() {
  const v = parseFloat(sensInput.value);
  if (Number.isNaN(v)) return SENS_DEFAULT;
  return Math.min(SENS_MAX, Math.max(SENS_MIN, v));
}

startBtn.addEventListener('click', () => {
  input.state.sens = readSens();
  sensInput.value = input.state.sens;
  input.requestLock();
});

input.onLockChange((locked) => {
  overlay.classList.toggle('hidden', locked);
});

window.addEventListener('resize', () => handleResize(renderer, camera));

function rawLabel(raw) {
  if (raw === true) return '사용 중';
  if (raw === false) return '미지원';
  return '확인 불가';
}

function loop() {
  input.applyTo(camera);

  hud.yaw.textContent = input.normalizedYaw().toFixed(1);
  hud.pitch.textContent = input.state.pitch.toFixed(1);
  hud.sens.textContent = input.state.sens.toFixed(2);
  hud.raw.textContent = rawLabel(input.state.raw);

  const t = targets[0];
  hud.targetHp.textContent = t.alive ? `${t.hp} / ${TARGET_HP}` : '재등장 대기';
  hud.lastHit.textContent = lastHitText;
  hud.shots.textContent = stats.shots;
  hud.hits.textContent = stats.hits;
  hud.heads.textContent = stats.heads;
  hud.kills.textContent = stats.kills;

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

loop();
