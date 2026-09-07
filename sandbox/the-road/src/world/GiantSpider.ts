import * as THREE from 'three';

/**
 * GiantSpider — algo con demasiadas patas.
 * v2: aparece PARADA en medio de la calzada, quieta, mirándote;
 * al acercarte se agacha y dispara hacia el bosque.
 * 8 patas con zancada procedural, ~3.4m de alto, ojos ámbar grandes.
 */
export interface GiantSpiderResult {
  group: THREE.Group;
  /** gait: 'idle' = inquieta quieta, 'walk' = zancada normal, 'dash' = sprint agachada */
  animate(dt: number, gait: 'idle' | 'walk' | 'dash'): void;
}

export function buildGiantSpider(): GiantSpiderResult {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: '#14100e', roughness: 0.9 });
  const dark2 = new THREE.MeshStandardMaterial({ color: '#1c1613', roughness: 0.85 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#ffd76a', fog: false });

  // cuerpo + abdomen voluminoso + cabeza
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), dark);
  body.position.y = 1.8;
  body.scale.set(1, 0.85, 1.15);
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(1.08, 10, 8), dark2);
  abdomen.position.set(0, 2.0, -1.25);
  abdomen.scale.set(1, 0.95, 1.25);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), dark);
  head.position.set(0, 1.66, 1.0);
  group.add(body, abdomen, head);

  // ojos: racimo grande y brillante (rebota con las luces largas)
  for (let i = 0; i < 6; i++) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 6, 5), eyeMaterial);
    eye.position.set((i % 2 === 0 ? -1 : 1) * (0.09 + Math.floor(i / 2) * 0.14), 1.76 + Math.floor(i / 2) * 0.12, 1.3);
    group.add(eye);
  }

  // quelíceros (colmillos) — silueta más "wrong"
  for (const x of [-0.12, 0.12]) {
    const fang = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 5), dark);
    fang.position.set(x, 1.5, 1.25);
    fang.rotation.x = Math.PI;
    group.add(fang);
  }

  // 8 patas: más largas y finas, pivote en el cuerpo
  const legs: THREE.Group[] = [];
  const legGeometryUpper = new THREE.CylinderGeometry(0.038, 0.055, 1.75, 5);
  const legGeometryLower = new THREE.CylinderGeometry(0.024, 0.038, 1.8, 5);
  for (let i = 0; i < 8; i++) {
    const side = i < 4 ? 1 : -1;
    const slot = i % 4;
    const leg = new THREE.Group();
    leg.position.set(side * 0.48, 1.8, 0.85 - slot * 0.55);
    const upper = new THREE.Mesh(legGeometryUpper, dark);
    upper.position.y = 0.62;
    upper.rotation.z = side * -1.15;
    const lower = new THREE.Mesh(legGeometryLower, dark2);
    lower.position.set(side * 0.7, 1.05, 0);
    lower.rotation.z = side * 1.3;
    leg.add(upper, lower);
    leg.rotation.y = (slot - 1.5) * 0.3 * (side > 0 ? 1 : -1);
    group.add(leg);
    legs.push(leg);
  }

  group.scale.setScalar(1.7); // ~3.4m de alto
  group.visible = false;

  let phase = 0;
  return {
    group,
    animate(dt: number, gait: 'idle' | 'walk' | 'dash'): void {
      const speed = gait === 'dash' ? 17 : gait === 'walk' ? 8 : 2;
      const amp = gait === 'dash' ? 0.5 : gait === 'walk' ? 0.3 : 0.05;
      phase += dt * speed;
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const offset = i < 4 ? 0 : Math.PI;
        const side = i < 4 ? 1 : -1;
        const slot = i % 4;
        const stride = Math.sin(phase + offset + slot * 0.9) * amp;
        leg.rotation.x = stride;
        leg.rotation.z = side * stride * 0.35;
      }
      const bob = gait === 'dash' ? 0.14 : gait === 'walk' ? 0.08 : 0.02;
      body.position.y = 1.8 + Math.abs(Math.sin(phase * 0.5)) * bob;
      abdomen.position.y = 2.0 + Math.abs(Math.sin(phase * 0.5 + 1)) * bob;
    },
  };
}
