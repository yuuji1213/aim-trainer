// 사격 효과: 총알 궤적(짧게 보이는 선), 탄흔(벽·바닥에 남는 자국)
import * as THREE from 'three';
import { EFFECTS } from './config.js';

export function createEffects(scene) {
  const tracers = [];
  const decals = [];

  const tracerMat = new THREE.LineBasicMaterial({
    color: EFFECTS.tracerColor,
    transparent: true,
    opacity: 0.9,
  });
  const decalGeo = new THREE.PlaneGeometry(EFFECTS.decalSize, EFFECTS.decalSize);
  const decalMatBase = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    polygonOffset: true,      // 벽과 겹쳐 깜빡이지 않게
    polygonOffsetFactor: -4,
  });

  function spawnTracer(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(geo, tracerMat.clone());
    scene.add(line);
    tracers.push({ line, life: EFFECTS.tracerMs / 1000 });
  }

  const _normal = new THREE.Vector3();
  function spawnDecal(point, worldNormal) {
    if (decals.length >= EFFECTS.decalMax) removeDecal(0);
    const mesh = new THREE.Mesh(decalGeo, decalMatBase.clone());
    _normal.copy(worldNormal).normalize();
    mesh.position.copy(point).addScaledVector(_normal, 0.005);
    mesh.lookAt(mesh.position.clone().add(_normal)); // 면이 벽 바깥을 보게
    mesh.rotation.z = Math.random() * Math.PI;
    scene.add(mesh);
    decals.push({ mesh, life: EFFECTS.decalLifeMs / 1000, total: EFFECTS.decalLifeMs / 1000 });
  }

  function removeDecal(i) {
    const d = decals[i];
    scene.remove(d.mesh);
    d.mesh.material.dispose();
    decals.splice(i, 1);
  }

  function update(dt) {
    for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i];
      t.life -= dt;
      t.line.material.opacity = Math.max(0, t.life / (EFFECTS.tracerMs / 1000)) * 0.9;
      if (t.life <= 0) {
        scene.remove(t.line);
        t.line.geometry.dispose();
        t.line.material.dispose();
        tracers.splice(i, 1);
      }
    }
    for (let i = decals.length - 1; i >= 0; i--) {
      const d = decals[i];
      d.life -= dt;
      // 마지막 1초 동안 서서히 사라짐
      d.mesh.material.opacity = Math.min(1, d.life) * 0.85;
      if (d.life <= 0) removeDecal(i);
    }
  }

  function clear() {
    while (decals.length) removeDecal(0);
  }

  return { spawnTracer, spawnDecal, update, clear };
}
