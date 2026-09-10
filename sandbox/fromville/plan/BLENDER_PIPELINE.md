# BLENDER PIPELINE — FROMVILLE

> Pipeline de assets 3D con Blender + MCP. **El MCP está instalado y validado end-to-end**
> (2026-09-10). Depende de `FROMVILLE_PLAN.md`. Complementos: `WORLD_DESIGN.md`, `PERFORMANCE.md`,
> `VISUAL_DIRECTION.md`.

---

## 1. Qué se instaló (y qué NO)

**Usamos la extensión OFICIAL de Blender Lab**, no el addon de terceros `ahujasid/blender-mcp`.
Son proyectos distintos con protocolos incompatibles (aunque ambos usen el puerto 9876).

| Componente | Qué es | Estado |
|---|---|---|
| Blender | **5.2** en `C:\Program Files\Blender Foundation\Blender 5.2` | ✅ |
| Add-on | Extensión oficial **`mcp`** (lab.blender.org), id `mcp`, min Blender 5.1 | ✅ instalado |
| Servidor MCP | `blender-mcp v1.30.0` (Python, desde git `lab/blender_mcp`, subcarpeta `mcp`) | ✅ compila y responde |
| Cliente | OpenCode (`mcp.blender` en config global) | ✅ config correcta (requiere reinicio) |

**Comando de instalación del add-on (ya hecho):** la extensión oficial se instala arrastrando el
zip de release o *Install from Disk* desde `https://projects.blender.org/lab/blender_mcp`.

> ⚠️ Trampa detectada: `uvx blender-mcp` "a secas" instala el paquete de **PyPI (ahujasid)**, que es
> OTRO proyecto. El oficial se lanza **desde git** (ver §3).

---

## 2. Arquitectura del MCP oficial

```
MCP Client (OpenCode)  ⇐ stdio/JSON-RPC ⇐  blender-mcp (servidor)  ⇐ TCP:9876 ⇐  Add-on en Blender
```

El add-on corre un **socket bridge** no-bloqueante dentro de Blender (JSON delimitado por byte
nulo, ejecuta Python `bpy`). El servidor MCP expone tools y reenvía al bridge.

**Tools expuestas (oficial, minimalista):** `execute_blender_code`, `execute_blender_code_for_cli`,
`get_blendfile_summary_datablocks` (+ variantes `_for_cli`), y utilidades de escena. **NO trae**
Poly Haven / Sketchfab / Hyper3D (eso era del addon de ahujasid). Para assets usaremos la librería
de Blender + export GLB (§6). Referencia de API/manual incluida en el paquete (`data/api`, `data/manual`).

---

## 3. Config OpenCode (validada)

En `~/.config/opencode/opencode.json` (o `opencode.json` del repo para scope de proyecto):

```json
"mcp": {
  "blender": {
    "type": "local",
    "command": [
      "C:\\Users\\FelipeRodriguezMarti\\.local\\bin\\uvx.exe",
      "--python", "3.11",
      "--from", "git+https://projects.blender.org/lab/blender_mcp.git@main#subdirectory=mcp",
      "blender-mcp"
    ],
    "enabled": true,
    "environment": {
      "BLENDER_MCP_HOST": "localhost",
      "BLENDER_MCP_PORT": "9876",
      "UV_PYTHON_PREFERENCE": "only-managed"
    }
  }
}
```

Notas:
- `--from git+...#subdirectory=mcp` → instala el **oficial** desde el repo (no PyPI).
- `--python 3.11` + `only-managed` → usa el CPython gestionado por uv (ya descargado: 3.11.14).
- Ruta absoluta de `uvx.exe` → evita `spawn uvx ENOENT` en clientes GUI.
- Tras editar, **reiniciar OpenCode** (la config no se recarga en caliente).

**Puesta en marcha (orden):** 1) Blender con *Online Access* activado y el add-on con *"Start MCP
Bridge Server"* (puerto 9876 en LISTENING); 2) OpenCode reiniciado.

---

## 4. Validación realizada (evidencia)

Prueba por CLI (sin GUI) que se ejecutó y pasó:

