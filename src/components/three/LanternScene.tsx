"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heartGeometry } from "./heart";

const COUNT = 28;
const COLORS = ["#E25A74", "#D64560", "#F3C98B", "#FF8FA6", "#B34A5E"];

/** Glowing heart lanterns drifting up through the night sky (one instanced mesh). */
function Lanterns() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const geo = useMemo(() => heartGeometry(0.05, { depth: 1.2, bevel: 0.7, curveSegments: 12 }), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#B03052",
        emissiveIntensity: 0.35,
        roughness: 0.4,
        toneMapped: false,
      }),
    [],
  );
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() - 0.5) * 16,
        z: -1 - Math.random() * 6,
        speed: 0.25 + Math.random() * 0.45,
        offset: Math.random() * 12,
        sway: 0.2 + Math.random() * 0.5,
        spin: (Math.random() - 0.5) * 1.2,
        scale: 0.6 + Math.random() * 0.9,
      })),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    // per-instance warm colours
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) mesh.current.setColorAt(i, c.set(COLORS[i % COLORS.length]));
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const y = ((t * s.speed + s.offset) % 12) - 6; // loop bottom → top
      dummy.position.set(s.x + Math.sin(t * 0.6 + s.offset) * s.sway, y, s.z);
      dummy.rotation.set(Math.sin(t + s.offset) * 0.25, t * s.spin, Math.sin(t * 0.8 + s.offset) * 0.15);
      // fade in at the bottom, out at the top
      const edge = Math.min(1, (y + 6) / 1.5, (6 - y) / 1.5);
      dummy.scale.setScalar(s.scale * Math.max(0, edge));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geo, mat, COUNT]} />;
}

export default function LanternScene({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.6} />
      <Lanterns />
      <Sparkles count={60} scale={[16, 8, 4]} size={2} speed={0.3} color="#F3E3C3" opacity={0.7} />
    </Canvas>
  );
}
