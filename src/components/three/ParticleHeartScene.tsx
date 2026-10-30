"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { heartPoint } from "./heart";

const COUNT = 9000;

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uBeat;
  uniform float uPixelRatio;
  attribute float aRand;
  attribute vec3 aScatter;
  varying float vRand;
  varying float vAlpha;

  void main() {
    vRand = aRand;
    vec3 p = position;
    // heartbeat: everything breathes outward together
    p *= 1.0 + uBeat * 0.07;
    // slow swirl + per-particle drift so the heart feels alive
    float a = uTime * 0.25 + aRand * 6.2831;
    p += vec3(cos(a), sin(a * 1.3), sin(a)) * 0.035;
    // a few particles orbit loosely as stardust
    p += aScatter * (0.6 + 0.4 * sin(uTime * 0.4 + aRand * 10.0));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = mix(2.0, 6.0, aRand * aRand) * (1.0 + uBeat * 0.5);
    gl_PointSize = size * uPixelRatio * (6.0 / -mv.z);
    vAlpha = 0.55 + 0.45 * sin(uTime * 2.0 + aRand * 40.0);
  }
`;

const fragment = /* glsl */ `
  varying float vRand;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float glow = smoothstep(0.5, 0.0, d);
    vec3 rose = vec3(0.84, 0.27, 0.38);
    vec3 blush = vec3(1.0, 0.85, 0.9);
    vec3 gold = vec3(0.95, 0.79, 0.55);
    vec3 col = mix(rose, blush, smoothstep(0.3, 0.9, vRand));
    col = mix(col, gold, step(0.93, vRand));
    gl_FragColor = vec4(col, glow * vAlpha);
  }
`;

function Particles() {
  const points = useRef<THREE.Points>(null!);
  const { positions, rands, scatter } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const rands = new Float32Array(COUNT);
    const scatter = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random() * Math.PI * 2;
      const [hx, hy] = heartPoint(t);
      // denser near the outline, softly filled inside
      const r = Math.random() < 0.55 ? 0.92 + Math.random() * 0.1 : Math.sqrt(Math.random());
      positions[i * 3] = hx * r * 2.2;
      positions[i * 3 + 1] = hy * r * 2.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.7 * (1.1 - r);
      rands[i] = Math.random();
      if (Math.random() < 0.08) {
        scatter[i * 3] = (Math.random() - 0.5) * 3.5;
        scatter[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
        scatter[i * 3 + 2] = (Math.random() - 0.5) * 2;
      }
    }
    return { positions, rands, scatter };
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uTime: { value: 0 },
          uBeat: { value: 0 },
          uPixelRatio: { value: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;
    // lub-dub: two quick pulses, then rest (~70 bpm)
    const phase = (t % 0.86) / 0.86;
    const pulse = (c: number, w: number) => Math.exp(-Math.pow((phase - c) / w, 2));
    material.uniforms.uBeat.value = pulse(0.1, 0.05) + 0.6 * pulse(0.28, 0.05);
    const p = points.current;
    p.rotation.y = THREE.MathUtils.damp(p.rotation.y, state.pointer.x * 0.4 + Math.sin(t * 0.3) * 0.15, 2, delta);
    p.rotation.x = THREE.MathUtils.damp(p.rotation.x, -state.pointer.y * 0.2, 2, delta);
  });

  return (
    <points ref={points} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aRand" args={[rands, 1]} />
        <bufferAttribute attach="attributes-aScatter" args={[scatter, 3]} />
      </bufferGeometry>
    </points>
  );
}

/** ~9k glowing particles forming a beating, swirling heart. */
export default function ParticleHeartScene({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: false, alpha: true }}
      eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
      eventPrefix="client"
      style={{ background: "transparent" }}
    >
      <Particles />
    </Canvas>
  );
}
