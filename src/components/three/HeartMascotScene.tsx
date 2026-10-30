"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heartGeometry } from "./heart";

export type MascotMood = "idle" | "busy" | "error" | "happy";

/**
 * A puffy heart mascot peeking over the gate card. Its eyeballs rotate to look
 * at the cursor anywhere on screen (or at the input she's typing in), it
 * blinks, leans toward the pointer, frowns + shakes on a wrong date and does a
 * happy hop with ^ ^ eyes on the right one.
 *
 * The canvas sits BEHIND the frosted-glass card and extends ~70px below its
 * top edge, so the lower body shows softly blurred through the glass — it
 * reads as peeking over the card. (Paws on the edge are DOM, in front.)
 */

const VIEW_H = 4.6; // world units visible vertically (camera fov chosen to match)
const BODY_SCALE = 0.833;

const C = {
  body: "#E8516F",
  white: "#FFFFFF",
  pupil: "#2A1220",
  mouth: "#5A1A2E",
  cheek: "#FF9DB3",
};

// ---------------------------------------------------------------- pointer
type Look = { x: number; y: number; t: number };

function useGlobalLook(canvasEl: React.RefObject<HTMLDivElement | null>) {
  const pointer = useRef<Look>({ x: 0, y: 0, t: 0 });
  const key = useRef(0);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onKey = () => {
      key.current = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  /** where to look, as screen-px offset from the mascot's eyes */
  return () => {
    const host = canvasEl.current?.getBoundingClientRect();
    if (!host) return { dx: 0, dy: 0 };
    const ex = host.left + host.width / 2;
    const ey = host.top + host.height * 0.5;
    const active = document.activeElement as HTMLInputElement | null;
    const typing = active?.tagName === "INPUT" && key.current > pointer.current.t;
    if (typing && active) {
      // follow the caret along the box she's typing in
      const r = active.getBoundingClientRect();
      const max = Number(active.maxLength) > 0 ? active.maxLength : active.placeholder.length || 4;
      const p = Math.min(1, (active.value.length + 0.5) / max);
      return { dx: r.left + r.width * (0.2 + 0.6 * p) - ex, dy: r.top + r.height / 2 - ey };
    }
    if (pointer.current.t === 0) {
      // before any movement: glance down at the form
      return { dx: 0, dy: 260 };
    }
    return { dx: pointer.current.x - ex, dy: pointer.current.y - ey };
  };
}

// ---------------------------------------------------------------- pieces
function Eye({ x, groupRef }: { x: number; groupRef: React.RefObject<THREE.Group | null> }) {
  return (
    <group position={[x, 0.32, 0.62]}>
      <group ref={groupRef}>
        {/* eyeball */}
        <mesh scale={[1, 1.12, 0.78]}>
          <sphereGeometry args={[0.36, 32, 32]} />
          <meshPhysicalMaterial color={C.white} roughness={0.15} clearcoat={1} clearcoatRoughness={0.1} />
        </mesh>
        {/* pupil sits on the eyeball's front, so rotating the ball aims it */}
        <mesh position={[0, 0, 0.26]} scale={[1, 1.12, 0.5]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color={C.pupil} roughness={0.25} />
        </mesh>
        {/* catchlights */}
        <mesh position={[0.07, 0.1, 0.36]}>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshBasicMaterial color={C.white} toneMapped={false} />
        </mesh>
        <mesh position={[-0.06, -0.06, 0.36]}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color={C.white} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function arcTube(points: [number, number][], z: number, radius = 0.045) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, z)));
  return new THREE.TubeGeometry(curve, 32, radius, 10, false);
}

