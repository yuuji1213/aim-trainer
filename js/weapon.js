// 무기: 탭/연사 발사 타이밍, 오리지널 총 모델(뷰모델), 발사 모션
// 성능은 밴달 수치(config.js WEAPON), 모양은 도형으로 만든 오리지널 디자인
// 무한 탄창: 탄 수·재장전 없음
import * as THREE from 'three';
import { WEAPON } from './config.js';

const SHOT_INTERVAL = 1 / WEAPON.fireRate; // 초

// ── 총 모델 ──
// 맵과 따로 그리는 전용 장면/카메라에 둔다 → 벽에 가까이 가도 총이 파묻히지 않음
function buildModel() {
  const body = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.6, metalness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.5, metalness: 0.5 });
  const grey = new THREE.MeshStandardMaterial({ color: 0x454c57, roughness: 0.7 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x00c98a, roughness: 0.4, emissive: 0x003322 });

  const g = new THREE.Group();
  const box = (w, h, d, mat, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.x = rx;
    g.add(m);
    return m;
  };

  box(0.07, 0.09, 0.40, body, 0, 0, 0);            // 몸통
  box(0.062, 0.065, 0.20, grey, 0, 0.004, -0.29);   // 총열 덮개
  box(0.03, 0.018, 0.22, dark, 0, 0.054, -0.04);    // 위쪽 레일
  box(0.072, 0.012, 0.16, accent, 0, -0.02, -0.02); // 옆 줄무늬 (포인트 색)
  box(0.05, 0.075, 0.17, body, 0, -0.012, 0.28);    // 개머리판
  box(0.04, 0.10, 0.05, dark, 0, -0.085, 0.09, -0.3); // 손잡이
  box(0.045, 0.13, 0.07, dark, 0, -0.105, -0.07);   // 탄창 (곧은 상자형)

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 12), dark);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.012, -0.47);
  g.add(barrel);

  // 총구 섬광 (발사 순간에만 잠깐 보임)
  const flash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.09, 0.09),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, depthWrite: false })
  );
  flash.position.set(0, 0.012, -0.56);
  flash.visible = false;
  g.add(flash);

  return { group: g, flash };
}

export function createWeapon() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1.4));
  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(1, 2, 1);
  scene.add(light);

  // 총 전용 카메라: 원점에 고정, 정면(-Z)을 봄
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10);

  const { group, flash } = buildModel();
  // 화면 오른쪽 아래, 총구가 살짝 화면 가운데를 향하게
  const BASE = { x: 0.24, y: -0.23, z: -0.55 };
  group.position.set(BASE.x, BASE.y, BASE.z);
  group.rotation.y = 0.06;
  group.scale.setScalar(0.85);
  scene.add(group);

  // ── 발사 타이밍 ──
  let clock = 0;          // 무기 시계 (초)
  let nextShotAt = 0;     // 다음 발사가 가능한 시각
  let held = false;       // 방아쇠를 누르고 있는지
  let kick = 0;           // 발사 모션 크기 (뒤로 밀림)
  let flashLeft = 0;      // 총구 섬광 남은 시간
  let canFire = () => true;
  const fireListeners = [];

  function fire() {
    kick = 0.035;
    flashLeft = 0.04;
    flash.rotation.z = Math.random() * Math.PI;
    fireListeners.forEach((fn) => fn());
  }

  // 누르는 순간: 쏠 수 있으면 즉시 1발 (탭)
  function triggerDown() {
    held = true;
    if (canFire() && clock >= nextShotAt) {
      fire();
      nextShotAt = clock + SHOT_INTERVAL;
    }
  }

  function triggerUp() {
    held = false;
  }

  function update(dt) {
    clock += dt;

    // 누르고 있으면 초당 9.75발 간격으로 연사
    if (held && canFire()) {
      // 일시정지 등으로 오래 밀렸으면 한꺼번에 몰아 쏘지 않게
      if (nextShotAt < clock - SHOT_INTERVAL) nextShotAt = clock;
      while (clock >= nextShotAt) {
        fire();
        nextShotAt += SHOT_INTERVAL;
      }
    }

    // 발사 모션 회복
    kick *= Math.exp(-dt * 22);
    group.position.z = BASE.z + kick;
    group.rotation.x = kick * 1.2;

    flashLeft -= dt;
    flash.visible = flashLeft > 0;
  }

  function render(renderer) {
    renderer.clearDepth();
    renderer.render(scene, camera);
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  return {
    triggerDown,
    triggerUp,
    update,
    render,
    resize,
    setCanFire: (fn) => { canFire = fn; },
    onFire: (fn) => fireListeners.push(fn),
  };
}
