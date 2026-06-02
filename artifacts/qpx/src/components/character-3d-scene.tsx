import { useRef, useMemo, Component, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sky, OrbitControls, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";

// ─── WebGL Error Boundary ────────────────────────────────────────────────────
interface EBState { hasError: boolean }
export class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, EBState> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
import { RANKS, RANK_COLORS } from "./rank-badge";

// ─── Skin & outfit tones ───────────────────────────────────────────────────
const SKIN_COLOR = "#c68642";
const SKIN_DARK = "#a0632a";
const HAIR_COLOR = "#1a0a00";
const OUTFIT_BOTTOM = "#e8e8e8";

// ─── Body scale by rank ────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getBodyScale(rankIndex: number) {
  const t = rankIndex / 9;
  return {
    shoulderWidth: lerp(0.32, 0.52, t),
    chestDepth: lerp(0.16, 0.26, t),
    waistWidth: lerp(0.22, 0.30, t),
    armRadius: lerp(0.055, 0.10, t),
    legRadius: lerp(0.07, 0.125, t),
    neckRadius: lerp(0.065, 0.09, t),
    muscleGlow: t > 0.5,
  };
}

// ─── Material helpers ───────────────────────────────────────────────────────
function skinMat(roughness = 0.7) {
  return <meshStandardMaterial color={SKIN_COLOR} roughness={roughness} metalness={0.0} />;
}

// ─── Tree component ─────────────────────────────────────────────────────────
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.4, 8]} />
        <meshStandardMaterial color="#5c3d1a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[0.85, 1.8, 8]} />
        <meshStandardMaterial color="#2d6a1f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.95, 0]} castShadow>
        <coneGeometry args={[0.6, 1.4, 8]} />
        <meshStandardMaterial color="#3a8a28" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.65, 0]} castShadow>
        <coneGeometry args={[0.35, 1.0, 8]} />
        <meshStandardMaterial color="#4aaa34" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Cloud component ─────────────────────────────────────────────────────────
function Cloud({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[
        [0, 0, 0, 0.6],
        [0.5, 0.1, 0, 0.5],
        [-0.5, 0.05, 0, 0.45],
        [0.25, 0.25, 0, 0.4],
        [-0.2, 0.2, 0, 0.38],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <sphereGeometry args={[r as number, 7, 7]} />
          <meshStandardMaterial color="white" roughness={1} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Grass platform ─────────────────────────────────────────────────────────
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.22, 0]} receiveShadow>
        <circleGeometry args={[18, 40]} />
        <meshStandardMaterial color="#4a9e3f" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.21, 0]} receiveShadow>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial color="#5ec44f" roughness={0.85} />
      </mesh>
    </>
  );
}

// ─── Rank aura/particles for high ranks ─────────────────────────────────────
function RankAura({ rankIndex, colors }: { rankIndex: number; colors: { from: string; to: string; glow: string } }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 1.2;
    }
  });
  if (rankIndex < 5) return null;
  return (
    <mesh ref={ringRef} position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.8, 0.04, 8, 48]} />
      <meshStandardMaterial
        color={colors.from}
        emissive={colors.from}
        emissiveIntensity={1.5}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}

