// 플릭 모드 규칙: 상태(대기/카운트다운/플레이/일시정지/종료), 타이머, 표적 재배치, 집계
import * as THREE from 'three';
import { createTarget, placeTarget, hideTarget, applyHit, aliveMeshes } from './targets.js';
import { FLICK } from './config.js';

const RAD2DEG = 180 / Math.PI;

function freshStats() {
  return { shots: 0, hits: 0, heads: 0, kills: 0, killTimes: [] };
}

// worldMeshes: 총알이 막히는 맵 표면(벽·바닥). 탄흔 위치 계산에도 사용
export function createGame(scene, worldMeshes) {
  const targets = [];
  for (let i = 0; i < FLICK.targetCount; i++) targets.push(createTarget(scene));

  const g = {
    state: 'idle',       // idle | countdown | playing | paused | ended
    resumeTo: null,      // 일시정지 전에 있던 상태
    countdownLeft: 0,
    clock: 0,            // 플레이 경과 시간 (초). 일시정지 중에는 멈춤
    timeLeft: FLICK.duration,
    stats: freshStats(),
    lastHit: null,       // shootAt 결과 (HUD용)
  };

  const endListeners = [];

  // 플레이어 기준 좌우 각도 (도). 정면 = 0, 오른쪽 = +
  const angleOf = (x, z) => Math.atan2(x, -z) * RAD2DEG;

  // 다른 표적, 그리고 자기 이전 자리와 겹치지 않는 위치 고르기
  function pickPosition(self) {
    const { xMin, xMax, z } = FLICK.spawn;
    const taken = [];
    for (const t of targets) {
      // 다른 표적: 서 있는 것만 피함
      // 자기 자신: 방금 처치된 경우(아직 화면에 보이는 상태) 그 자리를 피함 → 같은 곳에 또 안 생김
      const avoid = t === self ? t.group.visible : t.alive;
      if (avoid) taken.push(angleOf(t.group.position.x, t.group.position.z));
    }

    let x = 0;
    for (let tries = 0; tries < 50; tries++) {
      x = xMin + Math.random() * (xMax - xMin);
      const a = angleOf(x, z);
      if (taken.every((b) => Math.abs(a - b) >= FLICK.minAngleDeg)) break;
    }
    return { x, z };
  }

  function spawn(t) {
    const { x, z } = pickPosition(t);
    placeTarget(t, x, z);
    t.spawnedAt = g.clock;
  }

  function start() {
    targets.forEach(hideTarget);
    g.stats = freshStats();
    g.lastHit = null;
    g.clock = 0;
    g.timeLeft = FLICK.duration;
    g.countdownLeft = FLICK.countdown;
    g.state = 'countdown';
  }

  function beginPlay() {
    g.state = 'playing';
    g.clock = 0;
    // 처음 3개는 서로만 안 겹치면 됨
    targets.forEach(hideTarget);
    targets.forEach(spawn);
  }

  function end() {
    g.state = 'ended';
    g.timeLeft = 0;
    targets.forEach(hideTarget);
    endListeners.forEach((fn) => fn(g.stats));
  }

  function pause() {
    if (g.state !== 'countdown' && g.state !== 'playing') return;
    g.resumeTo = g.state;
    g.state = 'paused';
  }

  function resume() {
    if (g.state !== 'paused') return;
    g.state = g.resumeTo;
    g.resumeTo = null;
  }

  function update(dt) {
    if (g.state === 'countdown') {
      g.countdownLeft -= dt;
      if (g.countdownLeft <= 0) beginPlay();
    } else if (g.state === 'playing') {
      g.clock += dt;
      g.timeLeft = Math.max(0, FLICK.duration - g.clock);
      if (g.timeLeft <= 0) end();
    }
  }

  // origin에서 direction 방향으로 총알 한 발
  // 반환값: null(플레이 중 아님) 또는
  //   { point, normal, isTarget, part, damage, killed }  — point가 null이면 아무것도 안 맞음
  const raycaster = new THREE.Raycaster();
  function shoot(origin, direction) {
    if (g.state !== 'playing') return null;
    const s = g.stats;
    s.shots += 1;

    raycaster.set(origin, direction);
    const hits = raycaster.intersectObjects([...aliveMeshes(targets), ...worldMeshes], false);
    const first = hits[0];
    if (!first) {
      g.lastHit = { hit: false };
      return { point: null };
    }

    const normal = first.face
      ? first.face.normal.clone().transformDirection(first.object.matrixWorld)
      : null;

    if (!first.object.userData.part) {
      // 벽·바닥에 맞음
      g.lastHit = { hit: false };
      return { point: first.point, normal, isTarget: false };
    }

    const r = applyHit(first.object, targets);
    g.lastHit = { hit: true, ...r };
    s.hits += 1;
    if (r.part === 'head') s.heads += 1;
    if (r.killed) {
      s.kills += 1;
      s.killTimes.push(g.clock - r.target.spawnedAt);
      spawn(r.target); // 처치하면 바로 다른 자리에 새로 세움
    }
    return { point: first.point, normal, isTarget: true, ...r };
  }

  return {
    get state() { return g.state; },
    get countdownLeft() { return g.countdownLeft; },
    get timeLeft() { return g.timeLeft; },
    get stats() { return g.stats; },
    get lastHit() { return g.lastHit; },
    targets,
    start,
    pause,
    resume,
    update,
    shoot,
    onEnd: (fn) => endListeners.push(fn),
  };
}
