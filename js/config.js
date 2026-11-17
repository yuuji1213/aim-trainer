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

// ── 3단계: 플릭 모드 ──────────────────────────────
export const FLICK = {
  targetCount: 3,   // 동시에 서 있는 표적 수
  duration: 60,     // 제한 시간 (초)
  countdown: 3,     // 시작 전 카운트다운 (초)
  // 표적이 생기는 범위 (m). 거리는 고정, 좌우 위치만 랜덤
  // (거리·높이가 다른 계단식 배치는 추후 별도 모드로)
  spawn: { xMin: -5, xMax: 5, z: -10 },
  // 표적끼리 겹쳐 보이지 않게, 플레이어 기준 좌우 각도가 이만큼은 떨어지게 (도)
  minAngleDeg: 6,
};

// 크로스헤어 (설정 화면은 4단계에서 추가, 지금은 여기서만 변경)
export const CROSSHAIR = {
  color: '#00ffaa',
  length: 6,     // 선 길이 (px)
  thickness: 2,  // 선 두께 (px)
  gap: 4,        // 중앙에서 선까지 간격 (px)
  centerDot: false,
  outline: true, // 검은 테두리
};

// ── 6단계: 반동·탄 퍼짐 ──
// 라이엇은 발별 반동 수치를 공개하지 않음 → 사용자 참고 이미지의 '7자' 모양을 따라 만든 자체 설계값
export const RECOIL = {
  // n발째 총알이 조준점에서 벗어나는 위치 [좌우, 위아래] (도, + = 오른쪽/위)
  //  0~10발: 살짝 오른쪽으로 기울며 위로 상승 (7의 세로획)
  // 11~18발: 왼쪽으로 쓸고 감 (7의 윗변)
  // 19~24발: 다시 오른쪽으로
  pattern: [
    [0, 0], [0.02, 0.25], [0.05, 0.6], [0.08, 1.0], [0.12, 1.45], [0.18, 1.9],
    [0.25, 2.35], [0.33, 2.8], [0.42, 3.2], [0.5, 3.55], [0.55, 3.8],
    [0.45, 3.95], [0.2, 4.0], [-0.1, 4.05], [-0.4, 4.0], [-0.7, 4.1],
    [-1.0, 4.05], [-1.3, 4.1], [-1.55, 4.15],
    [-1.3, 4.2], [-1.0, 4.15], [-0.7, 4.2], [-0.4, 4.25], [-0.1, 4.2], [0.2, 4.25],
  ],
  // 무한 탄창이라 25발을 넘기면, 이 번호 이후 구간(윗변)을 왕복
  loopFrom: 12,
  // 화면이 반동을 따라가는 비율. 1 = 크로스헤어가 총알 자리로 같이 올라감, 0 = 화면 고정
  // 공식 무기 정보상 '반동에 따른 조준점 이동'은 정조준에만 있음 → 비조준은 0 (정조준 단계에서 따로 1 적용)
  viewFollow: 0,
  viewSmooth: 30, // 화면이 따라가는 부드러움 (클수록 즉각)
  // 탄 퍼짐 (도, 원뿔 지름 기준 — 실제 흩어짐 반지름은 이 값의 절반)
  spreadFirst: 0.25,
  spreadPerShot: 0.1,
  spreadMax: 1.0,
  // 회복 시간 (초): 마지막 발사부터 반동이 0으로 돌아오기까지
  // 출처가 있는 값은 Liquipedia 패치 내역의 '반동 회복 0.375초' 하나뿐이라 연사 길이와 관계없이 0.375초 적용
  // (예전 값 1.3초는 팬 제작 연습기의 재구성값). 긴 연사를 더 느리게 하려면 recoverFull만 키우면 됨
  recoverTap: 0.375,
  recoverFull: 0.375,
  fullSprayShots: 25,
};

// ── 6단계: 총알 궤적·탄흔 ──
export const EFFECTS = {
  tracerMs: 50,        // 궤적이 보이는 시간
  tracerColor: 0xffe39a,
  decalSize: 0.12,     // 탄흔 크기 (m)
  decalLifeMs: 4000,   // 탄흔이 남아 있는 시간
  decalMax: 80,        // 동시에 남는 최대 개수
  missDistance: 100,   // 아무것도 안 맞았을 때 궤적 길이 (m)
};

// ── 7단계: 이동 ──
export const MOVE = {
  runSpeed: 5.4,      // m/s — 게임 내 공식 무기 정보 (밴달 달리기 속도)
  walkRatio: 0.61,    // Shift 걷기 = 달리기의 61% — 라이엇 디자이너 측정 글(2020)
  // 감속 (m/s²): 라이엇 측정 '달리기 → 완전 정지 약 0.17초'에 맞춘 값 (5.4 ÷ 0.17 ≈ 32)
  // 반대 키(카운터 스트레이프)도 측정상 0.166초로 거의 같아서 같은 값 사용
  decel: 32,
  // 가속 (m/s²): 출처 없음 → 임시값 (정지 → 최고 속도 약 0.2초). 체감으로 조정
  accel: 27,
  // 사격 정확도: 달리기 속도의 27.5% 미만이면 정확 (Gamepur·ValTrainer·Juked 일치)
  accurateBelow: 0.275,
  // 이동 중 추가 탄 퍼짐 (도, 탄 퍼짐과 같은 지름 기준): 걷기 +3, 달리기 +6 (팬 연습기 2곳 일치)
  // 정확 기준 ~ 걷기 속도 사이, 걷기 ~ 달리기 사이는 비례해서 늘어남 (자체 설계)
  spreadWalk: 3,
  spreadRun: 6,
  radius: 0.3,        // 플레이어 몸 반지름 (벽 충돌용, m)
};
