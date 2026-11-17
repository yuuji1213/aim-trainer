// 초기화 + 게임 루프 (1단계: 빈 방 + 1인칭 시점 + 감도)
import { createScene, handleResize } from './scene.js';
import { createInput } from './input.js';
import { SENS_MIN, SENS_MAX, SENS_DEFAULT } from './config.js';

const canvas = document.getElementById('game');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start-btn');
const sensInput = document.getElementById('sens-input');
const hud = {
  yaw: document.getElementById('hud-yaw'),
  pitch: document.getElementById('hud-pitch'),
  sens: document.getElementById('hud-sens'),
  raw: document.getElementById('hud-raw'),
};

const { renderer, scene, camera } = createScene(canvas);
const input = createInput(canvas);

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

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

loop();
