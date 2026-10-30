"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * A 3D love-letter envelope that physically opens: the wax-sealed flap swings
 * back, the letter slides out and lifts toward the viewer, then hands off to
 * the readable HTML letter via onOpened().
 */

type Phase = "idle" | "flap" | "letter" | "done";

function flapGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-1.5, 0);
  s.lineTo(1.5, 0);
  s.lineTo(0, -1.05);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

function Envelope({
  onOpened,
  openRef,
}: {
  onOpened: () => void;
  openRef: React.MutableRefObject<(() => void) | null>;
}) {
  const phase = useRef<Phase>("idle");
  const t = useRef(0);
  const flap = useRef<THREE.Group>(null!);
  const letter = useRef<THREE.Group>(null!);
  const whole = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);

  const flapGeo = useMemo(() => flapGeometry(), []);
  const cream = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFF9EC", roughness: 0.85 }), []);
  const rose = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E8879C", roughness: 0.6 }), []);
  const roseDeep = useMemo(() => new THREE.MeshStandardMaterial({ color: "#D64560", roughness: 0.55 }), []);
  const sealMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#B03052", roughness: 0.35, emissive: "#5a1020", emissiveIntensity: 0.4 }),
    [],
  );
  const sealInnerMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#F6DCE2", roughness: 0.5 }),
    [],
  );

  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (phase.current === "flap") {
      t.current = Math.min(1, t.current + dt / 0.7);
      const e = easeOut(t.current);
      if (flap.current) flap.current.rotation.x = -e * Math.PI * 0.82;
      if (t.current >= 1) {
        phase.current = "letter";
        t.current = 0;
      }
    } else if (phase.current === "letter") {
      t.current = Math.min(1, t.current + dt / 1.0);
      const e = easeOut(t.current);
      if (letter.current) {
        letter.current.position.y = 0.35 + e * 2.1;
        letter.current.position.z = 0.02 + e * 0.55;
        letter.current.rotation.x = -0.12 * e;
        const s = 1 + e * 0.25;
        letter.current.scale.set(s, s, s);
      }
      if (whole.current) whole.current.rotation.z = (1 - e) * whole.current.rotation.z;
      if (t.current >= 1) {
        phase.current = "done";
        onOpened();
      }
    } else if (phase.current === "idle" && whole.current) {
      // gentle breathing tilt while sealed
      whole.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    }
  });

  const open = () => {
    if (phase.current !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      phase.current = "done";
      onOpened();
      return;
    }
    phase.current = "flap";
    t.current = 0;
  };

  useEffect(() => {
    openRef.current = open;
  });

  return (
    <group ref={whole}>
      <group
        onPointerOver={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        scale={hovered && phase.current === "idle" ? 1.04 : 1}
      >
        {/* back panel */}
        <mesh position={[0, 0, -0.03]} material={roseDeep}>
          <planeGeometry args={[3.1, 2.1]} />
        </mesh>

        {/* letter (starts tucked inside, revealed as it rises) */}
        <group ref={letter} position={[0, 0.35, 0.02]}>
          <mesh material={cream}>
            <planeGeometry args={[2.6, 1.7]} />
          </mesh>
          {/* faint ruled lines on the letter */}
          {[-0.45, -0.15, 0.15, 0.45].map((y) => (
            <mesh key={y} position={[0, y, 0.005]}>
              <planeGeometry args={[2.1, 0.02]} />
              <meshBasicMaterial color="#E3CBC2" />
            </mesh>
          ))}
          <mesh position={[-0.85, 0.55, 0.006]}>
            <planeGeometry args={[0.5, 0.08]} />
            <meshBasicMaterial color="#D64560" />
          </mesh>
        </group>

        {/* front pocket (covers the letter's lower part) */}
        <mesh position={[0, -0.28, 0.05]} material={rose}>
          <planeGeometry args={[3.1, 1.55]} />
        </mesh>

        {/* flap — hinged at the top edge */}
        <group ref={flap} position={[0, 1.04, 0.06]}>
          <mesh geometry={flapGeo} material={rose} position={[0, 0, 0]} />
          {/* wax seal at the flap tip */}
          <mesh position={[0, -0.98, 0.012]} material={sealMat}>
            <circleGeometry args={[0.21, 32]} />
          </mesh>
          <mesh position={[0, -0.98, 0.02]} material={sealInnerMat}>
            <circleGeometry args={[0.07, 24]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function LetterScene({ onOpened }: { onOpened: () => void }) {
  const openRef = useRef<(() => void) | null>(null);
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[340px] cursor-pointer select-none"
      onClick={() => openRef.current?.()}
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-full bg-gradient-to-b from-rosemist to-goldsoft/50 blur-2xl"
      />
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.1, 4.6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <ambientLight intensity={1.1} color="#FFE8EE" />
        <directionalLight position={[2, 4, 5]} intensity={1.6} color="#FFF4EC" />
        <directionalLight position={[-3, 2, 3]} intensity={0.6} color="#F6DCE2" />
        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.6}>
          <Envelope onOpened={onOpened} openRef={openRef} />
        </Float>
        <Sparkles count={40} color="#D64560" size={3} speed={0.4} scale={[4, 3.5, 2]} opacity={0.6} />
      </Canvas>
      <p className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 font-hand text-2xl text-inksoft">
        tap the envelope
      </p>
    </div>
  );
}
