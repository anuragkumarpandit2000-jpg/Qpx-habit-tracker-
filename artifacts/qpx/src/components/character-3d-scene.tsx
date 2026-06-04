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
import { RANKS, RANK_COLORS } from "@/lib/rank-constants";

// ─── Skin tones ─────────────────────────────────────────────────────────────
const SKIN_COLOR = "#c68642";
const SKIN_DARK  = "#a0632a";
const HAIR_COLOR = "#1a0a00";

// ─── Outfit visuals per outfit name ─────────────────────────────────────────
interface OutfitVisual {
  color: string;
  metalness: number;
  roughness: number;
  accentColor: string;
  /** 0=bare, 1=chest plate, 2=shoulders+chest, 3=full armor */
  tier: number;
}

const OUTFIT_VISUALS: Record<string, OutfitVisual> = {
  "Recruit Uniform": { color: "#e8e8e8", metalness: 0.05, roughness: 0.6, accentColor: "#cc2222", tier: 0 },
  "Cadet Armor":     { color: "#1e3a6e", metalness: 0.30, roughness: 0.4, accentColor: "#4a90d9", tier: 1 },
  "Warrior Plate":   { color: "#3a3a4a", metalness: 0.60, roughness: 0.3, accentColor: "#9090a8", tier: 2 },
  "Champion's Gear": { color: "#2d1655", metalness: 0.70, roughness: 0.2, accentColor: "#b07cdd", tier: 3 },
  "Titan Armor":     { color: "#7a5500", metalness: 0.90, roughness: 0.1, accentColor: "#ffd700", tier: 3 },
};
const DEFAULT_VIS = OUTFIT_VISUALS["Recruit Uniform"];

// ─── Body scale by rank ──────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function getBodyScale(rankIndex: number) {
  const t = rankIndex / 9;
  return {
    shoulderWidth: lerp(0.32, 0.52, t),
    chestDepth:    lerp(0.16, 0.26, t),
    waistWidth:    lerp(0.22, 0.30, t),
    armRadius:     lerp(0.055, 0.10, t),
    legRadius:     lerp(0.07,  0.125, t),
    neckRadius:    lerp(0.065, 0.09, t),
  };
}

// ─── Tree ────────────────────────────────────────────────────────────────────
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

// ─── Cloud ───────────────────────────────────────────────────────────────────
function Cloud({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[[0,0,0,0.6],[0.5,0.1,0,0.5],[-0.5,0.05,0,0.45],[0.25,0.25,0,0.4],[-0.2,0.2,0,0.38]].map(([x,y,z,r], i) => (
        <mesh key={i} position={[x,y,z]}>
          <sphereGeometry args={[r, 7, 7]} />
          <meshStandardMaterial color="white" roughness={1} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Ground ──────────────────────────────────────────────────────────────────
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

// ─── Rank aura ───────────────────────────────────────────────────────────────
function RankAura({ rankIndex, colors }: { rankIndex: number; colors: { from: string; to: string; glow: string } }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 1.2;
  });
  if (rankIndex < 5) return null;
  return (
    <mesh ref={ringRef} position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.8, 0.04, 8, 48]} />
      <meshStandardMaterial color={colors.from} emissive={colors.from} emissiveIntensity={1.5} transparent opacity={0.7} />
    </mesh>
  );
}

