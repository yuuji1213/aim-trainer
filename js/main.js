// 초기화 + 게임 루프 (연습 모드 · 7단계: WASD 이동)
import { createScene, handleResize } from './scene.js';
import { createInput } from './input.js';
import { createGame } from './game.js';
import { createWeapon } from './weapon.js';
import { createEffects } from './effects.js';
import { createMovement } from './movement.js';
import * as THREE from 'three';
import { EFFECTS } from './config.js';
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
  hudClick: $('hud-click'),
  hudSpeed: $('hud-speed'),
  hudAcc2: $('hud-accurate'),
};

const { renderer, scene, camera, worldMeshes } = createScene(el.canvas);
const input = createInput(el.canvas);
const game = createGame(scene, worldMeshes);
const weapon = createWeapon();
const effects = createEffects(scene);
const movement = createMovement(camera);
weapon.setExtraSpread(() => movement.moveSpread());
applyCrosshair($('crosshair'));

// 화면을 두 번 그림: 맵 → (깊이 초기화) → 총
renderer.autoClear = false;

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
    el.title.textContent = '연습 모드';
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
  movement.setEnabled(locked);
  if (locked) {
    el.overlay.classList.add('hidden');
    el.rawStatus.textContent = rawLabel(input.state.raw);
    if (game.state === 'paused') game.resume();
    else if (game.state === 'idle' || game.state === 'ended') {
      weapon.resetRecoil();
      effects.clear();
      movement.reset();
      game.start();
    }
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

// ── 사격 ──
weapon.setCanFire(() => game.state === 'playing');
// 클릭 진단: 한 번 누를 때 얼마나 눌렸고 몇 발 나갔는지 (터치패드 탭 확인용)
let pressStart = 0;
let pressShots = 0;
input.onTriggerDown(() => {
  pressStart = performance.now();
  pressShots = 0;
  weapon.triggerDown();
});
input.onTriggerUp(() => {
  weapon.triggerUp();
  el.hudClick.textContent = `${Math.round(performance.now() - pressStart)}ms · ${pressShots}발`;
});
const DEG = Math.PI / 180;
const _origin = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _ndc = new THREE.Vector3();
const _muzzleWorld = new THREE.Vector3();
const _farPoint = new THREE.Vector3();

weapon.onFire((shot) => {
  // 발사 순간의 마우스 움직임까지 반영한 시점으로 판정 (화면 갱신을 기다리지 않음)
  input.applyTo(camera);
  camera.updateMatrixWorld();

  // 실제 총알 방향 = 크로스헤어 방향 + 반동 + 퍼짐 (화면 흔들림은 판정에 넣지 않음)
  const pitch = input.state.pitch + shot.pitchOffset;
  const yaw = input.state.yaw + shot.yawOffset;
  _euler.set(pitch * DEG, -yaw * DEG, 0);
  _dir.set(0, 0, -1).applyEuler(_euler);
  camera.getWorldPosition(_origin);

  const r = game.shoot(_origin, _dir);
  if (!r) return;
  pressShots += 1;

  // 궤적 시작점: 화면에 보이는 총구 위치에서 카메라 앞 0.6m 지점
  weapon.muzzleNDC(_ndc);
  _muzzleWorld.set(_ndc.x, _ndc.y, 0.5).unproject(camera).sub(_origin).normalize()
    .multiplyScalar(0.6).add(_origin);
  const end = r.point ?? _farPoint.copy(_origin).addScaledVector(_dir, EFFECTS.missDistance);
  effects.spawnTracer(_muzzleWorld, end);

  if (r.point && !r.isTarget && r.normal) effects.spawnDecal(r.point, r.normal);
});

window.addEventListener('resize', () => {
  handleResize(renderer, camera);
  weapon.resize();
});

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
  el.hudSpeed.textContent = movement.speed().toFixed(1);
  const ok = movement.accurate();
  el.hudAcc2.textContent = ok ? '정확' : '부정확';
  el.hudAcc2.className = ok ? 'ok' : 'bad';
  el.centerMsg.textContent = game.state === 'countdown' ? Math.ceil(game.countdownLeft) : '';
}

// ── 게임 루프 ──
let prev = performance.now();
function loop(now) {
  // 탭 전환 등으로 프레임이 크게 밀려도 한 번에 0.1초 이상은 진행하지 않음
  const dt = Math.min((now - prev) / 1000, 0.1);
  prev = now;

  game.update(dt);
  // 카운트다운·플레이 중에만 이동 (일시정지·결과 화면에서는 멈춤)
  if (game.state === 'countdown' || game.state === 'playing') movement.update(dt, input.state.yaw);
  input.applyTo(camera);
  camera.updateMatrixWorld();
  weapon.update(dt); // 연사 중이면 여기서 발사
  effects.update(dt);
  updateHud();

  // 화면이 반동을 따라 올라감 (크로스헤어도 함께). 판정은 onFire에서 따로 계산
  camera.rotation.x += weapon.viewPitch * DEG;
  camera.rotation.y -= weapon.viewYaw * DEG;

  renderer.clear();
  renderer.render(scene, camera);
  weapon.render(renderer);
  requestAnimationFrame(loop);
}

renderBest();
requestAnimationFrame(loop);
