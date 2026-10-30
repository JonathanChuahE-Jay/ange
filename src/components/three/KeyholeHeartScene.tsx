"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heartGeometry } from "./heart";

/** Keyhole cut through the heart. Shape coords are pre-flip (heartGeometry
 *  rotates 180°): round head lower, slot widening toward higher y, so after
 *  the flip it reads correctly — round on top, slot below. */
function keyholePath() {
  const cx = 2.5;
  const cy = 3.6;
  const r = 1.25;
  const half = 0.5;
  const theta = Math.acos(half / r);
  const p = new THREE.Path();
  p.moveTo(cx + half, cy + r * Math.sin(theta));
  p.lineTo(cx + 0.95, cy + 3.3);
  p.lineTo(cx - 0.95, cy + 3.3);
  p.lineTo(cx - half, cy + r * Math.sin(theta));
  p.absarc(cx, cy, r, Math.PI - theta, theta + Math.PI * 2, false);
  p.closePath();
  return p;
}

const TRAIL = 90;

/** Soft round sprite for the sparkle trail. */
function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.6)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function FollowHeart({ opened, reduced }: { opened: boolean; reduced: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const points = useRef<THREE.Points>(null!);
  const { viewport } = useThree();
  const moved = useRef(false);
  const last = useRef(new THREE.Vector3());
  const spin = useRef(0);
  const emitAcc = useRef(0);

  const geo = useMemo(() => heartGeometry(0.028, { holes: [keyholePath()], depth: 1.6, bevel: 0.9 }), []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#E25A74",
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transmission: 0.3,
        thickness: 1.4,
        ior: 1.45,
        iridescence: 0.35,
        iridescenceIOR: 1.3,
        sheen: 0.6,
        sheenColor: new THREE.Color("#FFD9E6"),
        emissive: new THREE.Color("#B03052"),
        emissiveIntensity: 0.18,
      }),
    [],
  );

  // sparkle trail: ring buffer of particles with a life value baked into colour
  const trail = useMemo(() => {
    const pos = new Float32Array(TRAIL * 3).fill(999);
    const col = new Float32Array(TRAIL * 4);
    const vel = new Float32Array(TRAIL * 3);
    const life = new Float32Array(TRAIL);
    const tint = new Float32Array(TRAIL * 3);
    const palette = [new THREE.Color("#FFD9E6"), new THREE.Color("#F3C98B"), new THREE.Color("#FF8FA6")];
    for (let i = 0; i < TRAIL; i++) {
      const c = palette[i % palette.length];
      tint[i * 3] = c.r;
      tint[i * 3 + 1] = c.g;
      tint[i * 3 + 2] = c.b;
    }
    return { pos, col, vel, life, tint, head: 0 };
  }, []);
  const trailMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.06,
        map: dotTexture(),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  // r3f only updates state.pointer once the pointer actually moves; until then, idle pose
  useEffect(() => {
    const onMove = () => {
      moved.current = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = group.current;
    const t = state.clock.elapsedTime;
    const idle = new THREE.Vector3(Math.sin(t * 0.7) * 0.15, viewport.height * 0.3 + Math.sin(t * 1.3) * 0.06, 0);

    // target: centre when opened, else the cursor (offset slightly so it never covers the pointer)
    const target = opened
      ? new THREE.Vector3(0, viewport.height * 0.05, 1.2)
      : moved.current && !reduced
        ? new THREE.Vector3(
            (state.pointer.x * viewport.width) / 2 + 0.16,
            (state.pointer.y * viewport.height) / 2 - 0.14,
            0,
          )
        : idle;

    last.current.copy(g.position);
    const lambda = opened ? 6 : 5.5;
    g.position.x = THREE.MathUtils.damp(g.position.x, target.x, lambda, dt);
    g.position.y = THREE.MathUtils.damp(g.position.y, target.y, lambda, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, target.z, lambda, dt);

    // lean into the motion
    const vx = (g.position.x - last.current.x) / Math.max(dt, 1e-4);
    const vy = (g.position.y - last.current.y) / Math.max(dt, 1e-4);
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, THREE.MathUtils.clamp(-vx * 0.12, -0.6, 0.6), 6, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, THREE.MathUtils.clamp(-vy * 0.1, -0.5, 0.5), 6, dt);
    if (opened) {
      spin.current += dt * 7;
      g.rotation.y = spin.current;
    } else {
      spin.current = g.rotation.y;
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, Math.sin(t * 1.1) * 0.55 + vx * 0.08, 4, dt);
    }
    const s = THREE.MathUtils.damp(g.scale.x, opened ? 1.9 : 1, 3, dt); // ~175px when opened
    g.scale.setScalar(s);

    // emit sparkles proportional to speed (plus a trickle when idle)
    const speed = Math.hypot(vx, vy);
    if (!reduced) {
      emitAcc.current += dt * (opened ? 120 : 6 + speed * 22);
      while (emitAcc.current >= 1) {
        emitAcc.current -= 1;
        const i = trail.head;
        trail.head = (trail.head + 1) % TRAIL;
        trail.pos[i * 3] = g.position.x + (Math.random() - 0.5) * 0.12;
        trail.pos[i * 3 + 1] = g.position.y + (Math.random() - 0.5) * 0.12;
        trail.pos[i * 3 + 2] = g.position.z - 0.05;
        const spread = opened ? 1.6 : 0.25;
        trail.vel[i * 3] = (Math.random() - 0.5) * spread;
        trail.vel[i * 3 + 1] = (Math.random() - 0.5) * spread - (opened ? 0 : 0.15);
        trail.vel[i * 3 + 2] = 0;
        trail.life[i] = 1;
      }
    }
    for (let i = 0; i < TRAIL; i++) {
      if (trail.life[i] <= 0) {
        trail.col[i * 4 + 3] = 0;
        continue;
      }
      trail.life[i] -= dt * 1.1;
      trail.pos[i * 3] += trail.vel[i * 3] * dt;
      trail.pos[i * 3 + 1] += trail.vel[i * 3 + 1] * dt;
      trail.col[i * 4] = trail.tint[i * 3];
      trail.col[i * 4 + 1] = trail.tint[i * 3 + 1];
      trail.col[i * 4 + 2] = trail.tint[i * 3 + 2];
      trail.col[i * 4 + 3] = Math.max(0, trail.life[i]);
    }
    const geoT = points.current.geometry;
    (geoT.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geoT.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <>
      <points ref={points} material={trailMat} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trail.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[trail.col, 4]} />
        </bufferGeometry>
      </points>
      <group ref={group} position={[0, 1, 0]}>
        <mesh geometry={geo} material={mat} />
      </group>
    </>
  );
}

/** Full-screen, click-through layer: a glass keyhole heart that follows the
 *  cursor (or finger) with a sparkle trail; flies to centre when `opened`. */
export default function KeyholeHeartScene({ active, opened = false }: { active: boolean; opened?: boolean }) {
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
      eventPrefix="client"
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 4]} intensity={30} color="#FFC2D1" />
      <pointLight position={[-3, -2, 3]} intensity={18} color="#E0A6FF" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#FFE3EA" position={[0, 3, 4]} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#F3C98B" position={[-4, 0, 2]} scale={2.5} />
        <Lightformer form="rect" intensity={1.5} color="#D64560" position={[4, -1, 2]} scale={[2, 5, 1]} />
      </Environment>
      <FollowHeart opened={opened} reduced={reduced} />
    </Canvas>
  );
}
