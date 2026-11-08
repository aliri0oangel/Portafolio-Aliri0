"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface WebGLMorphCanvasProps {
  /** Lista ordenada de URLs de imágenes para el canvas */
  images: string[];
  /** Índice de la imagen actualmente seleccionada */
  activeIndex: number;
  /** Dirección del movimiento (+1 siguiente, -1 anterior) */
  direction?: number;
  /** Modo de transición shader (melt por defecto) */
  transition?: "melt" | "ripple" | "shear" | "swirl";
  /** Intensidad del ruido/deformación (0.1 a 1.5) */
  intensity?: number;
  /** Escala del ruido fractal */
  scale?: number;
  /** Desfase cromático RGB (aberración) */
  aberration?: number;
  /** Deriva ambiental sinusoidal en reposo */
  drift?: number;
  /** Duración de la transición en segundos */
  duration?: number;
  /** Clase CSS para el canvas/contenedor */
  className?: string;
  /** Texto alternativo para accesibilidad y fallback */
  altText?: string;
}

const VS_SOURCE = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = (aPosition + 1.0) * 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FS_SOURCE = `
precision highp float;
uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform float uProgress;
uniform float uDir;
uniform int uMode;
uniform float uIntensity;
uniform float uScale;
uniform float uAberration;
uniform float uDrift;
uniform float uTime;
uniform float uReduce;
uniform vec2 uPointer;
uniform vec3 uOverlay;
varying vec2 vUv;

const float PI = 3.14159265359;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float rA = res.x / max(res.y, 1.0);
  float iA = img.x / max(img.y, 1.0);
  vec2 s = vec2(1.0);
  float ratio = rA / max(iA, 0.0001);
  if (ratio > 1.0) {
    s.y = 1.0 / ratio;
  } else {
    s.x = ratio;
  }
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);
  float env = sin(p * PI);

  vec2 uv = vUv;
  uv += vec2(sin(uTime * 0.25 + uv.y * 4.0), cos(uTime * 0.22 + uv.x * 4.0)) * uDrift * 0.008;
  uv = (uv - 0.5) * (1.0 - uDrift * 0.02 * sin(uTime * 0.4)) + 0.5;

  vec2 uvC = uv;
  vec2 uvN = uv;
  float m = smoothstep(0.0, 1.0, p);

  if (uReduce < 0.5) {
    if (uMode == 3) {
      vec2 c = uv - 0.5;
      float r = length(c);
      float ang = env * uIntensity * 3.5 * (1.0 - r);
      uvC = rot(ang) * c + 0.5;
      uvN = rot(-ang) * c + 0.5;
      m = smoothstep(0.0, 1.0, p);
    } else if (uMode == 1) {
      float d = distance(uv, uPointer);
      float ring = p * 1.6;
      float wave = sin((d - ring) * 30.0) * env;
      vec2 dir = normalize(uv - uPointer + 1e-4);
      vec2 disp = dir * wave * uIntensity * 0.25;
      uvC = uv + disp;
      uvN = uv + disp * 0.6;
      m = 1.0 - smoothstep(ring - 0.03, ring + 0.03, d);
    } else if (uMode == 2) {
      float slices = 14.0;
      float row = floor(uv.y * slices);
      float rnd = hash11(row);
      vec2 disp = vec2((rnd - 0.5) * env * uIntensity * 0.6, 0.0);
      uvC = uv + disp;
      uvN = uv + disp;
      float localX = uDir > 0.0 ? uv.x : 1.0 - uv.x;
      float th = p * 1.5 - 0.25 + (rnd - 0.5) * 0.25;
      m = 1.0 - smoothstep(th - 0.06, th + 0.06, localX);
    } else {
      float nn = fbm(uv * uScale + uTime * 0.03);
      float warp = fbm(uv * uScale * 1.7 - uTime * 0.02);
      vec2 g = vec2(nn, warp) - 0.5;
      uvC = uv + g * uIntensity * 0.5 * p;
      uvN = uv - g * uIntensity * 0.5 * (1.0 - p);
      m = smoothstep(nn - 0.15, nn + 0.15, p);
    }
  }

  vec2 sC = coverUV(uvC, uResolution, uCurrentSize);
  vec2 sN = coverUV(uvN, uResolution, uNextSize);

  float ca = uReduce < 0.5 ? uAberration * env * 0.035 : 0.0;

  vec3 colC = vec3(
    texture2D(tCurrent, sC + vec2(ca, 0.0)).r,
    texture2D(tCurrent, sC).g,
    texture2D(tCurrent, sC - vec2(ca, 0.0)).b
  );
  vec3 colN = vec3(
    texture2D(tNext, sN + vec2(ca, 0.0)).r,
    texture2D(tNext, sN).g,
    texture2D(tNext, sN - vec2(ca, 0.0)).b
  );

  vec3 col = mix(colC, colN, m);

  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
  col = mix(col, uOverlay, (1.0 - vig) * 0.28);

  gl_FragColor = vec4(col, 1.0);
}
`;