- `uvx --from git+... blender-mcp` → clonó y compiló sin errores.
- Handshake `initialize` → `serverInfo: blender-mcp v1.30.0` + instrucciones del servidor.
- `tools/list` → devolvió las tools reales.
- `tools/call get_blendfile_summary_datablocks` → **datos vivos** del Blender del usuario:
  `objects:3, meshes:1, materials:2, cameras:1, lights:1`, motor `BLENDER_EEVEE`, escena `Scene`.

Cadena completa **OpenCode→servidor→TCP→Blender** confirmada operativa.

---

## 5. Qué se modela en Blender (kits modulares)

Coherente con `WORLD_DESIGN.md §9`. El agente puede pedir por MCP, p. ej.:

> *"Crea 5 variaciones de casa de madera abandonada, low-poly, UV empaquetadas, un solo material."*
> *"Genera un tramo modular de carretera con acera, farola y marcas."*
> *"Claro de bosque con cabaña y 3 variantes de pino."*

Kits: `House_A/B/C`, `Road_*`, `Fence_*`, `Tree_*`, `Rock_*`, `Lamp_*`, `InteriorRoom_*`, `Prop_*`,
y la **criatura** (§7). Cada pieza: origen en el suelo, escala métrica (1 u = 1 m), nombres limpios.

**Handcrafted vs procedural** (validando la hipótesis del brief):
- **Handcrafted (Blender):** hero locations (casa refugio, iglesia, sheriff, Den, criatura), props
  narrativos, interiores con lightmap.
- **Procedural/modular:** bosque, carretera, rocas, farolas, vegetación, colocación por seed.

---

## 6. Export y optimización (GLB → Three)

Pipeline por asset:

```
Blender (MCP/modelado) → export glTF 2.0 (.glb) → optimización → public/assets/
```

- **Export:** glTF 2.0 (addon `gltf` ya activo en Blender). Aplicar transforms, -Y up, coleccionar
  por prefab. Texturas incrustadas o por carpeta.
- **Optimización CLI:** `gltf-transform` o `gltfpack`:
  - Geometría: **Draco** o **meshopt** (quantize).
  - Texturas: **KTX2 / Basis** (`toktx`/`gltf-transform ktx2`) con mipmaps; tamaños POT.
  - Reducir materiales, fusionar donde se pueda, limpiar nodos vacíos.
- **Runtime:** `GLTFLoader` + `DRACOLoader`/`MeshoptDecoder` + `KTX2Loader` en Three.js
  (ver `TECH_ARCHITECTURE.md §6`).
- **Presupuestos:** ver `PERFORMANCE.md` (tris/draw calls/texturas por prefab).

**Lightmaps de interiores:** hornear en Blender (bake) → textura de luz → aplicar en Three como
mapa. Mezcla con luz dinámica solo para jugador/criatura (`VISUAL_DIRECTION.md §4`).

---

## 7. Criaturas

Modelar/retopologizar "The Hollow" en Blender (silueta humanoide, proporciones incorrectas).
Rig **mínimo** (huesos para el "movimiento a saltos" de `AI.md §2`). Export con anims o poses
sueltas. Presupuesto estricto (es lo único con skinning en escena).

---

## 8. Seguridad (innegociable)

- `execute_blender_code` ejecuta **Python arbitrario** en tu Blender. El oficial **no** tiene el
  `SAFE_MODE` de ahujasid. Mitigaciones:
  - **Guardar el `.blend` a menudo** y trabajar en una copia del proyecto, nunca en archivos
    importantes abiertos.
  - Tener **Online Access** solo cuando toque (lo activa el bridge).
  - Ideal: sesión de Blender dedicada al juego, sin otros .blend abiertos.
- El servidor MCP solo escucha en `localhost`. No exponer el puerto 9876 a la red.
- Telemetría: el oficial no envía telemetría de LLM; el modelo (OpenCode) sí puede. Revisar provider.

---

## 9. Riesgos / OPEN DECISIONS

- **Blender 5.2 es muy nuevo.** La extensión oficial pide 5.1+, así que hay soporte, pero si una
  versión del add-on falla, fallback: modelar a mano + export GLB sin MCP (el pipeline §6 sigue igual).
- **Sin integraciones de assets externos** (Poly Haven etc.) en el oficial: para HDRIs/materiales
  usar la librería local o descarga manual. Registrado en `OPEN_DECISIONS.md`.