function Mascot({ mood, getLook }: { mood: MascotMood; getLook: () => { dx: number; dy: number } }) {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const eyesOpen = useRef<THREE.Group>(null!);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const look = useRef(new THREE.Vector2());
  const blink = useRef({ next: 2.2, t: -1 });
  const moodAt = useRef(0);
  const prevMood = useRef<MascotMood>(mood);

  const geo = useMemo(() => heartGeometry(0.36, { depth: 1.6, bevel: 1.3, curveSegments: 40 }), []);
  const bodyMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: C.body,
        roughness: 0.28,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        sheen: 0.8,
        sheenColor: new THREE.Color("#FFD0DC"),
        emissive: new THREE.Color("#7A1F3A"),
        emissiveIntensity: 0.12,
      }),
    [],
  );
  const mouthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.mouth, roughness: 0.4 }), []);

  const faceZ = 0.79;
  const mouths = useMemo(
    () => ({
      idle: arcTube([[-0.22, -0.3], [0, -0.42], [0.22, -0.3]], faceZ),
      busy: new THREE.TorusGeometry(0.1, 0.04, 12, 28),
      error: arcTube([[-0.2, -0.44], [0, -0.33], [0.2, -0.44]], faceZ),
      happyEyeL: arcTube([[-0.82, 0.24], [-0.6, 0.44], [-0.38, 0.24]], faceZ + 0.02, 0.055),
      happyEyeR: arcTube([[0.38, 0.24], [0.6, 0.44], [0.82, 0.24]], faceZ + 0.02, 0.055),
    }),
    [],
  );
  const happyMouth = useMemo(() => {
    const g = new THREE.CircleGeometry(0.24, 32, Math.PI, Math.PI);
    g.translate(0, -0.26, faceZ);
    return g;
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (prevMood.current !== mood) {
      prevMood.current = mood;
      moodAt.current = t;
    }
    const since = t - moodAt.current;

    // --- where to look (screen px → normalized, softly clamped)
    const { dx, dy } = getLook();
    let lx = Math.tanh(dx / 420);
    let ly = Math.tanh(-dy / 320);
    if (mood === "error") {
      lx = 0;
      ly = -0.9; // sad, looks down
    }
    look.current.x = THREE.MathUtils.damp(look.current.x, lx, 10, dt);
    look.current.y = THREE.MathUtils.damp(look.current.y, ly, 10, dt);

    // eyeballs turn toward the target
    for (const e of [eyeL.current, eyeR.current]) {
      if (!e) continue;
      e.rotation.y = look.current.x * 0.75;
      e.rotation.x = -look.current.y * 0.6;
    }

    // --- body: lean toward the pointer, idle breathing, mood moves
    const g = root.current;
    const b = body.current;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, look.current.x * 0.32, 4, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -look.current.y * 0.12, 4, dt);
    const breathe = 1 + Math.sin(t * 2.1) * 0.012;
    b.scale.set(BODY_SCALE * breathe, BODY_SCALE / breathe, BODY_SCALE);

    let hop = 0;
    let shake = 0;
    if (mood === "happy") hop = Math.abs(Math.sin(since * 7)) * 0.45 * Math.max(0, 1 - since / 1.6);
    if (mood === "error") shake = Math.sin(since * 34) * 0.16 * Math.max(0, 1 - since / 0.7);
    g.position.y = THREE.MathUtils.damp(g.position.y, hop + Math.sin(t * 1.6) * 0.04, 12, dt);
    g.rotation.z = shake;

    // --- blinking (squash the eye group), not while happy
    const bl = blink.current;
    if (bl.t < 0 && t > bl.next) bl.t = 0;
    let lid = 1;
    if (bl.t >= 0) {
      bl.t += dt;
      const p = bl.t / 0.16;
      lid = p < 0.5 ? 1 - p * 2 * 0.92 : 0.08 + (p - 0.5) * 2 * 0.92;
      if (p >= 1) {
        bl.t = -1;
        bl.next = t + 2 + Math.random() * 3.5;
        lid = 1;
      }
    }
    eyesOpen.current.scale.y = THREE.MathUtils.clamp(lid, 0.08, 1);
    eyesOpen.current.visible = mood !== "happy";
  });

  return (
    <>
      <group ref={root}>
        <group ref={body} position={[0, -0.3, 0]} scale={BODY_SCALE}>
          <mesh geometry={geo} material={bodyMat} />
          {/* face */}
          <group ref={eyesOpen} position={[0, 0.32, 0]}>
            <group position={[0, -0.32, 0]}>
              <Eye x={-0.6} groupRef={eyeL} />
              <Eye x={0.6} groupRef={eyeR} />
            </group>
          </group>
          {mood === "happy" && (
            <>
              <mesh geometry={mouths.happyEyeL} material={mouthMat} />
              <mesh geometry={mouths.happyEyeR} material={mouthMat} />
              <mesh geometry={happyMouth} material={mouthMat} />
            </>
          )}
          {mood === "idle" && <mesh geometry={mouths.idle} material={mouthMat} />}
          {mood === "error" && <mesh geometry={mouths.error} material={mouthMat} />}
          {mood === "busy" && <mesh geometry={mouths.busy} material={mouthMat} position={[0, -0.36, faceZ]} />}
          {/* blush */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.98, -0.12, 0.775]}>
              <circleGeometry args={[0.17, 24]} />
              <meshBasicMaterial color={C.cheek} transparent opacity={mood === "error" ? 0.2 : 0.55} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}

export default function HeartMascotScene({
  active,
  mood,
  hostRef,
}: {
  active: boolean;
  mood: MascotMood;
  hostRef: React.RefObject<HTMLDivElement | null>;
}) {
  const getLook = useGlobalLook(hostRef);
  // fov chosen so the canvas shows exactly VIEW_H units at z=0 from distance 9
  const fov = (2 * Math.atan(VIEW_H / 2 / 9) * 180) / Math.PI;
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 9], fov }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", pointerEvents: "none" }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[2, 4, 6]} intensity={1.6} color="#FFF1F4" />
      <pointLight position={[-4, 1, 4]} intensity={14} color="#E0A6FF" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.6} color="#FFE3EA" position={[0, 3, 5]} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={1.8} color="#F3C98B" position={[-4, 0, 3]} scale={2.5} />
        <Lightformer form="rect" intensity={1.2} color="#D64560" position={[4, -1, 3]} scale={[2, 5, 1]} />
      </Environment>
      <Mascot mood={mood} getLook={getLook} />
    </Canvas>
  );
}
