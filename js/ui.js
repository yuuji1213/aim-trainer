// 크로스헤어와 HUD 표시
import { CROSSHAIR } from './config.js';

// config의 크로스헤어 설정을 CSS 변수로 적용
export function applyCrosshair(el, cfg = CROSSHAIR) {
  el.style.setProperty('--ch-color', cfg.color);
  el.style.setProperty('--ch-len', `${cfg.length}px`);
  el.style.setProperty('--ch-thick', `${cfg.thickness}px`);
  el.style.setProperty('--ch-gap', `${cfg.gap}px`);
  el.classList.toggle('with-dot', cfg.centerDot);
  el.classList.toggle('with-outline', cfg.outline);
}

const PART_LABEL = { head: '머리', body: '몸', legs: '다리' };

export function partLabel(part) {
  return PART_LABEL[part] ?? part;
}
