// 방, 조명, 카메라 생성
import * as THREE from 'three';
import { VERTICAL_FOV, EYE_HEIGHT, ROOM } from './config.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1d24);

  const camera = new THREE.PerspectiveCamera(
    VERTICAL_FOV,
    window.innerWidth / window.innerHeight,
    0.05,
    200
  );
  camera.rotation.order = 'YXZ'; // 좌우(yaw) 먼저, 그다음 위아래(pitch)
  camera.position.set(0, EYE_HEIGHT, 0);

  // 조명
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444455, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(5, 10, 3);
  scene.add(sun);

  const worldMeshes = buildRoom(scene);

  return { renderer, scene, camera, worldMeshes };
}

// 총알이 막히는 표면(바닥·벽) 목록을 돌려줌
function buildRoom(scene) {
  const { width, depth, height } = ROOM;
  const surfaces = [];

  // 바닥 + 격자
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color: 0x2a2e38 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  surfaces.push(floor);

  const grid = new THREE.GridHelper(width, width, 0x4a5262, 0x353b47);
  grid.position.y = 0.01;
  scene.add(grid);

  // 벽 4면: [이름, 위치, 회전, 길이, 방향 표시 색]
  // 각도 기준: 처음 보는 방향(-Z)이 0°, 오른쪽으로 돌수록 증가
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3f4b, side: THREE.DoubleSide });
  const walls = [
    ['front', [0, height / 2, -depth / 2], 0, width, 0xe0404c],
    ['right', [width / 2, height / 2, 0], -Math.PI / 2, depth, 0x3fbf6a],
    ['back', [0, height / 2, depth / 2], Math.PI, width, 0x3f7fe0],
    ['left', [-width / 2, height / 2, 0], Math.PI / 2, depth, 0xe0c040],
  ];

  for (const [, pos, rotY, len, markColor] of walls) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(len, height), wallMat);
    wall.position.set(...pos);
    wall.rotation.y = rotY;
    scene.add(wall);
    surfaces.push(wall);

    // 방향 확인용 세로 띠 (벽 중앙)
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, height),
      new THREE.MeshBasicMaterial({ color: markColor })
    );
    mark.position.copy(wall.position);
    mark.rotation.y = rotY;
    // 벽보다 살짝 안쪽으로 띄워서 겹침 깜빡임 방지
    mark.translateZ(0.02);
    scene.add(mark);
  }

  scene.updateMatrixWorld(true);
  return surfaces;
}

export function handleResize(renderer, camera) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