// ─── 3D Human Character ─────────────────────────────────────────────────────
function HumanCharacter({ rankIndex, level }: { rankIndex: number; level: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const s = getBodyScale(rankIndex);
  const rankColor = RANK_COLORS[rankIndex];

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.012;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = 0.18 + Math.sin(t * 1.2) * 0.025;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = -(0.18 + Math.sin(t * 1.2) * 0.025);
    }
  });

  const skinMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SKIN_COLOR, roughness: 0.65, metalness: 0 }),
    []
  );
  const skinDarkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SKIN_DARK, roughness: 0.7, metalness: 0 }),
    []
  );
  const hairMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: HAIR_COLOR, roughness: 0.8, metalness: 0 }),
    []
  );
  const outfitMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: OUTFIT_BOTTOM, roughness: 0.5, metalness: 0.1 }),
    []
  );
  const rankGlowMat = useMemo(
    () =>
      rankIndex >= 5
        ? new THREE.MeshStandardMaterial({
            color: rankColor.from,
            emissive: rankColor.from,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0.15,
          })
        : null,
    [rankIndex, rankColor.from]
  );

  const sw = s.shoulderWidth;
  const aw = s.armRadius;
  const lw = s.legRadius;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── HEAD ── */}
      <group position={[0, 1.68, 0]}>
        {/* Skull */}
        <mesh material={skinMaterial} castShadow>
          <sphereGeometry args={[0.155, 16, 16]} />
        </mesh>
        {/* Face plane (slightly flattened front) */}
        <mesh position={[0, -0.01, 0.11]} material={skinMaterial}>
          <sphereGeometry args={[0.118, 12, 12]} />
        </mesh>
        {/* Ears */}
        <mesh position={[0.155, 0, 0.01]} material={skinMaterial}>
          <sphereGeometry args={[0.038, 8, 8]} />
        </mesh>
        <mesh position={[-0.155, 0, 0.01]} material={skinMaterial}>
          <sphereGeometry args={[0.038, 8, 8]} />
        </mesh>
        {/* Brow ridge */}
        <mesh position={[0, 0.04, 0.13]} material={skinMaterial}>
          <boxGeometry args={[0.19, 0.035, 0.035]} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.025, 0.155]} material={skinDarkMaterial}>
          <sphereGeometry args={[0.025, 6, 6]} />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.055, 0.04, 0.145]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#1a0e00" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[-0.055, 0.04, 0.145]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#1a0e00" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Lips */}
        <mesh position={[0, -0.065, 0.15]} material={skinDarkMaterial}>
          <boxGeometry args={[0.07, 0.018, 0.01]} />
        </mesh>
        {/* Chin */}
        <mesh position={[0, -0.1, 0.12]} material={skinMaterial}>
          <sphereGeometry args={[0.04, 8, 8]} />
        </mesh>
        {/* Hair cap (bald/shaved) */}
        <mesh position={[0, 0.06, -0.02]} material={hairMaterial}>
          <sphereGeometry args={[0.158, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.49, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[s.neckRadius, s.neckRadius * 1.1, 0.18, 10]} />
      </mesh>

      {/* ── TORSO ── */}
      <group position={[0, 1.12, 0]}>
        {/* Upper chest */}
        <mesh material={skinMaterial} castShadow>
          <boxGeometry args={[sw * 2, 0.28, s.chestDepth * 2]} />
        </mesh>
        {/* Pec definition left */}
        <mesh position={[sw * 0.38, 0.06, s.chestDepth * 0.8]} material={skinMaterial}>
          <sphereGeometry args={[sw * 0.28, 10, 10]} />
        </mesh>
        {/* Pec definition right */}
        <mesh position={[-sw * 0.38, 0.06, s.chestDepth * 0.8]} material={skinMaterial}>
          <sphereGeometry args={[sw * 0.28, 10, 10]} />
        </mesh>
        {/* Mid torso / abs */}
        <mesh position={[0, -0.28, 0]} material={skinMaterial} castShadow>
          <boxGeometry args={[s.waistWidth * 2, 0.28, s.chestDepth * 1.7]} />
        </mesh>
        {/* Ab lines (subtle) */}
        {rankIndex >= 1 && [0.06, -0.04, -0.14].map((y, i) => (
          <mesh key={i} position={[0, y - 0.22, s.chestDepth * 1.6]} material={skinDarkMaterial}>
            <boxGeometry args={[s.waistWidth * 1.4, 0.012, 0.012]} />
          </mesh>
        ))}
        {/* Rank glow overlay */}
        {rankGlowMat && (
          <mesh material={rankGlowMat}>
            <boxGeometry args={[sw * 2.1, 0.62, s.chestDepth * 2.1]} />
          </mesh>
        )}
      </group>

      {/* ── SHOULDERS ── */}
      <mesh position={[sw + 0.06, 1.32, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[aw * 1.4, 10, 10]} />
      </mesh>
      <mesh position={[-(sw + 0.06), 1.32, 0]} material={skinMaterial} castShadow>
        <sphereGeometry args={[aw * 1.4, 10, 10]} />
      </mesh>

      {/* ── ARMS ── */}
      {/* Left arm */}
      <group ref={leftArmRef} position={[sw + 0.06, 1.28, 0]}>
        {/* Upper arm */}
        <mesh position={[0.08, -0.2, 0]} rotation={[0, 0, 0.18]} material={skinMaterial} castShadow>
          <cylinderGeometry args={[aw, aw * 0.9, 0.36, 10]} />
        </mesh>
        {/* Elbow */}
        <mesh position={[0.14, -0.41, 0]} material={skinMaterial}>
          <sphereGeometry args={[aw * 0.85, 8, 8]} />
        </mesh>
        {/* Forearm */}
        <mesh position={[0.19, -0.62, 0]} rotation={[0, 0, 0.22]} material={skinMaterial} castShadow>
          <cylinderGeometry args={[aw * 0.82, aw * 0.7, 0.34, 10]} />
        </mesh>
        {/* Wrist */}
        <mesh position={[0.25, -0.8, 0]} material={skinMaterial}>
          <sphereGeometry args={[aw * 0.65, 8, 8]} />
        </mesh>
        {/* Hand */}
        <mesh position={[0.28, -0.9, 0]} material={skinMaterial}>
          <boxGeometry args={[0.085, 0.12, 0.045]} />
        </mesh>
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[-(sw + 0.06), 1.28, 0]}>
        <mesh position={[-0.08, -0.2, 0]} rotation={[0, 0, -0.18]} material={skinMaterial} castShadow>
          <cylinderGeometry args={[aw, aw * 0.9, 0.36, 10]} />
        </mesh>
        <mesh position={[-0.14, -0.41, 0]} material={skinMaterial}>
          <sphereGeometry args={[aw * 0.85, 8, 8]} />
        </mesh>
        <mesh position={[-0.19, -0.62, 0]} rotation={[0, 0, -0.22]} material={skinMaterial} castShadow>
          <cylinderGeometry args={[aw * 0.82, aw * 0.7, 0.34, 10]} />
        </mesh>
        <mesh position={[-0.25, -0.8, 0]} material={skinMaterial}>
          <sphereGeometry args={[aw * 0.65, 8, 8]} />
        </mesh>
        <mesh position={[-0.28, -0.9, 0]} material={skinMaterial}>
          <boxGeometry args={[0.085, 0.12, 0.045]} />
        </mesh>
      </group>

      {/* ── HIPS / PELVIS ── */}
      <group position={[0, 0.65, 0]}>
        <mesh material={skinMaterial} castShadow>
          <boxGeometry args={[s.waistWidth * 2.1, 0.14, s.chestDepth * 1.65]} />
        </mesh>
        {/* Shorts/boxer */}
        <mesh position={[0, -0.1, 0]} material={outfitMaterial} castShadow>
          <boxGeometry args={[s.waistWidth * 2.2, 0.25, s.chestDepth * 1.75]} />
        </mesh>
        {/* Waistband */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[s.waistWidth * 2.25, 0.04, s.chestDepth * 1.78]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>
      </group>

      {/* ── LEGS ── */}
      {/* Left thigh */}
      <mesh position={[lw * 0.85, 0.28, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[lw, lw * 0.85, 0.44, 10]} />
      </mesh>
      {/* Left knee */}
      <mesh position={[lw * 0.88, 0.035, 0.01]} material={skinMaterial}>
        <sphereGeometry args={[lw * 0.8, 10, 10]} />
      </mesh>
      {/* Left calf */}
      <mesh position={[lw * 0.88, -0.28, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[lw * 0.78, lw * 0.6, 0.5, 10]} />
      </mesh>
      {/* Left ankle */}
      <mesh position={[lw * 0.88, -0.545, 0]} material={skinMaterial}>
        <sphereGeometry args={[lw * 0.52, 8, 8]} />
      </mesh>
      {/* Left foot */}
      <mesh position={[lw * 0.88, -0.65, 0.04]} material={skinMaterial}>
        <boxGeometry args={[lw * 1.2, 0.085, 0.22]} />
      </mesh>
      <mesh position={[lw * 0.88, -0.69, 0.1]} material={skinMaterial}>
        <sphereGeometry args={[lw * 0.4, 8, 8]} />
      </mesh>

      {/* Right thigh */}
      <mesh position={[-lw * 0.85, 0.28, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[lw, lw * 0.85, 0.44, 10]} />
      </mesh>
      {/* Right knee */}
      <mesh position={[-lw * 0.88, 0.035, 0.01]} material={skinMaterial}>
        <sphereGeometry args={[lw * 0.8, 10, 10]} />
      </mesh>
      {/* Right calf */}
      <mesh position={[-lw * 0.88, -0.28, 0]} material={skinMaterial} castShadow>
        <cylinderGeometry args={[lw * 0.78, lw * 0.6, 0.5, 10]} />
      </mesh>
      {/* Right ankle */}
      <mesh position={[-lw * 0.88, -0.545, 0]} material={skinMaterial}>
        <sphereGeometry args={[lw * 0.52, 8, 8]} />
      </mesh>
      {/* Right foot */}
      <mesh position={[-lw * 0.88, -0.65, 0.04]} material={skinMaterial}>
        <boxGeometry args={[lw * 1.2, 0.085, 0.22]} />
      </mesh>
      <mesh position={[-lw * 0.88, -0.69, 0.1]} material={skinMaterial}>
        <sphereGeometry args={[lw * 0.4, 8, 8]} />
      </mesh>

      {/* ── Rank AURA ── */}
      <RankAura rankIndex={rankIndex} colors={rankColor} />

      {/* ── LEVEL LABEL (floating above head) ── */}
      <Billboard position={[0, 2.1, 0]}>
        <Text
          fontSize={0.13}
          color={rankColor.from}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#000000"
        >
          {`Lv.${level}  ${RANKS[rankIndex]}`}
        </Text>
      </Billboard>
    </group>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────
function Scene({ rankIndex, level }: { rankIndex: number; level: number }) {
  const treePositions: [number, number, number][] = [
    [6, -1.22, -4],
    [-6.5, -1.22, -5],
    [9, -1.22, -2],
    [-9, -1.22, -3],
    [4, -1.22, -8],
    [-4.5, -1.22, -7],
    [11, -1.22, -7],
    [-11, -1.22, -6],
    [7, -1.22, 3],
    [-7, -1.22, 2],
  ];

  return (
    <>
      {/* Sky */}
      <Sky sunPosition={[100, 20, 100]} turbidity={4} rayleigh={2} />

      {/* Lighting */}
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight args={["#87ceeb", "#4a9e3f", 0.5]} />

      {/* Ground */}
      <Ground />

      {/* Trees */}
      {treePositions.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}

      {/* Clouds (static, far back) */}
      <Cloud position={[8, 6, -12]} />
      <Cloud position={[-7, 7, -14]} />
      <Cloud position={[0, 8, -16]} />
      <Cloud position={[14, 5.5, -10]} />

      {/* Character */}
      <HumanCharacter rankIndex={rankIndex} level={level} />

      {/* Shadow plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.215, 0]} receiveShadow>
        <circleGeometry args={[1.2, 24]} />
        <meshStandardMaterial color="#2d7a20" transparent opacity={0.35} />
      </mesh>

      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={7}
        maxPolarAngle={Math.PI / 2}
        target={[0, 0.5, 0]}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </>
  );
}

// ─── WebGL support detection ─────────────────────────────────────────────────
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!ctx) return false;
    const ext = (ctx as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
    return true;
  } catch {
    return false;
  }
}

// ─── Public component ────────────────────────────────────────────────────────
interface CharacterScene3DProps {
  rankIndex: number;
  level: number;
}

export default function CharacterScene3D({ rankIndex, level }: CharacterScene3DProps) {
  if (!isWebGLSupported()) {
    return null; // Caller will show fallback via Suspense/ErrorBoundary
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "#87ceeb" }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: false, failIfMajorPerformanceCaveat: false }}
        onCreated={({ gl }) => {
          if (!gl.getContext()) throw new Error("WebGL context unavailable");
        }}
      >
        <Scene rankIndex={rankIndex} level={level} />
      </Canvas>
    </div>
  );
}
