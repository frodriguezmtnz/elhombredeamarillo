import * as THREE from 'three';
import type { AssetManager } from '../core/AssetManager';
import type { RoadCurve } from './RoadCurve';

/**
 * Road — geometría estática de la carretera a partir de la curva.
 * - arcén ancho (grava oscura)
 * - asfalto con textura procedural
 * - líneas laterales continuas + dashes centrales instanciados
 * Todo comparte muy pocas draw calls.
 */

function buildRibbonGeometry(
  curve: RoadCurve,
  offsetA: number,
  offsetB: number,
  y: number,
  vScale: number,
): THREE.BufferGeometry {
  const count = curve.count;
  const positions = new Float32Array(count * 2 * 3);
  const uvs = new Float32Array(count * 2 * 2);
  const normals = new Float32Array(count * 2 * 3);
  const indices: number[] = [];
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };

  for (let i = 0; i < count; i++) {
    curve.at(i * curve.step, pose);
    const ax = pose.x + pose.nx * offsetA;
    const az = pose.z + pose.nz * offsetA;
    const bx = pose.x + pose.nx * offsetB;
    const bz = pose.z + pose.nz * offsetB;
    const vi = i * 2;
    positions.set([ax, y, az, bx, y, bz], vi * 3);
    normals.set([0, 1, 0, 0, 1, 0], vi * 3);
    const v = (i * curve.step) / vScale;
    uvs.set([0, v, 1, v], vi * 2);
    const ni = ((i + 1) % count) * 2;
    indices.push(vi, ni, vi + 1, vi + 1, ni, ni + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}

function buildAsphaltTexture(assets: AssetManager): THREE.Texture {
  return assets.canvasTexture('asphalt', 256, 256, (ctx) => {
    ctx.fillStyle = '#1d2023';
    ctx.fillRect(0, 0, 256, 256);
    // grano
    for (let i = 0; i < 5200; i++) {
      const shade = 20 + Math.random() * 46;
      ctx.fillStyle = `rgba(${shade},${shade + 2},${shade + 4},${0.16 + Math.random() * 0.2})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4);
    }
    // rodadas más oscuras
    ctx.fillStyle = 'rgba(10,12,13,0.35)';
    ctx.fillRect(58, 0, 34, 256);
    ctx.fillRect(164, 0, 34, 256);
    // grietas finas
    ctx.strokeStyle = 'rgba(8,9,10,0.5)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      let x = Math.random() * 256;
      let y = Math.random() * 256;
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        x += (Math.random() - 0.5) * 46;
        y += (Math.random() - 0.5) * 46;
        ctx.lineTo(x, y);
      }
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  });
}

export interface RoadBuildResult {
  group: THREE.Group;
  /** meshes que proyectan sombra (para excluir en LOW) */
  setShadows(enabled: boolean): void;
}

export function buildRoad(curve: RoadCurve, assets: AssetManager): RoadBuildResult {
  const group = new THREE.Group();

  // arcén
  const shoulder = new THREE.Mesh(
    buildRibbonGeometry(curve, 5.6, -5.6, 0.008, 8),
    new THREE.MeshStandardMaterial({ color: '#20221c', roughness: 1, metalness: 0 }),
  );
  shoulder.receiveShadow = true;

  // asfalto
  const asphaltTexture = buildAsphaltTexture(assets);
  asphaltTexture.wrapS = THREE.RepeatWrapping;
  asphaltTexture.wrapT = THREE.RepeatWrapping;
  const asphalt = new THREE.Mesh(
    buildRibbonGeometry(curve, 3.5, -3.5, 0.02, 6),
    new THREE.MeshStandardMaterial({
      map: asphaltTexture,
      roughness: 0.44,
      metalness: 0.06,
      color: '#b8bcc2',
    }),
  );
  asphalt.receiveShadow = true;

  // líneas laterales (pintura desgastada)
  const lineMaterial = new THREE.MeshStandardMaterial({ color: '#8f958a', roughness: 0.55, metalness: 0 });
  const lineLeft = new THREE.Mesh(buildRibbonGeometry(curve, 3.14, 3.0, 0.034, 6), lineMaterial);
  const lineRight = new THREE.Mesh(buildRibbonGeometry(curve, -3.0, -3.14, 0.034, 6), lineMaterial);

  // dashes centrales instanciados
  const dashSpacing = 9;
  const dashCount = Math.floor(curve.length / dashSpacing);
  const dashGeometry = new THREE.PlaneGeometry(0.13, 2.3);
  dashGeometry.rotateX(-Math.PI / 2);
  const dashes = new THREE.InstancedMesh(dashGeometry, lineMaterial, dashCount);
  const pose = { x: 0, z: 0, tx: 0, tz: 0, nx: 0, nz: 0 };
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const scaleOne = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < dashCount; i++) {
    curve.at(i * dashSpacing, pose);
    quat.setFromAxisAngle(up, Math.atan2(pose.tx, pose.tz));
    matrix.compose(new THREE.Vector3(pose.x, 0.031, pose.z), quat, scaleOne);
    dashes.setMatrixAt(i, matrix);
  }

  group.add(shoulder, asphalt, lineLeft, lineRight, dashes);

  return {
    group,
    setShadows(enabled: boolean): void {
      shoulder.receiveShadow = enabled;
      asphalt.receiveShadow = enabled;
    },
  };
}
