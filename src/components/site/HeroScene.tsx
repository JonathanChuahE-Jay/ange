"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function heartGeometry(scale: number) {
  const s = new THREE.Shape();
  s.moveTo(2.5, 2.5);
  s.bezierCurveTo(2.5, 2.5, 2.0, 0, 0, 0);
  s.bezierCurveTo(-3, 0, -3, 3.5, -3, 3.5);
  s.bezierCurveTo(-3, 5.5, -1, 7.7, 2.5, 9.5);
  s.bezierCurveTo(6, 7.7, 8, 5.5, 8, 3.5);
  s.bezierCurveTo(8, 3.5, 8, 0, 5, 0);
  s.bezierCurveTo(3.5, 0, 2.5, 2.5, 2.5, 2.5);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 2,
    bevelEnabled: true,
    bevelSegments: 6,
    bevelSize: 1.1,
    bevelThickness: 1.1,
    curveSegments: 24,
  });
  geo.center();
  geo.rotateZ(Math.PI); // heart points down in the shape; flip it
  geo.scale(scale, scale, scale);
  return geo;
}

const HEARTS = [
  { pos: [-3.4, 1.2, 0] as const, scale: 0.16, color: "#D64560", speed: 1.2 },
  { pos: [3.1, -0.8, -1] as const, scale: 0.22, color: "#E8879C", speed: 0.9 },
  { pos: [-2.2, -2.1, -1.5] as const, scale: 0.12, color: "#F3E3C3", speed: 1.5 },
  { pos: [2.6, 2.0, -0.5] as const, scale: 0.14, color: "#D64560", speed: 1.1 },
  { pos: [0.4, 2.9, -2] as const, scale: 0.1, color: "#FFD9E6", speed: 1.4 },
  { pos: [-4.2, -0.6, -2.5] as const, scale: 0.18, color: "#B34A5E", speed: 0.8 },
  { pos: [4.2, 1.6, -3] as const, scale: 0.13, color: "#F6DCE2", speed: 1.3 },
  { pos: [0, -2.6, -0.8] as const, scale: 0.09, color: "#C9973F", speed: 1.6 },
];

function GlassHeart({ pos, scale, color, speed }: (typeof HEARTS)[number]) {
  const geo = useMemo(() => heartGeometry(scale), [scale]);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        roughness: 0.18,
        metalness: 0.15,
        clearcoat: 1,
        clearcoatRoughness: 0.25,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.12,
      }),
    [color],
  );
  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={1.4}>
      <mesh geometry={geo} material={mat} position={[...pos]} />
    </Float>
  );
}

/** Pointer parallax: the whole group leans toward the cursor. */
function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  useFrame((state, delta) => {
    const targetY = state.pointer.x * 0.25;
    const targetX = -state.pointer.y * 0.15;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 2.5, delta);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 2.5, delta);
  });
  return <group ref={group}>{children}</group>;
}

export default function HeroScene({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
      eventPrefix="client"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 9], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", touchAction: "pan-y" }}
    >
      <ambientLight intensity={0.7} color="#FFE8EE" />
      <pointLight position={[6, 6, 6]} intensity={40} color="#FFC2D1" />
      <pointLight position={[-6, -4, 4]} intensity={25} color="#E0A6FF" />
      <directionalLight position={[0, 8, 5]} intensity={1.2} color="#FFF4EC" />
      <Rig>
        {HEARTS.map((h, i) => (
          <GlassHeart key={i} {...h} />
        ))}
      </Rig>
      <Sparkles count={110} color="#FFD9E6" size={2.6} speed={0.35} opacity={0.85} scale={[14, 9, 6]} />
      <Stars radius={45} depth={25} count={1400} factor={3.2} saturation={0.4} fade speed={0.8} />
    </Canvas>
  );
}
