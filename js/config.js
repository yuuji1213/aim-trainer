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
