import * as THREE from "three";
import chroma from "chroma-js";

type UniformValue<T> = { value: T };

type WaveConfig = {
  nx: number;
  ny: number;
  cscale: any;
  darken: number;
  angle: number;
  timeCoef: number;
};

const conf: WaveConfig = {
  nx: 40,
  ny: 100,
  cscale: chroma
    .scale(["#2175D8", "#7DBCB8", "#456A8A", "#20C584", "#2175D8", "#2175D8"])
    .mode("lch"),
  darken: -1,
  angle: Math.PI / 3,
  timeCoef: 0.1,
};

const rnd = (min: number, max: number): number =>
  THREE.MathUtils.randFloat(min, max);

const uTime: UniformValue<number> = { value: 0 };
const uTimeCoef: UniformValue<number> = { value: conf.timeCoef };
const TITLE_TEXT = "StarDalur";
const TITLE_FONT_FAMILY = '"Racing Sans One", sans-serif';
const TITLE_HORIZONTAL_PADDING = 0.04;
const TITLE_VERTICAL_CENTER = 0.47;

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let animationFrameId = 0;
let initialized = false;
let displayCanvasRef: HTMLCanvasElement | null = null;
let displayContext: CanvasRenderingContext2D | null = null;
let resizeObserver: ResizeObserver | null = null;
let canvasWidth = 1;
let canvasHeight = 1;
let titleFontSize = 16;
let titleX = 0;
let titleY = 0;

const vertexShader = `
uniform float uTime, uTimeCoef;
uniform float uSize;
uniform mat2 uMat2;
uniform vec3 uRnd1;
uniform vec3 uRnd2;
uniform vec3 uRnd3;
uniform vec3 uRnd4;
uniform vec3 uRnd5;
attribute vec3 next, prev;
attribute float side;
varying vec2 vUv;

vec2 dp(vec2 sv) {
  return (1.5 * sv * uMat2);
}

void main() {
  vUv = uv;

  vec2 pos = dp(position.xy);
  vec2 normal = dp(vec2(1, 0));
  normal *= uSize;

  float time = uTime * uTimeCoef;
  vec3 rnd1 = vec3(cos(time * uRnd1.x + uRnd3.x), cos(time * uRnd1.y + uRnd3.y), cos(time * uRnd1.z + uRnd3.z));
  vec3 rnd2 = vec3(cos(time * uRnd2.x + uRnd4.x), cos(time * uRnd2.y + uRnd4.y), cos(time * uRnd2.z + uRnd4.z));
  normal *= 1.0
    + uRnd5.x * (cos((position.y + rnd1.x) * 20.0 * rnd1.y) + 1.0)
    + uRnd5.y * (sin((position.y + rnd2.x) * 20.0 * rnd2.y) + 1.0)
    + uRnd5.z * (cos((position.y + rnd1.z) * 20.0 * rnd2.z) + 1.0);
  pos.xy -= normal * side;

  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const fragmentShader = `
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

