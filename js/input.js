// 포인터 락 + 발로란트 감도 공식으로 시점 회전
import { VALORANT_YAW, PITCH_LIMIT, WEAPON } from './config.js';

const MIN_SHOT_INTERVAL_MS = 1000 / WEAPON.fireRate; // 밴달 연사 속도보다 빠르게는 못 쏨

export function createInput(canvas) {
  const state = {
    sens: 0.4,
    yaw: 0,      // 도 단위. 0 = 처음 바라보는 방향
    pitch: 0,    // 도 단위. + = 위
    locked: false,
    raw: null,   // true: 원시 입력 확인됨 / false: 미지원 / null: 확인 불가
  };

  const listeners = { lockChange: [], shoot: [] };
  let lastShotAt = -Infinity;

  // 포인터 락 요청: 원시 입력(unadjustedMovement)을 먼저 시도하고, 안 되면 일반 방식
  async function requestLock() {
    try {
      const result = canvas.requestPointerLock({ unadjustedMovement: true });
      if (result && typeof result.then === 'function') {
        await result;
        state.raw = true;
      } else {
        // Promise를 돌려주지 않는 브라우저: 옵션 지원 여부를 알 수 없음
        state.raw = null;
      }
    } catch (err) {
      // 원시 입력 미지원 → 일반 포인터 락으로 재시도
      try {
        const fallback = canvas.requestPointerLock();
        if (fallback && typeof fallback.then === 'function') await fallback;
        state.raw = false;
      } catch (err2) {
        // ESC로 나온 직후 바로 다시 누르면 브라우저가 잠깐 거부함
        console.warn('포인터 락 실패:', err2);
        return false;
      }
    }
    return true;
  }

  document.addEventListener('pointerlockchange', () => {
    state.locked = document.pointerLockElement === canvas;
    listeners.lockChange.forEach((fn) => fn(state.locked));
  });

  document.addEventListener('mousemove', (e) => {
    if (!state.locked) return;
    const degPerCount = state.sens * VALORANT_YAW;
    state.yaw += e.movementX * degPerCount;   // 오른쪽으로 움직이면 각도 증가
    state.pitch -= e.movementY * degPerCount; // 위로 움직이면 위를 봄
    state.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, state.pitch));
  });

  // 좌클릭 = 1발 (탭 사격). 누르고 있어도 연사되지 않음
  document.addEventListener('mousedown', (e) => {
    if (!state.locked || e.button !== 0) return;
    const now = performance.now();
    if (now - lastShotAt < MIN_SHOT_INTERVAL_MS) return;
    lastShotAt = now;
    listeners.shoot.forEach((fn) => fn());
  });

  // 카메라에 현재 시점 적용 (Three.js 회전은 라디안, 오른쪽 회전 = -Y)
  function applyTo(camera) {
    camera.rotation.y = -state.yaw * (Math.PI / 180);
    camera.rotation.x = state.pitch * (Math.PI / 180);
  }

  // HUD 표시용: 0 ~ 360 범위로 정리한 yaw
  function normalizedYaw() {
    return ((state.yaw % 360) + 360) % 360;
  }

  return {
    state,
    requestLock,
    applyTo,
    normalizedYaw,
    onLockChange: (fn) => listeners.lockChange.push(fn),
    onShoot: (fn) => listeners.shoot.push(fn),
  };
}
