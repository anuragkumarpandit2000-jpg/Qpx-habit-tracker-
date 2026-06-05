import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SEASON_DATA } from "@/lib/season-data";

export interface SeasonStats {
  totalXp: number;
  streak: number;
  longestStreak: number;
  finalRank: string;
  finalTitle: string;
  level: number;
  questsCompleted: number;
}

interface SeasonTransitionProps {
  completedSeason: number;
  nextSeason: number;
  stats: SeasonStats;
  onComplete: () => void;
}

// ─── Web Audio sound effects ──────────────────────────────────────────────────
function playSound(type: "fanfare" | "page" | "reveal" | "reward") {
  try {
    const ctx = new AudioContext();
    if (type === "fanfare") {
      [261, 329, 392, 523, 659, 784, 1046].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.04);
        gain.gain.linearRampToValueAtTime(0, t + 0.45);
        osc.start(t);
        osc.stop(t + 0.5);
      });
    } else if (type === "page") {
      const bufSize = Math.floor(ctx.sampleRate * 0.55);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2600;
      filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.55);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      src.stop(ctx.currentTime + 0.6);
    } else if (type === "reveal") {
      [261, 329, 392, 523].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.2);
        osc.start();
        osc.stop(ctx.currentTime + 2.2);
      });
    } else if (type === "reward") {
      [523, 659, 784, 1046, 1318].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.07;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
        gain.gain.linearRampToValueAtTime(0, t + 0.38);
        osc.start(t);
        osc.stop(t + 0.42);
      });
    }
  } catch {}
}

// ─── Floating particle ────────────────────────────────────────────────────────
interface ParticleConfig {
  id: number;
  x: number;
  dur: number;
  delay: number;
  size: number;
  driftX: number;
  riseH: number;
}