void main() {
  gl_FragColor = vec4(mix(uColor1, uColor2, vUv.x), 1.0);
}
`;

export function initWaves(canvasId = "canvas"): void {
  if (initialized) return;

  const displayCanvas = document.getElementById(canvasId);
  if (!(displayCanvas instanceof HTMLCanvasElement)) return;

  const context = displayCanvas.getContext("2d");
  if (!context) return;

  displayCanvasRef = displayCanvas;
  displayContext = context;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  camera = new THREE.PerspectiveCamera();

  updateSize();
  initScene();

  window.addEventListener("resize", updateSize);
  resizeObserver = new ResizeObserver(() => updateSize());
  resizeObserver.observe(displayCanvas);
  animationFrameId = window.requestAnimationFrame(animate);
  initialized = true;
}

export function disposeWaves(): void {
  if (!initialized) return;

  window.cancelAnimationFrame(animationFrameId);
  window.removeEventListener("resize", updateSize);
  resizeObserver?.disconnect();
  resizeObserver = null;

  disposeScene();
  renderer?.dispose();

  renderer = null;
  scene = null;
  camera = null;
  displayCanvasRef = null;
  displayContext = null;
  initialized = false;
}

function initScene(): void {
  scene = new THREE.Scene();

  const dx = 2 / conf.nx;
  const dy = -2 / (conf.ny - 1);
  const ox = -1 + dx / 2;
  const oy = 1;
  const mat2 = Float32Array.from([
    Math.cos(conf.angle),
    -Math.sin(conf.angle),
    Math.sin(conf.angle),
    Math.cos(conf.angle),
  ]);

  for (let i = 0; i < conf.nx; i += 1) {
    const points: THREE.Vector3[] = [];
    for (let j = 0; j < conf.ny; j += 1) {
      const x = ox + i * dx;
      const y = oy + j * dy;
      points.push(new THREE.Vector3(x, y, 0));
    }

    const polyline = new Polyline(points);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime,
        uTimeCoef,
        uMat2: { value: mat2 },
        uSize: { value: 1.5 / conf.nx },
        uRnd1: { value: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) },
        uRnd2: { value: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) },
        uRnd3: { value: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) },
        uRnd4: { value: new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)) },
        uRnd5: {
          value: new THREE.Vector3(rnd(0.2, 0.5), rnd(0.3, 0.6), rnd(0.4, 0.7)),
        },
        uColor1: { value: new THREE.Color(conf.cscale(i / conf.nx).hex()) },
        uColor2: {
          value: new THREE.Color(
            conf
              .cscale(i / conf.nx)
              .darken(conf.darken)
              .hex(),
          ),
        },
      },
      vertexShader,
      fragmentShader,
    });

    scene.add(new THREE.Mesh(polyline.geometry, material));
  }
}

function disposeScene(): void {
  if (!scene) return;

  while (scene.children.length > 0) {
    const object = scene.children[0];
    scene.remove(object);

    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose?.();
      disposeMaterial(object.material);
    }
  }
}

function disposeMaterial(
  material: THREE.Material | THREE.Material[] | undefined,
): void {
  if (!material) return;
  if (Array.isArray(material)) {
    material.forEach((entry) => entry?.dispose?.());
    return;
  }
  material.dispose?.();
}

function animate(t: number): void {
  uTime.value = t * 0.001;
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
    compositeFrame();
  }
  animationFrameId = window.requestAnimationFrame(animate);
}

function updateSize(): void {
  if (!renderer || !displayCanvasRef || !displayContext) return;
  const rect = displayCanvasRef.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvasWidth = width;
  canvasHeight = height;

  displayCanvasRef.width = Math.max(1, Math.floor(width * dpr));
  displayCanvasRef.height = Math.max(1, Math.floor(height * dpr));

  displayContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);

  updateTextLayout();
  compositeFrame();
}

function updateTextLayout(): void {
  if (!displayContext) return;

  const maxTextWidth = canvasWidth * (1 - TITLE_HORIZONTAL_PADDING * 2);
  const maxTextHeight = canvasHeight * 0.96;

  let low = 1;
  let high = Math.max(2, Math.floor(canvasHeight));

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    displayContext.font = `${mid}px ${TITLE_FONT_FAMILY}`;
    const metrics = displayContext.measureText(TITLE_TEXT);
    const textHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || mid;

    if (metrics.width <= maxTextWidth && textHeight <= maxTextHeight) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  titleFontSize = Math.max(1, low - 1);
  titleX = canvasWidth / 2;
  titleY = canvasHeight * TITLE_VERTICAL_CENTER;
}

function compositeFrame(): void {
  if (!displayContext || !renderer) return;

  displayContext.clearRect(0, 0, canvasWidth, canvasHeight);
  displayContext.drawImage(
    renderer.domElement,
    0,
    0,
    canvasWidth,
    canvasHeight,
  );

  displayContext.save();
  displayContext.globalCompositeOperation = "destination-in";
  displayContext.fillStyle = "#fff";
  displayContext.font = `${titleFontSize}px ${TITLE_FONT_FAMILY}`;
  displayContext.textAlign = "center";
  displayContext.textBaseline = "middle";
  displayContext.fillText(TITLE_TEXT, titleX, titleY);
  displayContext.restore();
}

class Polyline {
  points: THREE.Vector3[];
  count: number;
  geometry: THREE.BufferGeometry;
  position: Float32Array;
  prev: Float32Array;
  next: Float32Array;

  constructor(points: THREE.Vector3[]) {
    this.points = points;
    this.count = points.length;
    this.geometry = new THREE.BufferGeometry();
    this.position = new Float32Array(this.count * 3 * 2);
    this.prev = new Float32Array(this.count * 3 * 2);
    this.next = new Float32Array(this.count * 3 * 2);
    this.init();
    this.updateGeometry();
  }

  private init(): void {
    const side = new Float32Array(this.count * 2);
    const uv = new Float32Array(this.count * 4);
    const index = new Uint16Array((this.count - 1) * 6);

    for (let i = 0; i < this.count; i += 1) {
      const i2 = i * 2;
      side.set([-1, 1], i2);

      const v = i / (this.count - 1);
      uv.set([0, v, 1, v], i * 4);

      if (i === this.count - 1) continue;
      index.set([i2, i2 + 1, i2 + 2], i2 * 3);
      index.set([i2 + 2, i2 + 1, i2 + 3], (i2 + 1) * 3);
    }

    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.position, 3),
    );
    this.geometry.setAttribute("prev", new THREE.BufferAttribute(this.prev, 3));
    this.geometry.setAttribute("next", new THREE.BufferAttribute(this.next, 3));
    this.geometry.setAttribute("side", new THREE.BufferAttribute(side, 1));
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    this.geometry.setIndex(new THREE.BufferAttribute(index, 1));
  }

  private updateGeometry(): void {
    const tmp = new THREE.Vector3();

    this.points.forEach((p, i) => {
      p.toArray(this.position, i * 6);
      p.toArray(this.position, i * 6 + 3);

      if (i === 0) {
        tmp
          .copy(p)
          .sub(this.points[i + 1])
          .add(p);
        tmp.toArray(this.prev, i * 6);
        tmp.toArray(this.prev, i * 6 + 3);
      } else {
        p.toArray(this.next, (i - 1) * 6);
        p.toArray(this.next, (i - 1) * 6 + 3);
      }

      if (i === this.points.length - 1) {
        tmp
          .copy(p)
          .sub(this.points[i - 1])
          .add(p);
        tmp.toArray(this.next, i * 6);
        tmp.toArray(this.next, i * 6 + 3);
      } else {
        p.toArray(this.prev, (i + 1) * 6);
        p.toArray(this.prev, (i + 1) * 6 + 3);
      }
    });

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.prev.needsUpdate = true;
    this.geometry.attributes.next.needsUpdate = true;
  }
}
