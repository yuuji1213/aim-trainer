// 사람형 표적: 생성, 배치, 부위별 데미지 판정
// 언제 어디에 다시 세울지는 game.js가 정한다
import * as THREE from 'three';
import {
  TARGET_HP,
  TARGET_SHAPE,
  TARGET_COLOR,
  HIT_FLASH_COLOR,
  HIT_FLASH_MS,
  WEAPON,
} from './config.js';

// 부위 하나 = 메시 하나. userData.part로 머리/몸/다리를 구분
function makePart(geometry, part, x, y) {
  const material = new THREE.MeshStandardMaterial({
    color: TARGET_COLOR,
    emissive: 0x000000,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  mesh.userData.part = part;
  return mesh;
}

// 처음에는 숨긴 상태로 만든다. placeTarget으로 세워야 보임
export function createTarget(scene) {
  const { legs, body, head } = TARGET_SHAPE;
  const group = new THREE.Group();

  const legGeo = new THREE.CapsuleGeometry(legs.radius, legs.length, 4, 12);
  group.add(makePart(legGeo, 'legs', -legs.offsetX, legs.centerY));
  group.add(makePart(legGeo, 'legs', legs.offsetX, legs.centerY));

  group.add(makePart(new THREE.CapsuleGeometry(body.radius, body.length, 4, 16), 'body', 0, body.centerY));
  group.add(makePart(new THREE.SphereGeometry(head.radius, 20, 16), 'head', 0, head.centerY));

  group.visible = false;
  scene.add(group);

  return {
    group,
    meshes: group.children,
    hp: TARGET_HP,
    alive: false,
    spawnedAt: 0, // game.js의 게임 시계 기준 (초)
  };
}

// 지정 위치에 체력을 채워서 세운다
export function placeTarget(target, x, z) {
  target.group.position.set(x, 0, z);
  // 표적이 항상 플레이어(원점)를 바라보게
  target.group.rotation.y = Math.atan2(-x, -z);
  target.hp = TARGET_HP;
  target.alive = true;
  target.group.visible = true;
  target.meshes.forEach((m) => m.material.emissive.setHex(0x000000));
  // 다음 화면을 그리기 전에 쏴도 새 위치로 판정되게 즉시 갱신
  target.group.updateMatrixWorld(true);
}

export function hideTarget(target) {
  target.alive = false;
  target.group.visible = false;
}

// 맞은 부위를 잠깐 빨갛게
function flash(mesh) {
  mesh.material.emissive.setHex(HIT_FLASH_COLOR);
  setTimeout(() => mesh.material.emissive.setHex(0x000000), HIT_FLASH_MS);
}

// 화면 중앙에서 광선을 쏴서 맞은 부위를 찾고 데미지 적용
// 반환값: { hit: false } 또는 { hit: true, target, part, damage, killed, hpLeft }
const raycaster = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0);

export function shootAt(camera, targets) {
  raycaster.setFromCamera(CENTER, camera);

  const meshes = [];
  for (const t of targets) if (t.alive) meshes.push(...t.meshes);

  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length === 0) return { hit: false };

  const mesh = hits[0].object;
  const part = mesh.userData.part;
  const target = targets.find((t) => t.meshes.includes(mesh));
  const damage = WEAPON.damage[part];

  target.hp -= damage;
  flash(mesh);

  const killed = target.hp <= 0;
  if (killed) target.alive = false;

  return { hit: true, target, part, damage, killed, hpLeft: Math.max(0, target.hp) };
}