function Particle({ color, cfg }: { color: string; cfg: ParticleConfig }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${cfg.x}%`,
        bottom: -10,
        width: cfg.size,
        height: cfg.size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${cfg.size * 2.5}px ${color}`,
        pointerEvents: "none",
      }}
      animate={{
        y: [0, -cfg.riseH],
        x: [0, cfg.driftX],
        opacity: [0, 0.95, 0.95, 0],
        scale: [0.3, 1.2, 0.9, 0],
      }}
      transition={{ duration: cfg.dur, delay: cfg.delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, delay, color }: { icon: string; label: string; value: string | number; delay: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.88 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.42, ease: "easeOut" }}
      style={{
        background: "rgba(255,255,255,0.05)",
        border: `1px solid ${color}35`,
        borderRadius: 12,
        padding: "12px 10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "clamp(18px,4vw,24px)", lineHeight: 1, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: "clamp(13px,2.8vw,17px)", fontWeight: 900, color, marginBottom: 3, wordBreak: "break-word" }}>{value}</div>
      <div style={{ fontSize: "clamp(8px,1.6vw,10px)", color: "rgba(255,255,255,0.45)", letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</div>
    </motion.div>
  );
}

// ─── Book with 3-D page flip ──────────────────────────────────────────────────
function Book({
  completedData,
  nextData,
  flipped,
  stats,
}: {
  completedData: typeof SEASON_DATA[0];
  nextData: typeof SEASON_DATA[0] | undefined;
  flipped: boolean;
  stats: SeasonStats;
}) {
  const pageColor = "#f5e6c8";
  const pageColorAlt = "#eee8d4";

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      style={{
        width: "min(560px, calc(100vw - 36px))",
        height: "min(330px, 46vw)",
        minHeight: 210,
        position: "relative",
        perspective: "1400px",
        perspectiveOrigin: "center center",
        margin: "0 auto",
        filter: `drop-shadow(0 24px 48px rgba(0,0,0,0.75)) drop-shadow(0 0 40px ${completedData.glowColor})`,
      }}
    >
      {/* Book outer cover */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(155deg, #2a0d04 0%, #4a1e0c 35%, #3d1508 70%, #1a0804 100%)",
        borderRadius: 8,
        boxShadow: "inset -5px 0 10px rgba(0,0,0,0.45), inset 3px 0 6px rgba(255,160,80,0.07)",
      }} />

      {/* ── LEFT PAGE (static — current season summary) ── */}
      <div style={{
        position: "absolute", left: "3%", top: "5%", width: "44%", height: "90%",
        background: `linear-gradient(135deg, ${pageColor}, #eadfc0)`,
        borderRadius: "4px 0 0 4px",
        overflow: "hidden",
        boxShadow: "inset -2px 0 5px rgba(0,0,0,0.1)",
        padding: "12px 14px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(7px,1.4vw,9px)", color: "#6b3a1f", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
            {completedData.name}
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(10px,2vw,13px)", fontWeight: "bold", color: "#2a0f04", marginBottom: 6, lineHeight: 1.3 }}>
            {completedData.title}
          </div>
          <div style={{ width: 28, height: 1, background: "#8B4513", marginBottom: 7 }} />
          <div style={{ fontSize: "clamp(6px,1.1vw,8px)", color: "#5a3020", lineHeight: 1.65, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            ✓ Journey Complete<br />
            ✓ All Ranks Achieved<br />
            ✓ {stats.finalTitle} Status<br />
            ✓ {stats.totalXp.toLocaleString()} Total XP
          </div>
        </div>
        <div style={{ textAlign: "center", fontFamily: "Georgia, serif", color: "#8B4513", fontSize: "clamp(18px,3.5vw,24px)", opacity: 0.5, lineHeight: 1 }}>
          ❧
        </div>
      </div>

      {/* ── BOOK SPINE ── */}
      <div style={{
        position: "absolute", left: "47%", top: 0, width: "6%", height: "100%", zIndex: 10,
        background: "linear-gradient(to right, #0d0402, #2a0e06, #4a1e0c, #3d1508, #2a0e06, #0d0402)",
        boxShadow: "0 0 8px rgba(0,0,0,0.5)",
      }} />

      {/* ── STATIC RIGHT PAGE (next season, revealed after flip) ── */}
      <div style={{
        position: "absolute", right: "3%", top: "5%", width: "44%", height: "90%",
        background: `linear-gradient(135deg, ${pageColorAlt}, #e0d8be)`,
        borderRadius: "0 4px 4px 0",
        overflow: "hidden",
        padding: "12px 14px",
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center",
      }}>
        {nextData ? (
          <div style={{ fontFamily: "Georgia, serif" }}>
            <div style={{ fontSize: "clamp(18px,3.5vw,26px)", marginBottom: 6 }}>{nextData.emoji}</div>
            <div style={{ fontSize: "clamp(7px,1.2vw,9px)", color: "#4a3080", fontStyle: "italic", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Chapter {nextData.id}</div>
            <div style={{ fontSize: "clamp(10px,2vw,13px)", fontWeight: "bold", color: "#1a0a4a", marginBottom: 6, lineHeight: 1.3 }}>{nextData.title}</div>
            <div style={{ width: 24, height: 1, background: "#6a4a9a", margin: "0 auto 7px" }} />
            <div style={{ fontSize: "clamp(6px,1.1vw,8px)", color: "#4a3070", fontStyle: "italic", lineHeight: 1.55 }}>{nextData.theme}</div>
          </div>
        ) : (
          <div style={{ fontFamily: "Georgia, serif", color: "#3a2000", textAlign: "center" }}>
            <div style={{ fontSize: "clamp(22px,4vw,30px)", marginBottom: 10 }}>∞</div>
            <div style={{ fontSize: "clamp(7px,1.2vw,9px)", fontStyle: "italic", lineHeight: 1.6 }}>The journey transcends all seasons. You are eternal.</div>
          </div>
        )}
      </div>

      {/* ── TURNING PAGE (right side — rotates over the left) ── */}
      <div style={{
        position: "absolute", right: "3%", top: "5%", width: "44%", height: "90%",
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(-180deg)" : "rotateY(0deg)",
        transition: "transform 3.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        zIndex: 20,
      }}>
        {/* Front face: "The End" / current season */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${pageColor}, #eadfc0)`,
          borderRadius: "0 4px 4px 0",
          backfaceVisibility: "hidden",
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center",
          padding: 14,
          boxShadow: "inset 2px 0 5px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontFamily: "Georgia, serif", color: "#6b3a1f" }}>
            <div style={{ fontSize: "clamp(22px,4.5vw,32px)", lineHeight: 1, marginBottom: 10 }}>∿</div>
            <div style={{ fontSize: "clamp(8px,1.5vw,10px)", fontStyle: "italic", color: "#5a3020" }}>End of</div>
            <div style={{ fontSize: "clamp(11px,2.2vw,14px)", fontWeight: "bold", color: "#2a0f04", marginTop: 5 }}>{completedData.name}</div>
            <div style={{ fontSize: "clamp(9px,1.7vw,11px)", fontStyle: "italic", color: "#6b3a1f", marginTop: 4 }}>{completedData.title}</div>
            <div style={{ fontSize: "clamp(22px,4.5vw,32px)", lineHeight: 1, marginTop: 10 }}>∿</div>
          </div>
        </div>

        {/* Back face: new chapter beginning */}
        <div style={{
          position: "absolute", inset: 0,
          background: nextData
            ? "linear-gradient(135deg, #eaf0ff, #d8e5ff)"
            : "linear-gradient(135deg, #eafff4, #d8ffe8)",
          borderRadius: "0 4px 4px 0",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center",
          padding: 14,
        }}>
          <div style={{ fontFamily: "Georgia, serif" }}>
            <div style={{ fontSize: "clamp(18px,3.5vw,26px)", marginBottom: 8 }}>{nextData?.emoji ?? "✨"}</div>
            <div style={{ fontSize: "clamp(7px,1.3vw,9px)", fontStyle: "italic", color: "#2a3a6a", letterSpacing: 1, marginBottom: 5 }}>A New Chapter Begins</div>
            <div style={{ fontSize: "clamp(11px,2.2vw,14px)", fontWeight: "bold", color: "#1a2a5a", marginBottom: 4 }}>
              {nextData?.name ?? "Beyond All Seasons"}
            </div>
            {nextData && (
              <div style={{ fontSize: "clamp(8px,1.5vw,10px)", color: "#3a4a7a", fontStyle: "italic" }}>{nextData.title}</div>
            )}
          </div>
        </div>
      </div>

      {/* Right-edge depth shadow (visible before flip) */}
      {!flipped && (
        <div style={{
          position: "absolute", right: "3%", top: "5%", width: "44%", height: "90%",
          background: "linear-gradient(to right, transparent 75%, rgba(0,0,0,0.14) 100%)",
          pointerEvents: "none", zIndex: 30, borderRadius: "0 4px 4px 0",
        }} />
      )}
    </motion.div>
  );
}

// ─── Main SeasonTransition component ─────────────────────────────────────────
export default function SeasonTransition({ completedSeason, nextSeason, stats, onComplete }: SeasonTransitionProps) {
  const [phase, setPhase] = useState(0);
  const [pageFlipped, setPageFlipped] = useState(false);

  const completedData = SEASON_DATA[Math.max(0, completedSeason - 1)] ?? SEASON_DATA[0];
  const nextData = SEASON_DATA[nextSeason - 1]; // undefined when season > 6

  // Memoized particles so positions don't re-randomize on re-render
  const particleCfgs = useMemo<ParticleConfig[]>(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      dur: 3 + Math.random() * 4,
      delay: Math.random() * 3.5,
      size: 3 + Math.random() * 5,
      driftX: (Math.random() - 0.5) * 90,
      riseH: 280 + Math.random() * 320,
    })), []);

  // Memoized star field
  const stars = useMemo(() =>
    Array.from({ length: 90 }, (_, i) => ({
      id: i,
      w: 1 + Math.random() * 1.8,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: 0.2 + Math.random() * 0.65,
      dur: 1.4 + Math.random() * 3,
      delay: Math.random() * 3,
    })), []);

  // Phase timing machine
  useEffect(() => {
    if (phase === 6) return; // Waits for button click

    if (phase === 0) setTimeout(() => playSound("fanfare"), 600);
    if (phase === 3) {
      setTimeout(() => { playSound("page"); setPageFlipped(true); }, 350);
    }
    if (phase === 4) setTimeout(() => playSound("reveal"), 300);
    if (phase === 6) playSound("reward");

    const durations = [3000, 5000, 2600, 4300, 3500, 3100];
    const t = setTimeout(() => setPhase(p => p + 1), durations[phase] ?? 3000);
    return () => clearTimeout(t);
  }, [phase]);

  // Shift accent colors once new chapter is revealed (phase 4+)
  const primaryColor = phase >= 4 && nextData ? nextData.primaryColor : completedData.primaryColor;
  const accentColor  = phase >= 4 && nextData ? nextData.accentColor  : completedData.accentColor;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 0%, #1c0540 0%, #06010f 60%, #020108 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>

      {/* ── Star field ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {stars.map(s => (
          <div key={s.id} style={{
            position: "absolute",
            width: s.w, height: s.w,
            borderRadius: "50%",
            background: "white",
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: s.opacity,
            animation: `qpxTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* ── Floating particles ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {particleCfgs.map(cfg => (
          <Particle key={cfg.id} color={completedData.accentColor} cfg={cfg} />
        ))}
      </div>

      {/* ── Ambient glow at top ── */}
      <motion.div
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: 700, height: 320, pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 0%, ${primaryColor}40 0%, transparent 70%)`,
          transition: "background 1.8s ease",
        }}
      />

      {/* ── Skip button (phases 1-5) ── */}
      <AnimatePresence>
        {phase >= 1 && phase < 6 && (
          <motion.button
            key="skip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.38 }}
            exit={{ opacity: 0 }}
            whileHover={{ opacity: 0.75 }}
            onClick={() => { setPhase(6); playSound("reward"); }}
            style={{
              position: "absolute", top: 18, right: 20,
              color: "rgba(255,255,255,0.8)", fontSize: 11, letterSpacing: 1.5,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 6, padding: "4px 16px", cursor: "pointer",
            }}
          >
            SKIP →
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Content container ── */}
      <div style={{ width: "100%", maxWidth: 680, padding: "0 18px", position: "relative" }}>
        <AnimatePresence mode="wait">

          {/* Phase 0 — "SEASON COMPLETE" dramatic title */}
          {phase === 0 && (
            <motion.div key="p0"
              initial={{ opacity: 0, scale: 0.72 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: "center", padding: "20px 0" }}
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                style={{ fontSize: "clamp(40px,11vw,70px)", lineHeight: 1, marginBottom: 14 }}
              >
                {completedData.emoji}
              </motion.div>
              <div style={{ fontSize: "clamp(10px,2.2vw,13px)", letterSpacing: "0.45em", color: accentColor, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
                Season {completedSeason} Complete
              </div>
              <motion.div
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                style={{
                  fontSize: "clamp(28px,7.5vw,56px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 18,
                  background: `linear-gradient(135deg, ${completedData.primaryColor}, ${completedData.accentColor}, ${completedData.primaryColor})`,
                  backgroundSize: "200% 100%",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}
              >
                {completedData.title}
              </motion.div>
              <div style={{ fontSize: "clamp(12px,2.4vw,16px)", color: "rgba(255,255,255,0.58)", fontStyle: "italic", marginBottom: 22 }}>
                {completedData.description}
              </div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ fontSize: "clamp(14px,2.8vw,18px)", fontWeight: 800, color: accentColor, letterSpacing: "0.3em", textTransform: "uppercase" }}
              >
                {stats.finalTitle} Achieved
              </motion.div>
            </motion.div>
          )}

          {/* Phase 1 — Journey stats */}
          {phase === 1 && (
            <motion.div key="p1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ textAlign: "center", marginBottom: 22, fontSize: "clamp(14px,3vw,19px)", fontWeight: 700, color: "rgba(255,255,255,0.88)", letterSpacing: "0.08em" }}
              >
                Your Journey — {completedData.name}
              </motion.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <StatCard icon="⚡" label="Total XP" value={stats.totalXp.toLocaleString()} delay={0.1} color={accentColor} />
                <StatCard icon="🏅" label="Final Rank" value={stats.finalRank} delay={0.2} color={accentColor} />
                <StatCard icon="🏆" label="Title Earned" value={stats.finalTitle} delay={0.3} color={accentColor} />
                <StatCard icon="🔥" label="Best Streak" value={`${stats.longestStreak || stats.streak}d`} delay={0.4} color={accentColor} />
                <StatCard icon="✅" label="Quests Done" value={stats.questsCompleted} delay={0.5} color={accentColor} />
                <StatCard icon="📈" label="Level Reached" value={stats.level} delay={0.6} color={accentColor} />
              </div>
            </motion.div>
          )}

          {/* Phases 2–4 — Book scene */}
          {phase >= 2 && phase <= 4 && (
            <motion.div key="book-scene"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.6 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}
            >
              {/* Text above book */}
              <AnimatePresence mode="wait">
                {phase === 2 && (
                  <motion.div key="t2"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ textAlign: "center", fontSize: "clamp(13px,2.5vw,17px)", color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}
                  >
                    One chapter ends... and history is written forever.
                  </motion.div>
                )}
                {phase === 3 && (
                  <motion.div key="t3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ textAlign: "center", fontSize: "clamp(13px,2.5vw,17px)", color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}
                  >
                    Turning the page...
                  </motion.div>
                )}
                {phase === 4 && (
                  <motion.div key="t4"
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.65 }}
                    style={{ textAlign: "center" }}
                  >
                    <div style={{ fontSize: "clamp(11px,2.2vw,14px)", letterSpacing: "0.28em", color: nextData?.accentColor ?? accentColor, fontWeight: 700, marginBottom: 5, textTransform: "uppercase" }}>
                      {nextData ? `${nextData.name} — ${nextData.title}` : "The Journey Continues..."}
                    </div>
                    <div style={{ fontSize: "clamp(9px,1.6vw,12px)", color: "rgba(255,255,255,0.48)", fontStyle: "italic" }}>
                      {nextData ? nextData.theme : "You have transcended all seasons."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The book */}
              <Book
                completedData={completedData}
                nextData={nextData}
                flipped={pageFlipped}
                stats={stats}
              />

              {/* Text below book */}
              <AnimatePresence mode="wait">
                {phase === 2 && (
                  <motion.div key="b2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ textAlign: "center", fontSize: "clamp(9px,1.7vw,12px)", color: "rgba(255,255,255,0.38)" }}
                  >
                    {completedData.name} — completed with honor
                  </motion.div>
                )}
                {phase === 4 && nextData && (
                  <motion.div key="b4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    style={{ textAlign: "center", fontSize: "clamp(9px,1.7vw,12px)", color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}
                  >
                    A new adventure awaits, {stats.finalTitle}.
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Phase 5 — Motivational text */}
          {phase === 5 && (
            <motion.div key="p5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "36px 16px" }}
            >
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.25 }}
                style={{ fontSize: "clamp(16px,3.8vw,26px)", fontWeight: 700, color: "rgba(255,255,255,0.88)", marginBottom: 22, lineHeight: 1.55, fontStyle: "italic" }}
              >
                "{completedData.motivational[0]}"
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 1.3 }}
                style={{ fontSize: "clamp(14px,3.2vw,22px)", fontWeight: 600, color: accentColor, fontStyle: "italic", lineHeight: 1.4 }}
              >
                "{completedData.motivational[1]}"
              </motion.div>
              {nextData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.4 }}
                  style={{ marginTop: 32, fontSize: "clamp(10px,2vw,14px)", color: "rgba(255,255,255,0.38)", letterSpacing: "0.18em" }}
                >
                  {nextData.emoji} Preparing {nextData.name} — {nextData.title}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Phase 6 — Rewards + Begin button */}
          {phase === 6 && (
            <motion.div key="p6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: "center" }}
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ fontSize: "clamp(10px,2vw,13px)", letterSpacing: "0.35em", color: accentColor, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}
              >
                Season Rewards Unlocked
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ fontSize: "clamp(20px,5.5vw,34px)", fontWeight: 900, color: "white", marginBottom: 22 }}
              >
                {stats.finalTitle}
              </motion.div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxWidth: 420, margin: "0 auto 22px" }}>
                {completedData.rewards.map((reward, i) => (
                  <motion.div key={reward}
                    initial={{ opacity: 0, scale: 0.78 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.13, type: "spring", stiffness: 210 }}
                    style={{
                      background: `linear-gradient(135deg, ${completedData.primaryColor}22, ${completedData.accentColor}12)`,
                      border: `1px solid ${completedData.accentColor}40`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex", alignItems: "center", gap: 9,
                      boxShadow: `0 0 18px ${completedData.accentColor}12`,
                    }}
                  >
                    <span style={{ fontSize: "clamp(14px,3vw,20px)" }}>
                      {i === 0 ? "👑" : i === 1 ? "🏅" : i === 2 ? "🖼" : "💰"}
                    </span>
                    <span style={{ fontSize: "clamp(9px,1.6vw,12px)", fontWeight: 600, color: "rgba(255,255,255,0.85)", textAlign: "left", lineHeight: 1.35 }}>
                      {reward}
                    </span>
                  </motion.div>
                ))}
              </div>

              {nextData && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  style={{
                    marginBottom: 20, padding: "9px 20px",
                    background: `${nextData.primaryColor}18`,
                    border: `1px solid ${nextData.accentColor}30`,
                    borderRadius: 8, display: "inline-block",
                    fontSize: "clamp(10px,1.8vw,13px)", color: "rgba(255,255,255,0.58)",
                  }}
                >
                  {nextData.emoji} Next: {nextData.name} — {nextData.title}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1, type: "spring", stiffness: 180 }}
                style={{ display: "block" }}
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${completedData.accentColor}70` }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onComplete}
                  style={{
                    padding: "14px 44px",
                    fontSize: "clamp(13px,2.6vw,16px)", fontWeight: 800, letterSpacing: "0.14em",
                    color: "#000",
                    background: `linear-gradient(135deg, ${completedData.primaryColor}, ${completedData.accentColor})`,
                    border: "none", borderRadius: 12, cursor: "pointer",
                    boxShadow: `0 0 34px ${completedData.accentColor}45`,
                  }}
                >
                  {nextData ? `Begin ${nextData.name} →` : "Complete the Journey →"}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <style>{`
        @keyframes qpxTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