const MODE_MAP = {
  melt: 0,
  ripple: 1,
  shear: 2,
  swirl: 3,
};

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function WebGLMorphCanvas({
  images,
  activeIndex,
  direction = 1,
  transition = "melt",
  intensity = 0.55,
  scale = 2.4,
  aberration = 0.35,
  drift = 0.4,
  duration = 1.0,
  className = "w-full h-full block",
  altText = "Vista previa del proyecto",
}: WebGLMorphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  // Controles del render loop para pausar/reanudar por visibilidad
  // (Ajuste 10): los lee el IntersectionObserver del efecto de abajo.
  const loopControlsRef = useRef<{
    start: () => void;
    stop: () => void;
  } | null>(null);
  // Visibilidad actual del canvas. Arranca en `true` para que el loop
  // no dependa del primer callback del observer (que es asíncrono).
  const isVisibleRef = useRef(true);

  // Refs de estado para evitar re-creación de WebGL en cada render
  const stateRef = useRef({
    currentIndex: activeIndex,
    targetIndex: activeIndex,
    direction,
    isAnimating: false,
    animStartTime: 0,
    animDuration: duration * 1000,
    animProgress: 0,
    mode: MODE_MAP[transition] ?? 0,
    intensity,
    scale,
    aberration,
    drift,
    reducedMotion: false,
  });

  // Mantener valores de configuración sincronizados sin reiniciar WebGL
  useEffect(() => {
    stateRef.current.mode = MODE_MAP[transition] ?? 0;
    stateRef.current.intensity = intensity;
    stateRef.current.scale = scale;
    stateRef.current.aberration = aberration;
    stateRef.current.drift = drift;
    stateRef.current.animDuration = duration * 1000;
  }, [transition, intensity, scale, aberration, drift, duration]);

  // Disparar animación de transición cuando cambia activeIndex
  useEffect(() => {
    const s = stateRef.current;
    if (activeIndex === s.currentIndex && !s.isAnimating) return;

    // Ajuste 14: al interrumpir una transición en curso, si la pantalla
    // ya muestra ≥50% del destino (`animProgress` es la mezcla visible
    // que manda el shader), esa imagen se compromete como nueva base
    // ANTES de retargetear. Sin esto, `currentIndex` solo avanzaba al
    // completar el 100% en el render loop: con clics más rápidos que la
    // transición la base retrocedía a la imagen anterior (snap-back) o
    // se congelaba mientras HUD/dots avanzaban. El umbral 0.5 limita el
    // salto visual a ≤50% de la mezcla y garantiza avance progresivo.
    if (s.isAnimating && s.animProgress >= 0.5) {
      s.currentIndex = s.targetIndex;
    }

    s.targetIndex = activeIndex;
    s.direction = direction;
    s.isAnimating = true;
    s.animStartTime = performance.now();
  }, [activeIndex, direction]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    stateRef.current.reducedMotion = reducedMotion;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    setWebglSupported(true);

    function compileShader(type: number, source: string): WebGLShader | null {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglSupported(false);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    // Quad geometry (Full screen)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW,
    );

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uLocs = {
      tCurrent: gl.getUniformLocation(program, "tCurrent"),
      tNext: gl.getUniformLocation(program, "tNext"),
      uResolution: gl.getUniformLocation(program, "uResolution"),
      uCurrentSize: gl.getUniformLocation(program, "uCurrentSize"),
      uNextSize: gl.getUniformLocation(program, "uNextSize"),
      uProgress: gl.getUniformLocation(program, "uProgress"),
      uDir: gl.getUniformLocation(program, "uDir"),
      uMode: gl.getUniformLocation(program, "uMode"),
      uIntensity: gl.getUniformLocation(program, "uIntensity"),
      uScale: gl.getUniformLocation(program, "uScale"),
      uAberration: gl.getUniformLocation(program, "uAberration"),
      uDrift: gl.getUniformLocation(program, "uDrift"),
      uTime: gl.getUniformLocation(program, "uTime"),
      uReduce: gl.getUniformLocation(program, "uReduce"),
      uPointer: gl.getUniformLocation(program, "uPointer"),
      uOverlay: gl.getUniformLocation(program, "uOverlay"),
    };

    // Texturas para cada imagen
    const textures: (WebGLTexture | null)[] = [];
    const sizes: [number, number][] = [];

    // Ajuste 16: la bandera de cierre debe existir ANTES de crear los
    // `Image`, porque sus callbacks tardíos la leen. En dev, Strict Mode
    // ejecuta este efecto dos veces (setup→cleanup→setup): sin el
    // guard, los `onload` del primer lote suben píxeles cuando sus
    // texturas ya fueron borradas; el `bindTexture` huérfano es no-op
    // en WebGL, así que los píxeles se escriben sobre la textura viva
    // que ocupó la unidad activa → la ranura N muestra la foto de otro
    // proyecto (intermitente: gana el onload que llega último).
    let disposed = false;
    // Imágenes creadas por ESTE lote: en el cleanup se anulan sus
    // handlers para que nunca llegue a ejecutarse un callback huérfano.
    const loadedImages: HTMLImageElement[] = [];

    images.forEach((src, idx) => {
      if (!gl) return;
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      // Placeholder temporal de 1x1 pixel oscuro mientras carga la imagen
      const placeholder = new Uint8Array([12, 12, 16, 255]);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        placeholder,
      );

      textures[idx] = tex;
      sizes[idx] = [1280, 720];

      // Cargar la imagen real de fondo (con orientación vertical corregida)
      const img = new window.Image();
      loadedImages.push(img);
      img.crossOrigin = "anonymous";
      img.src = src;
      img.onload = () => {
        // Ajuste 16: lote descartado (re-ejecución del efecto o
        // desmontaje) → no subir; con `tex` ya borrado el bind sería
        // no-op y los píxeles invadirían la textura enlazada.
        if (disposed || !gl || !tex) return;
        // Subir siempre desde TEXTURE0: al llegar tarde, la unidad
        // activa sería TEXTURE1 (tNext) y el bind temporal desplazaría
        // la textura destino hasta el siguiente frame.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        sizes[idx] = [img.naturalWidth || 1280, img.naturalHeight || 720];
      };
      img.onerror = () => {
        // Ajuste 16: handler registrado para que un error de red quede
        // cubierto (la textura conserva el placeholder 1×1 oscuro y el
        // tamaño por defecto [1280, 720]); sin efecto si el lote ya
        // fue descartado.
        if (disposed) return;
      };
    });

    let animationFrameId: number | null = null;

    const renderLoop = (now: number) => {
      if (disposed || !gl || !canvas) return;

      // Ajuste de resolución al contenedor y DPR
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const s = stateRef.current;

      if (s.isAnimating) {
        const elapsed = now - s.animStartTime;
        const dur = s.reducedMotion ? 300 : s.animDuration;
        const p = Math.min(elapsed / Math.max(dur, 1), 1.0);

        if (p >= 1.0) {
          s.isAnimating = false;
          s.currentIndex = s.targetIndex;
          s.animProgress = 0;
        } else {
          s.animProgress = easeInOutQuad(p);
        }
      }

      gl.useProgram(program);

      const currIdx = s.currentIndex % textures.length;
      const nextIdx = (s.isAnimating ? s.targetIndex : s.currentIndex) % textures.length;

      // Textura actual (Unit 0)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[currIdx] ?? null);
      gl.uniform1i(uLocs.tCurrent, 0);

      // Textura siguiente (Unit 1)
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[nextIdx] ?? null);
      gl.uniform1i(uLocs.tNext, 1);

      // Uniforms de estado y dimensiones
      gl.uniform2f(uLocs.uResolution, canvas.width, canvas.height);
      gl.uniform2f(
        uLocs.uCurrentSize,
        sizes[currIdx]?.[0] ?? 1280,
        sizes[currIdx]?.[1] ?? 720,
      );
      gl.uniform2f(
        uLocs.uNextSize,
        sizes[nextIdx]?.[0] ?? 1280,
        sizes[nextIdx]?.[1] ?? 720,
      );
      gl.uniform1f(uLocs.uProgress, s.animProgress);
      gl.uniform1f(uLocs.uDir, s.direction);
      gl.uniform1i(uLocs.uMode, s.mode);
      gl.uniform1f(uLocs.uIntensity, s.intensity);
      gl.uniform1f(uLocs.uScale, s.scale);
      gl.uniform1f(uLocs.uAberration, s.aberration);
      gl.uniform1f(uLocs.uDrift, s.drift);
      gl.uniform1f(uLocs.uTime, now * 0.001);
      gl.uniform1f(uLocs.uReduce, s.reducedMotion ? 1.0 : 0.0);
      gl.uniform2f(uLocs.uPointer, 0.5, 0.5);
      gl.uniform3f(uLocs.uOverlay, 0.04, 0.04, 0.05);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    /** Arranca el loop solo si el canvas es visible y no está corriendo. */
    const startLoop = () => {
      if (disposed || !isVisibleRef.current || animationFrameId !== null) {
        return;
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    /** Detiene el loop liberando el frame pendiente (fuera de viewport). */
    const stopLoop = () => {
      if (animationFrameId === null) return;
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    };

    startLoop();
    loopControlsRef.current = { start: startLoop, stop: stopLoop };

    return () => {
      disposed = true;
      // Ajuste 16: anular los callbacks del lote para que un `onload`
      // tardío no suba píxeles después de borrar las texturas.
      loadedImages.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
      stopLoop();
      loopControlsRef.current = null;
      if (gl) {
        textures.forEach((t) => t && gl.deleteTexture(t));
        gl.deleteBuffer(positionBuffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, [images]);

  // Pausa el render loop cuando el canvas sale del viewport (Ajuste 10):
  // sin este guard el rAF corre a 60 FPS aunque la sección no se vea.
  // Lee loopControlsRef en cada callback para usar los controles del
  // efecto de WebGL vigente (se re-crean si cambia `images`).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        isVisibleRef.current = visible;
        const controls = loopControlsRef.current;
        if (!controls) return;
        if (visible) controls.start();
        else controls.stop();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      isVisibleRef.current = true;
    };
  }, []);

  // Si WebGL no está disponible (SSR, JSDOM o dispositivo antiguo), renderizamos fallback accesible
  const currentImage = images[activeIndex] ?? images[0] ?? "";

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        className={className}
        style={{ display: webglSupported === false ? "none" : "block" }}
        aria-hidden="true"
      />

      {/* Fallback accesible con Next.js Image y para pruebas JSDOM/SSR */}
      {webglSupported === false && currentImage ? (
        <Image
          src={currentImage}
          alt={altText}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1024px) 90vw, 1280px"
          className="object-cover transition-opacity duration-500 ease-out"
          priority
        />
      ) : null}
    </div>
  );
}
