"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Lightformer, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { heartGeometry } from "./heart";

/** Keyhole cut through the heart. Shape coords are pre-flip (heartGeometry
 *  rotates 180°): lobes sit at low y, the tip at y≈9.5 — so the round head
 *  goes lower and the slot widens toward higher y (it reads correctly after
 *  the flip: round on top, slot below). */
function keyholePath() {
  const cx = 2.5;
  const cy = 3.6;
  const r = 1.25;
  const half = 0.5;
  const theta = Math.acos(half / r); // where the slot meets the circle
  const p = new THREE.Path();
  p.moveTo(cx + half, cy + r * Math.sin(theta));
  p.lineTo(cx + 0.95, cy + 3.3);
  p.lineTo(cx - 0.95, cy + 3.3);
  p.lineTo(cx - half, cy + r * Math.sin(theta));
  p.absarc(cx, cy, r, Math.PI - theta, theta + Math.PI * 2, false);
  p.closePath();
  return p;
}

function Heart({ opened }: { opened: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const spin = useRef(0);
  const geo = useMemo(() => heartGeometry(0.25, { holes: [keyholePath()], depth: 1.6, bevel: 0.9 }), []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#E25A74",
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transmission: 0.35,
        thickness: 1.4,
        ior: 1.45,
        iridescence: 0.35,
        iridescenceIOR: 1.3,
        sheen: 0.6,
        sheenColor: new THREE.Color("#FFD9E6"),
        emissive: new THREE.Color("#B03052"),
        emissiveIntensity: 0.12,
      }),
    [],
  );

  useFrame((state, delta) => {
    const g = group.current;
    // idle: slow turn + lean toward the pointer; opened: whirl and grow
    spin.current += delta * (opened ? 9 : 0.55);
    g.rotation.y = spin.current + state.pointer.x * 0.35;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.25, 3, delta);
    const target = opened ? 1.6 : 1;
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, target, 4, delta));
  });

  return (
    <group ref={group}>
      <mesh geometry={geo} material={mat} />
    </group>
  );
}

export default function KeyholeHeartScene({ active, opened = false }: { active: boolean; opened?: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
      eventPrefix="client"
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 4]} intensity={30} color="#FFC2D1" />
      <pointLight position={[-3, -2, 3]} intensity={18} color="#E0A6FF" />
      {/* local studio lighting — no HDR download */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#FFE3EA" position={[0, 3, 4]} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={2.2} color="#F3C98B" position={[-4, 0, 2]} scale={2.5} />
        <Lightformer form="rect" intensity={1.5} color="#D64560" position={[4, -1, 2]} scale={[2, 5, 1]} />
      </Environment>
      <Float speed={1.6} rotationIntensity={0.2} floatIntensity={0.8}>
        <Heart opened={opened} />
      </Float>
      <Sparkles count={50} scale={[4.5, 3.5, 2]} size={2.4} speed={0.4} color="#FFD9E6" opacity={0.9} />
    </Canvas>
  );
}
