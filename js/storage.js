// localStorage 저장·불러오기 (최고 기록, 설정)
// 브라우저 설정에 따라 저장소를 못 쓸 수도 있어서 모든 접근을 try/catch로 감쌈

const KEY_BEST = 'aimTrainer.flick.best';
const KEY_SETTINGS = 'aimTrainer.settings';

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// 최고 기록: { kills, accuracy, headRate, avgKillMs, date }
export function loadBest() {
  return read(KEY_BEST);
}

// 처치 수가 더 높으면 저장하고 true 반환
export function saveIfBest(record) {
  const best = loadBest();
  if (best && best.kills >= record.kills) return false;
  write(KEY_BEST, record);
  return true;
}

// 설정: { sens }
export function loadSettings() {
  return read(KEY_SETTINGS) ?? {};
}

export function saveSettings(settings) {
  write(KEY_SETTINGS, { ...loadSettings(), ...settings });
}