// ─── Human Character ─────────────────────────────────────────────────────────
function HumanCharacter({
  rankIndex,
  level,
  equippedOutfit = "Recruit Uniform",
}: {
  rankIndex: number;
  level: number;
  equippedOutfit?: string;
}) {
  const groupRef    = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const timeRef     = useRef(0);

  const s         = getBodyScale(rankIndex);
  const rankColor = RANK_COLORS[rankIndex];
  const ov        = OUTFIT_VISUALS[equippedOutfit] ?? DEFAULT_VIS;

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    if (groupRef.current)    groupRef.current.position.y = Math.sin(t * 1.2) * 0.012;
    if (leftArmRef.current)  leftArmRef.current.rotation.z  =  0.18 + Math.sin(t * 1.2) * 0.025;
    if (rightArmRef.current) rightArmRef.current.rotation.z = -(0.18 + Math.sin(t * 1.2) * 0.025);
  });

  const skinMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN_COLOR, roughness: 0.65, metalness: 0 }), []);
  const skinDark = useMemo(() => new THREE.MeshStandardMaterial({ color: SKIN_DARK,  roughness: 0.7,  metalness: 0 }), []);
  const hairMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: HAIR_COLOR, roughness: 0.8,  metalness: 0 }), []);

  const outfitMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ov.color, roughness: ov.roughness, metalness: ov.metalness }),
    [ov.color, ov.roughness, ov.metalness]
  );
  const accentMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: ov.accentColor, roughness: 0.2, metalness: Math.min(ov.metalness + 0.15, 1) }),
    [ov.accentColor, ov.metalness]
  );
  const glowMat = useMemo(
    () => rankIndex >= 5
      ? new THREE.MeshStandardMaterial({ color: rankColor.from, emissive: rankColor.from, emissiveIntensity: 0.4, transparent: true, opacity: 0.15 })
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
        <mesh material={skinMat} castShadow><sphereGeometry args={[0.155, 16, 16]} /></mesh>
        <mesh position={[0, -0.01, 0.11]} material={skinMat}><sphereGeometry args={[0.118, 12, 12]} /></mesh>
        <mesh position={[ 0.155, 0, 0.01]} material={skinMat}><sphereGeometry args={[0.038, 8, 8]} /></mesh>
        <mesh position={[-0.155, 0, 0.01]} material={skinMat}><sphereGeometry args={[0.038, 8, 8]} /></mesh>
        <mesh position={[0, 0.04, 0.13]} material={skinMat}><boxGeometry args={[0.19, 0.035, 0.035]} /></mesh>
        <mesh position={[0, -0.025, 0.155]} material={skinDark}><sphereGeometry args={[0.025, 6, 6]} /></mesh>
        <mesh position={[ 0.055, 0.04, 0.145]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#1a0e00" roughness={0.3} metalness={0.1} /></mesh>
        <mesh position={[-0.055, 0.04, 0.145]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#1a0e00" roughness={0.3} metalness={0.1} /></mesh>
        <mesh position={[0, -0.065, 0.15]} material={skinDark}><boxGeometry args={[0.07, 0.018, 0.01]} /></mesh>
        <mesh position={[0, -0.1, 0.12]} material={skinMat}><sphereGeometry args={[0.04, 8, 8]} /></mesh>
        <mesh position={[0, 0.06, -0.02]} material={hairMat}>
          <sphereGeometry args={[0.158, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        </mesh>
      </group>

      {/* ── NECK ── */}
      <mesh position={[0, 1.49, 0]} material={skinMat} castShadow>
        <cylinderGeometry args={[s.neckRadius, s.neckRadius * 1.1, 0.18, 10]} />
      </mesh>

      {/* ── TORSO ── */}
      <group position={[0, 1.12, 0]}>
        <mesh material={skinMat} castShadow><boxGeometry args={[sw * 2, 0.28, s.chestDepth * 2]} /></mesh>
        <mesh position={[ sw * 0.38, 0.06, s.chestDepth * 0.8]} material={skinMat}><sphereGeometry args={[sw * 0.28, 10, 10]} /></mesh>
        <mesh position={[-sw * 0.38, 0.06, s.chestDepth * 0.8]} material={skinMat}><sphereGeometry args={[sw * 0.28, 10, 10]} /></mesh>
        <mesh position={[0, -0.28, 0]} material={skinMat} castShadow><boxGeometry args={[s.waistWidth * 2, 0.28, s.chestDepth * 1.7]} /></mesh>
        {rankIndex >= 1 && [0.06, -0.04, -0.14].map((y, i) => (
          <mesh key={i} position={[0, y - 0.22, s.chestDepth * 1.6]} material={skinDark}>
            <boxGeometry args={[s.waistWidth * 1.4, 0.012, 0.012]} />
          </mesh>
        ))}
        {glowMat && <mesh material={glowMat}><boxGeometry args={[sw * 2.1, 0.62, s.chestDepth * 2.1]} /></mesh>}

        {/* ── CHEST PLATE (Cadet Armor +) ── */}
        {ov.tier >= 1 && (
          <>
            <mesh position={[0, 0.06, s.chestDepth + 0.01]} material={accentMat} castShadow>
              <boxGeometry args={[sw * 1.5, 0.22, 0.03]} />
            </mesh>
            <mesh position={[0, 0.18, s.chestDepth + 0.01]} material={outfitMat}>
              <boxGeometry args={[sw * 1.3, 0.055, 0.04]} />
            </mesh>
            <mesh position={[0, 0.06, s.chestDepth + 0.026]} material={outfitMat}>
              <boxGeometry args={[sw * 0.38, 0.13, 0.025]} />
            </mesh>
          </>
        )}
      </group>

      {/* ── SHOULDERS (skin) ── */}
      <mesh position={[ sw + 0.06, 1.32, 0]} material={skinMat} castShadow><sphereGeometry args={[aw * 1.4, 10, 10]} /></mesh>
      <mesh position={[-(sw + 0.06), 1.32, 0]} material={skinMat} castShadow><sphereGeometry args={[aw * 1.4, 10, 10]} /></mesh>

      {/* ── SHOULDER PADS (Warrior Plate +) ── */}
      {ov.tier >= 2 && (
        <>
          <mesh position={[ sw + 0.06, 1.34, 0]} material={accentMat} castShadow><sphereGeometry args={[aw * 1.95, 10, 10]} /></mesh>
          <mesh position={[-(sw + 0.06), 1.34, 0]} material={accentMat} castShadow><sphereGeometry args={[aw * 1.95, 10, 10]} /></mesh>
          <mesh position={[ sw + 0.06, 1.43, 0]} material={outfitMat}><cylinderGeometry args={[aw * 1.0, aw * 1.6, 0.08, 10]} /></mesh>
          <mesh position={[-(sw + 0.06), 1.43, 0]} material={outfitMat}><cylinderGeometry args={[aw * 1.0, aw * 1.6, 0.08, 10]} /></mesh>
        </>
      )}

      {/* ── LEFT ARM ── */}
      <group ref={leftArmRef} position={[sw + 0.06, 1.28, 0]}>
        <mesh position={[0.08, -0.2, 0]} rotation={[0,0,0.18]} material={skinMat} castShadow>
          <cylinderGeometry args={[aw, aw * 0.9, 0.36, 10]} />
        </mesh>
        <mesh position={[0.14, -0.41, 0]} material={skinMat}><sphereGeometry args={[aw * 0.85, 8, 8]} /></mesh>
        <mesh position={[0.19, -0.62, 0]} rotation={[0,0,0.22]} material={skinMat} castShadow>
          <cylinderGeometry args={[aw * 0.82, aw * 0.7, 0.34, 10]} />
        </mesh>
        {ov.tier >= 3 && (
          <mesh position={[0.19, -0.62, 0]} rotation={[0,0,0.22]} material={accentMat}>
            <cylinderGeometry args={[aw * 0.84, aw * 0.72, 0.28, 10]} />
          </mesh>
        )}
        <mesh position={[0.25, -0.8, 0]} material={skinMat}><sphereGeometry args={[aw * 0.65, 8, 8]} /></mesh>
        <mesh position={[0.28, -0.9, 0]} material={skinMat}><boxGeometry args={[0.085, 0.12, 0.045]} /></mesh>
      </group>

      {/* ── RIGHT ARM ── */}
      <group ref={rightArmRef} position={[-(sw + 0.06), 1.28, 0]}>
        <mesh position={[-0.08, -0.2, 0]} rotation={[0,0,-0.18]} material={skinMat} castShadow>
          <cylinderGeometry args={[aw, aw * 0.9, 0.36, 10]} />
        </mesh>
        <mesh position={[-0.14, -0.41, 0]} material={skinMat}><sphereGeometry args={[aw * 0.85, 8, 8]} /></mesh>
        <mesh position={[-0.19, -0.62, 0]} rotation={[0,0,-0.22]} material={skinMat} castShadow>
          <cylinderGeometry args={[aw * 0.82, aw * 0.7, 0.34, 10]} />
        </mesh>
        {ov.tier >= 3 && (
          <mesh position={[-0.19, -0.62, 0]} rotation={[0,0,-0.22]} material={accentMat}>
            <cylinderGeometry args={[aw * 0.84, aw * 0.72, 0.28, 10]} />
          </mesh>
        )}
        <mesh position={[-0.25, -0.8, 0]} material={skinMat}><sphereGeometry args={[aw * 0.65, 8, 8]} /></mesh>
        <mesh position={[-0.28, -0.9, 0]} material={skinMat}><boxGeometry args={[0.085, 0.12, 0.045]} /></mesh>
      </group>

      {/* ── HIPS / SHORTS ── */}
      <group position={[0, 0.65, 0]}>
        <mesh material={skinMat} castShadow><boxGeometry args={[s.waistWidth * 2.1, 0.14, s.chestDepth * 1.65]} /></mesh>
        <mesh position={[0, -0.1, 0]} material={outfitMat} castShadow>
          <boxGeometry args={[s.waistWidth * 2.2, 0.25, s.chestDepth * 1.75]} />
        </mesh>
        {/* Waistband — outfit accent color */}
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[s.waistWidth * 2.25, 0.04, s.chestDepth * 1.78]} />
          <meshStandardMaterial color={ov.accentColor} roughness={0.3} metalness={ov.metalness} />
        </mesh>
        {/* Belt buckle for armored tiers */}
        {ov.tier >= 1 && (
          <mesh position={[0, 0.01, s.chestDepth * 0.92]}>
            <boxGeometry args={[0.1, 0.055, 0.03]} />
            <meshStandardMaterial color={ov.accentColor} roughness={0.1} metalness={1} />
          </mesh>
        )}
      </group>

      {/* ── LEGS ── */}
      {/* Left leg */}
      <mesh position={[ lw * 0.85, 0.28, 0]} material={skinMat} castShadow><cylinderGeometry args={[lw, lw * 0.85, 0.44, 10]} /></mesh>
      <mesh position={[ lw * 0.88, 0.035, 0.01]} material={skinMat}><sphereGeometry args={[lw * 0.8, 10, 10]} /></mesh>
      <mesh position={[ lw * 0.88, -0.28, 0]} material={skinMat} castShadow><cylinderGeometry args={[lw * 0.78, lw * 0.6, 0.5, 10]} /></mesh>
      {ov.tier >= 3 && (
        <mesh position={[lw * 0.88, -0.28, 0]} material={accentMat}>
          <cylinderGeometry args={[lw * 0.80, lw * 0.62, 0.4, 10]} />
        </mesh>
      )}
      <mesh position={[ lw * 0.88, -0.545, 0]} material={skinMat}><sphereGeometry args={[lw * 0.52, 8, 8]} /></mesh>
      <mesh position={[ lw * 0.88, -0.65, 0.04]} material={skinMat}><boxGeometry args={[lw * 1.2, 0.085, 0.22]} /></mesh>
      <mesh position={[ lw * 0.88, -0.69, 0.1]} material={skinMat}><sphereGeometry args={[lw * 0.4, 8, 8]} /></mesh>

      {/* Right leg */}
      <mesh position={[-lw * 0.85, 0.28, 0]} material={skinMat} castShadow><cylinderGeometry args={[lw, lw * 0.85, 0.44, 10]} /></mesh>
      <mesh position={[-lw * 0.88, 0.035, 0.01]} material={skinMat}><sphereGeometry args={[lw * 0.8, 10, 10]} /></mesh>
      <mesh position={[-lw * 0.88, -0.28, 0]} material={skinMat} castShadow><cylinderGeometry args={[lw * 0.78, lw * 0.6, 0.5, 10]} /></mesh>
      {ov.tier >= 3 && (
        <mesh position={[-lw * 0.88, -0.28, 0]} material={accentMat}>
          <cylinderGeometry args={[lw * 0.80, lw * 0.62, 0.4, 10]} />
        </mesh>
      )}
      <mesh position={[-lw * 0.88, -0.545, 0]} material={skinMat}><sphereGeometry args={[lw * 0.52, 8, 8]} /></mesh>
      <mesh position={[-lw * 0.88, -0.65, 0.04]} material={skinMat}><boxGeometry args={[lw * 1.2, 0.085, 0.22]} /></mesh>
      <mesh position={[-lw * 0.88, -0.69, 0.1]} material={skinMat}><sphereGeometry args={[lw * 0.4, 8, 8]} /></mesh>

      {/* ── RANK AURA ── */}
      <RankAura rankIndex={rankIndex} colors={rankColor} />

      {/* ── FLOATING LEVEL LABEL ── */}
      <Billboard position={[0, 2.1, 0]}>
        <Text fontSize={0.13} color={rankColor.from} anchorX="center" anchorY="middle" outlineWidth={0.008} outlineColor="#000000">
          {`Lv.${level}  ${RANKS[rankIndex]}`}
        </Text>
      </Billboard>
    </group>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────
function Scene({ rankIndex, level, equippedOutfit }: { rankIndex: number; level: number; equippedOutfit: string }) {
  const treePositions: [number, number, number][] = [
    [6,-1.22,-4], [-6.5,-1.22,-5], [9,-1.22,-2], [-9,-1.22,-3],
    [4,-1.22,-8], [-4.5,-1.22,-7], [11,-1.22,-7], [-11,-1.22,-6],
    [7,-1.22,3],  [-7,-1.22,2],
  ];
  return (
    <>
      <Sky sunPosition={[100, 20, 100]} turbidity={4} rayleigh={2} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 5]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
      <hemisphereLight args={["#87ceeb", "#4a9e3f", 0.5]} />
      <Ground />
      {treePositions.map((pos, i) => <Tree key={i} position={pos} />)}
      <Cloud position={[8, 6, -12]} />
      <Cloud position={[-7, 7, -14]} />
      <Cloud position={[0, 8, -16]} />
      <Cloud position={[14, 5.5, -10]} />
      <HumanCharacter rankIndex={rankIndex} level={level} equippedOutfit={equippedOutfit} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.215, 0]} receiveShadow>
        <circleGeometry args={[1.2, 24]} />
        <meshStandardMaterial color="#2d7a20" transparent opacity={0.35} />
      </mesh>
      <OrbitControls enablePan={false} minDistance={2.5} maxDistance={7} maxPolarAngle={Math.PI / 2} target={[0, 0.5, 0]} autoRotate autoRotateSpeed={0.6} />
    </>
  );
}

// ─── WebGL detection ─────────────────────────────────────────────────────────
function isWebGLSupported(): boolean {
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!ctx) return false;
    const ext = (ctx as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
    return true;
  } catch { return false; }
}

// ─── Public export ───────────────────────────────────────────────────────────
interface CharacterScene3DProps {
  rankIndex: number;
  level: number;
  equippedOutfit?: string;
}

export default function CharacterScene3D({ rankIndex, level, equippedOutfit = "Recruit Uniform" }: CharacterScene3DProps) {
  if (!isWebGLSupported()) return null;
  return (
    <div style={{ width: "100%", height: "100%", background: "#87ceeb" }}>
      <Canvas shadows camera={{ position: [0, 1.2, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: false, failIfMajorPerformanceCaveat: false }}
        onCreated={({ gl }) => { if (!gl.getContext()) throw new Error("WebGL context unavailable"); }}>
        <Scene rankIndex={rankIndex} level={level} equippedOutfit={equippedOutfit} />
      </Canvas>
    </div>
  );
}
