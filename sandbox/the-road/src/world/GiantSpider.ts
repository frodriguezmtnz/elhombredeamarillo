import * as THREE from 'three';

/**
 * GiantSpider — algo con demasiadas patas cruza la carretera.
 * 8 patas con zancada procedural, cuerpo que se balancea, ~3m de alto.
 */
export interface GiantSpiderResult {
  group: THREE.Group;
  /** anima las patas; `moving` = zancada rápida, false = quieto/inquieto */
  animate(dt: number, moving: boolean): void;
}

export function buildGiantSpider(): GiantSpiderResult {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: '#14100e', roughness: 0.9 });
  const dark2 = new THREE.MeshStandardMaterial({ color: '#1c1613', roughness: 0.85 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: '#c8b86a', fog: false });

  // cuerpo + abdomen + cabeza
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 10, 8), dark);
  body.position.y = 1.75;
  body.scale.set(1, 0.85, 1.15);
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), dark2);
  abdomen.position.set(0, 1.9, -1.15);
  abdomen.scale.set(1, 0.9, 1.2);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), dark);
  head.position.set(0, 1.62, 0.95);
  group.add(body, abdomen, head);

  for (let i = 0; i < 4; i++) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), eyeMaterial);
    eye.position.set((i % 2 === 0 ? -1 : 1) * (0.08 + Math.floor(i / 2) * 0.12), 1.72 + Math.floor(i / 2) * 0.1, 1.24);
    group.add(eye);
  }

  // 8 patas: grupo por pata con pivote en el cuerpo (dos segmentos)
  const legs: THREE.Group[] = [];
  const legGeometryUpper = new THREE.CylinderGeometry(0.05, 0.07, 1.5, 5);
  const legGeometryLower = new THREE.CylinderGeometry(0.03, 0.05, 1.5, 5);
  for (let i = 0; i < 8; i++) {
    const side = i < 4 ? 1 : -1;
    const slot = i % 4; // 0..3 de delante a atrás
    const leg = new THREE.Group();
    leg.position.set(side * 0.5, 1.75, 0.75 - slot * 0.5);
    const upper = new THREE.Mesh(legGeometryUpper, dark);
    upper.position.y = 0.55;
    upper.rotation.z = side * -1.1;
    const lower = new THREE.Mesh(legGeometryLower, dark2);
    lower.position.set(side * 0.62, 0.95, 0);
    lower.rotation.z = side * 1.25;
    leg.add(upper, lower);
    leg.rotation.y = (slot - 1.5) * 0.32 * (side > 0 ? 1 : -1);
    group.add(leg);
    legs.push(leg);
  }

  group.scale.setScalar(1.55); // ~3m de alto
  group.visible = false;

  let phase = 0;
  return {
    group,
    animate(dt: number, moving: boolean): void {
      phase += dt * (moving ? 11 : 2);
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const offset = i < 4 ? 0 : Math.PI; // trípode alternado
        const side = i < 4 ? 1 : -1;
        const slot = i % 4;
        const stride = moving ? Math.sin(phase + offset + slot * 0.9) * 0.3 : Math.sin(phase + i) * 0.04;
        leg.rotation.x = stride;
        leg.rotation.z = side * stride * 0.35;
      }
      body.position.y = 1.75 + (moving ? Math.abs(Math.sin(phase * 0.5)) * 0.08 : 0);
      abdomen.position.y = 1.9 + (moving ? Math.abs(Math.sin(phase * 0.5 + 1)) * 0.08 : 0);
    },
  };
}
