// 이동: WASD, Shift 걷기, 가속·감속, 벽 충돌, 이동 중 탄 퍼짐 계산
import * as THREE from 'three';
import { MOVE, ROOM, EYE_HEIGHT } from './config.js';

const DEG = Math.PI / 180;

export function createMovement(camera) {
  const keys = new Set();
  const vel = new THREE.Vector3();       // 현재 속도 (m/s, 수평만)
  const wish = new THREE.Vector3();      // 키 입력 방향
  const desired = new THREE.Vector3();   // 목표 속도
  const dv = new THREE.Vector3();

  // e.code는 한글 입력 상태에서도 'KeyW'처럼 자판 위치로 들어옴
  const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'];
  let enabled = false;

  document.addEventListener('keydown', (e) => {
    if (!enabled || !MOVE_KEYS.includes(e.code)) return;
    keys.add(e.code);
    e.preventDefault();
  });
  document.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  function setEnabled(on) {
    enabled = on;
    if (!on) keys.clear();
  }

  function reset() {
    keys.clear();
    vel.set(0, 0, 0);
    camera.position.set(0, EYE_HEIGHT, 0);
  }

  function update(dt, yawDeg) {
    // 1) 키 입력 → 바라보는 방향 기준 이동 방향
    const f = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    const r = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
    const yaw = yawDeg * DEG;
    // 앞 = (sin, 0, -cos), 오른쪽 = (cos, 0, sin)
    wish.set(Math.sin(yaw) * f + Math.cos(yaw) * r, 0, -Math.cos(yaw) * f + Math.sin(yaw) * r);
    const walking = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const maxSpeed = MOVE.runSpeed * (walking ? MOVE.walkRatio : 1);

    if (wish.lengthSq() > 0) {
      // 대각선도 같은 최대 속도
      desired.copy(wish).normalize().multiplyScalar(maxSpeed);
      dv.subVectors(desired, vel);
      // 느려지거나 방향을 꺾을 때는 감속값, 빨라질 때는 가속값
      const slowing = desired.lengthSq() < vel.lengthSq() || vel.dot(desired) < 0;
      const step = (slowing ? MOVE.decel : MOVE.accel) * dt;
      if (dv.length() <= step) vel.copy(desired);
      else vel.addScaledVector(dv.normalize(), step);
    } else {
      // 키를 떼면 감속해서 멈춤
      const speed = vel.length();
      const next = Math.max(0, speed - MOVE.decel * dt);
      if (speed > 0) vel.multiplyScalar(next / speed);
    }

    // 2) 이동 + 방 벽 충돌 (벽에 닿으면 그 방향 속도만 0)
    const p = camera.position;
    p.x += vel.x * dt;
    p.z += vel.z * dt;
    const lx = ROOM.width / 2 - MOVE.radius;
    const lz = ROOM.depth / 2 - MOVE.radius;
    if (p.x > lx || p.x < -lx) { p.x = THREE.MathUtils.clamp(p.x, -lx, lx); vel.x = 0; }
    if (p.z > lz || p.z < -lz) { p.z = THREE.MathUtils.clamp(p.z, -lz, lz); vel.z = 0; }
  }

  function speed() {
    return vel.length();
  }

  // 지금 속도에서 사격하면 더해지는 탄 퍼짐 (도, 지름 기준)
  function moveSpread() {
    const ratio = speed() / MOVE.runSpeed;
    if (ratio < MOVE.accurateBelow) return 0;
    if (ratio <= MOVE.walkRatio) {
      return MOVE.spreadWalk * (ratio - MOVE.accurateBelow) / (MOVE.walkRatio - MOVE.accurateBelow);
    }
    const t = Math.min(1, (ratio - MOVE.walkRatio) / (1 - MOVE.walkRatio));
    return MOVE.spreadWalk + (MOVE.spreadRun - MOVE.spreadWalk) * t;
  }

  function accurate() {
    return speed() / MOVE.runSpeed < MOVE.accurateBelow;
  }

  return { update, reset, setEnabled, speed, moveSpread, accurate, get keys() { return keys; } };
}
