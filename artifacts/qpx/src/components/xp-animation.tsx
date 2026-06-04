import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { RankBadge } from "@/components/rank-badge";
import { RANK_COLORS, RANKS } from "@/lib/rank-constants";

// ─── XP Float ───────────────────────────────────────────────────────────────

interface XpFloatProps {
  amount: number;
  visible: boolean;
  onComplete?: () => void;
}

export function XpFloat({ amount, visible, onComplete }: XpFloatProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -80, scale: 1.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          onAnimationComplete={onComplete}
          className="pointer-events-none fixed z-50 font-black text-2xl"
          style={{
            color: "hsl(var(--primary))",
            textShadow: "0 0 24px hsl(var(--primary)), 0 0 8px #fff4",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          +{amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Audio ──────────────────────────────────────────────────────────────────

function playLevelUpSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch { /* ignore */ }
}

// ─── Particle helpers ───────────────────────────────────────────────────────

interface Particle {
  id: number;
  angle: number;
  dist: number;
  size: number;
  color: string;
  dur: number;
  delay: number;
  shape: "circle" | "rect";
}

const EXTRA_COLORS = ["#ffd700", "#ffffff", "#a8d8ea", "#ff6eb4", "#00ffaa"];

function makeParticles(rankColor: string): Particle[] {
  const palette = [rankColor, ...EXTRA_COLORS];
  return Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 360 + (Math.random() * 18 - 9);
    return {
      id: i,
      angle,
      dist: 90 + Math.random() * 180,
      size: 4 + Math.random() * 9,
      color: palette[Math.floor(Math.random() * palette.length)],
      dur: 0.7 + Math.random() * 1.1,
      delay: Math.random() * 0.25,
      shape: Math.random() > 0.5 ? "circle" : "rect",
    };
  });
}

// ─── LevelUpBanner ──────────────────────────────────────────────────────────

interface LevelUpBannerProps {
  visible: boolean;
  level: number;
  rankIndex?: number;
  onComplete?: () => void;
}

export function LevelUpBanner({
  visible,
  level,
  rankIndex = 0,
  onComplete,
}: LevelUpBannerProps) {
  const colors = RANK_COLORS[Math.min(rankIndex, RANK_COLORS.length - 1)] ?? RANK_COLORS[0];
  const rankName = RANKS[Math.min(rankIndex, RANKS.length - 1)] ?? "";
  const particles = useMemo(() => makeParticles(colors.from), [colors.from]);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      playLevelUpSound();
      autoRef.current = setTimeout(() => onComplete?.(), 5000);
    }
    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [visible]);

  const rays = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ id: i, angle: i * 22.5 })),
    []
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="level-up-overlay"
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ cursor: "pointer" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          transition={{ duration: 0.25 }}
          onClick={() => {
            if (autoRef.current) clearTimeout(autoRef.current);
            onComplete?.();
          }}
        >
          {/* ── Backdrop blur ────────────────────────────────── */}
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.82)",
              backdropFilter: "blur(6px)",
            }}
          />

          {/* ── Radial rank-color glow ────────────────────────── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0.4] }}
            transition={{ duration: 0.6 }}
            style={{
              background: `radial-gradient(circle 480px at 50% 50%, ${colors.from}30 0%, transparent 70%)`,
            }}
          />

          {/* ── Starburst rays ───────────────────────────────── */}
          <div className="absolute" style={{ width: 700, height: 700, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
            {rays.map((r) => (
              <motion.div
                key={r.id}
                initial={{ scaleX: 0, opacity: 0.8 }}
                animate={{ scaleX: 1, opacity: 0 }}
                transition={{ duration: 0.9, delay: 0.05 + r.id * 0.01, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 350,
                  height: 2,
                  marginTop: -1,
                  transformOrigin: "left center",
                  background: `linear-gradient(90deg, ${colors.from}cc, transparent)`,
                  transform: `rotate(${r.angle}deg)`,
                }}
              />
            ))}
          </div>

          {/* ── Shockwave rings ──────────────────────────────── */}
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              initial={{ width: 0, height: 0, opacity: 0.9 }}
              animate={{ width: 500 + i * 100, height: 500 + i * 100, opacity: 0 }}
              transition={{ duration: 1.2, delay, ease: "easeOut" }}
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                border: `2px solid ${colors.from}`,
                boxShadow: `0 0 20px ${colors.from}80`,
              }}
            />
          ))}

          {/* ── Particles ────────────────────────────────────── */}
          {particles.map((p) => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.dist;
            const ty = Math.sin(rad) * p.dist;
            return (
              <motion.div
                key={p.id}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: p.size,
                  height: p.size,
                  marginTop: -p.size / 2,
                  marginLeft: -p.size / 2,
                  borderRadius: p.shape === "circle" ? "50%" : "2px",
                  background: p.color,
                  boxShadow: `0 0 ${p.size + 2}px ${p.color}`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
                animate={{
                  x: tx,
                  y: ty,
                  opacity: 0,
                  scale: 0,
                  rotate: 360,
                }}
                transition={{ duration: p.dur, delay: p.delay, ease: "easeOut" }}
              />
            );
          })}

          {/* ── Main card ─────────────────────────────────────── */}
          <motion.div
            className="relative flex flex-col items-center gap-5 text-center select-none"
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.15, opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* LEVEL UP label */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              style={{
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.45em",
                textTransform: "uppercase",
                color: colors.from,
                textShadow: `0 0 16px ${colors.from}, 0 0 40px ${colors.glow}`,
              }}
            >
              ⚡&nbsp;&nbsp;LEVEL UP&nbsp;&nbsp;⚡
            </motion.div>

            {/* Rank badge — big + breathing glow */}
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                filter: `drop-shadow(0 0 32px ${colors.glow}) drop-shadow(0 0 60px ${colors.from}50)`,
              }}
            >
              <RankBadge rankIndex={rankIndex} size="xl" />
            </motion.div>

            {/* Level number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div
                style={{
                  fontSize: 80,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "#ffffff",
                  textShadow: `0 0 32px ${colors.from}, 0 4px 0 #0008`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {level}
              </div>
            </motion.div>

            {/* Rank name */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: colors.from,
                textShadow: `0 0 12px ${colors.from}`,
              }}
            >
              {rankName}
            </motion.div>

            {/* Tap hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{ delay: 1.8, duration: 2, repeat: Infinity }}
              style={{
                marginTop: 8,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Tap anywhere to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
