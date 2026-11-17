// 게임 전체에서 쓰는 상수. 수치 조정은 이 파일에서만 한다.

// 발로란트 yaw 값: 감도 1일 때 마우스 1카운트당 회전 각도(도)
export const VALORANT_YAW = 0.07;

// 감도 입력 범위와 기본값 (기본값은 임시)
export const SENS_MIN = 0.01;
export const SENS_MAX = 10;
export const SENS_DEFAULT = 0.4;

// 위아래 시점 제한 (도)
export const PITCH_LIMIT = 89;

// 시야각: 발로란트 16:9 기준 수평 103°
// Three.js PerspectiveCamera.fov는 수직 시야각이므로 환산해서 사용 (약 70.53°)
export const HORIZONTAL_FOV_16_9 = 103;
export const VERTICAL_FOV =
  2 * Math.atan(Math.tan((HORIZONTAL_FOV_16_9 * Math.PI) / 360) * (9 / 16)) * (180 / Math.PI);

// 플레이어 눈높이 (m)
export const EYE_HEIGHT = 1.6;

// 연습 방 크기 (m)
export const ROOM = {
  width: 40,
  depth: 40,
  height: 8,
};

// ── 2단계: 무기 / 표적 ──────────────────────────────

// 무기: 발로란트 밴달 기준 (거리별 데미지 감소 없음)
export const WEAPON = {
  name: 'Vandal',
  damage: { head: 160, body: 40, legs: 34 },
  fireRate: 9.75, // 초당 발수. 탭 사격이어도 이보다 빠르게는 못 쏘게 제한
};

// 표적 체력: 체력 100 + 중방어구 50
// 머리 1발(160) / 몸 4발(160) / 다리 5발(170)에 처치
export const TARGET_HP = 150;

// 사람형 표적 크기 (m, 임시값 — 플레이 테스트 후 조정)
// CapsuleGeometry(반지름, 직선부 길이): 전체 높이 = 직선부 + 반지름 × 2
export const TARGET_SHAPE = {
  legs: { radius: 0.1, length: 0.7, centerY: 0.45, offsetX: 0.12 }, // 높이 0 ~ 0.9
  body: { radius: 0.22, length: 0.3, centerY: 1.27 },               // 높이 0.9 ~ 1.64
  head: { radius: 0.13, centerY: 1.76 },                            // 높이 1.63 ~ 1.89
};

export const TARGET_COLOR = 0xd8d2c4;
export const HIT_FLASH_COLOR = 0xff3344;
export const HIT_FLASH_MS = 80;

// 2단계 테스트용 표적 위치 (정면 10m)와 처치 후 재등장 대기 시간
export const TEST_TARGET_POS = { x: 0, z: -10 };
export const RESPAWN_MS = 600;

// 크로스헤어 (설정 화면은 4단계에서 추가, 지금은 여기서만 변경)
export const CROSSHAIR = {
  color: '#00ffaa',
  length: 6,     // 선 길이 (px)
  thickness: 2,  // 선 두께 (px)
  gap: 4,        // 중앙에서 선까지 간격 (px)
  centerDot: false,
  outline: true, // 검은 테두리
};
