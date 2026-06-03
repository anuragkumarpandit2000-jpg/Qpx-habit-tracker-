import { motion } from "framer-motion";
import { RANK_COLORS, RANKS } from "@/lib/rank-constants";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getBodyScale(rankIndex: number) {
  const t = rankIndex / 9;
  return {
    shoulderWidth: lerp(32, 52, t),
    waistWidth: lerp(22, 32, t),
    armWidth: lerp(11, 20, t),
    legWidth: lerp(14, 24, t),
    neckWidth: lerp(13, 18, t),
  };
}

export default function CharacterFallback({ rankIndex, level }: { rankIndex: number; level: number }) {
  const colors = RANK_COLORS[rankIndex];
  const s = getBodyScale(rankIndex);

  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #87ceeb 0%, #b0e0ff 40%, #c8f0c8 70%, #4a9e3f 100%)",
      }}
    >
      {/* Sky clouds */}
      {[
        { left: "10%", top: "8%", scale: 1 },
        { left: "60%", top: "5%", scale: 0.7 },
        { left: "75%", top: "14%", scale: 0.85 },
      ].map((c, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 6 + i * 2, ease: "easeInOut" }}
          className="absolute"
          style={{ left: c.left, top: c.top, transform: `scale(${c.scale})` }}
        >
          <div className="flex gap-1">
            {[40, 56, 44].map((w, j) => (
              <div key={j} className="rounded-full bg-white/90" style={{ width: w, height: 26 }} />
            ))}
          </div>
        </motion.div>
      ))}

      {/* Trees */}
      {[
        { left: "5%", size: 1 },
        { left: "82%", size: 0.85 },
        { left: "70%", size: 1.05 },
        { left: "18%", size: 0.9 },
      ].map((t, i) => (
        <div key={i} className="absolute bottom-[18%]" style={{ left: t.left, transform: `scale(${t.size})`, transformOrigin: "bottom center" }}>
          <div className="flex flex-col items-center">
            <div className="rounded-t-full" style={{ width: 0, height: 0, borderLeft: "22px solid transparent", borderRight: "22px solid transparent", borderBottom: "38px solid #3a8a28" }} />
            <div className="rounded-t-full" style={{ width: 0, height: 0, borderLeft: "30px solid transparent", borderRight: "30px solid transparent", borderBottom: "42px solid #2d6a1f", marginTop: -16 }} />
            <div className="rounded-t-full" style={{ width: 0, height: 0, borderLeft: "38px solid transparent", borderRight: "38px solid transparent", borderBottom: "46px solid #4aaa34", marginTop: -18 }} />
            <div className="rounded-sm" style={{ width: 12, height: 36, background: "#5c3d1a", marginTop: -2 }} />
          </div>
        </div>
      ))}

      {/* Grass ground */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: "20%", background: "#4a9e3f", borderRadius: "60% 60% 0 0" }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ height: "14%", background: "#5ec44f" }} />

      {/* Character shadow */}
      <div className="absolute bottom-[14%] left-1/2 -translate-x-1/2"
        style={{ width: 60, height: 14, background: "rgba(0,0,0,0.2)", borderRadius: "50%", filter: "blur(4px)" }} />

      {/* Rank aura glow */}
      {rankIndex >= 5 && (
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute bottom-[14%] left-1/2 -translate-x-1/2 rounded-full"
          style={{ width: 110, height: 110, background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)` }}
        />
      )}

      {/* SVG Human Character */}
      <motion.div
        className="absolute bottom-[13%]"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      >
        <svg width="110" height="220" viewBox="0 0 110 220" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d4956a" />
              <stop offset="100%" stopColor="#b8734a" />
            </linearGradient>
            <linearGradient id="rankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
            <filter id="glow2">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Head */}
          <ellipse cx="55" cy="22" rx="16" ry="18" fill="url(#skinGrad)" />
          {/* Hair */}
          <ellipse cx="55" cy="11" rx="16" ry="9" fill="#1a0a00" />
          {/* Eyes */}
          <circle cx="49" cy="20" r="2.5" fill="#1a0a00" />
          <circle cx="61" cy="20" r="2.5" fill="#1a0a00" />
          {/* Nose */}
          <ellipse cx="55" cy="26" rx="2" ry="2.5" fill="#b8734a" />
          {/* Lips */}
          <rect x="50" y="31" width="10" height="2.5" rx="1.2" fill="#b8734a" />
          {/* Ears */}
          <ellipse cx="39" cy="22" rx="3" ry="4" fill="url(#skinGrad)" />
          <ellipse cx="71" cy="22" rx="3" ry="4" fill="url(#skinGrad)" />

          {/* Neck */}
          <rect x={55 - s.neckWidth / 2} y="38" width={s.neckWidth} height="14" rx="4" fill="url(#skinGrad)" />

          {/* Torso — upper chest */}
          <rect x={55 - s.shoulderWidth} y="52" width={s.shoulderWidth * 2} height="36" rx="8" fill="url(#skinGrad)"
            filter={rankIndex >= 5 ? "url(#glow2)" : undefined} />
          {/* Pec definition */}
          <ellipse cx={55 - s.shoulderWidth * 0.4} cy="62" rx={s.shoulderWidth * 0.32} ry="10" fill="#c07848" opacity="0.35" />
          <ellipse cx={55 + s.shoulderWidth * 0.4} cy="62" rx={s.shoulderWidth * 0.32} ry="10" fill="#c07848" opacity="0.35" />

          {/* Torso — abs */}
          <rect x={55 - s.waistWidth} y="86" width={s.waistWidth * 2} height="28" rx="5" fill="url(#skinGrad)" />
          {/* Ab lines */}
          {rankIndex >= 1 && [91, 99, 107].map((y, i) => (
            <line key={i} x1={55 - s.waistWidth * 0.7} y1={y} x2={55 + s.waistWidth * 0.7} y2={y} stroke="#b8734a" strokeWidth="1.2" opacity="0.4" />
          ))}

          {/* Shoulders */}
          <circle cx={55 - s.shoulderWidth - 2} cy="60" r={s.armWidth * 0.85} fill="url(#skinGrad)" />
          <circle cx={55 + s.shoulderWidth + 2} cy="60" r={s.armWidth * 0.85} fill="url(#skinGrad)" />

          {/* Left arm */}
          <rect x={55 - s.shoulderWidth - s.armWidth - 4} y="60" width={s.armWidth} height="32" rx={s.armWidth / 2}
            fill="url(#skinGrad)" transform={`rotate(-8, ${55 - s.shoulderWidth - 4}, 60)`} />
          {/* Left forearm */}
          <rect x={55 - s.shoulderWidth - s.armWidth - 6} y="92" width={s.armWidth * 0.82} height="26" rx={s.armWidth / 2}
            fill="url(#skinGrad)" transform={`rotate(-6, ${55 - s.shoulderWidth - 4}, 92)`} />
          {/* Left hand */}
          <ellipse cx={55 - s.shoulderWidth - s.armWidth / 2 - 8} cy="122" rx={s.armWidth * 0.7} ry="6" fill="url(#skinGrad)" />

          {/* Right arm */}
          <rect x={55 + s.shoulderWidth + 4} y="60" width={s.armWidth} height="32" rx={s.armWidth / 2}
            fill="url(#skinGrad)" transform={`rotate(8, ${55 + s.shoulderWidth + 4}, 60)`} />
          {/* Right forearm */}
          <rect x={55 + s.shoulderWidth + 6} y="92" width={s.armWidth * 0.82} height="26" rx={s.armWidth / 2}
            fill="url(#skinGrad)" transform={`rotate(6, ${55 + s.shoulderWidth + 6}, 92)`} />
          {/* Right hand */}
          <ellipse cx={55 + s.shoulderWidth + s.armWidth / 2 + 8} cy="122" rx={s.armWidth * 0.7} ry="6" fill="url(#skinGrad)" />

          {/* Hips */}
          <rect x={55 - s.waistWidth * 1.05} y="113" width={s.waistWidth * 2.1} height="18" rx="5" fill="url(#skinGrad)" />
          {/* Shorts */}
          <rect x={55 - s.waistWidth * 1.05} y="122" width={s.waistWidth * 2.1} height="20" rx="4" fill="#e8e8e8" />
          {/* Waistband */}
          <rect x={55 - s.waistWidth * 1.07} y="120" width={s.waistWidth * 2.14} height="5" rx="2" fill="#cc2222" />

          {/* Left thigh */}
          <rect x={55 - s.waistWidth * 0.85} y="140" width={s.legWidth} height="36" rx={s.legWidth / 2} fill="url(#skinGrad)" />
          {/* Left calf */}
          <rect x={55 - s.waistWidth * 0.82} y="174" width={s.legWidth * 0.8} height="30" rx={s.legWidth * 0.4} fill="url(#skinGrad)" />
          {/* Left foot */}
          <ellipse cx={55 - s.waistWidth * 0.7} cy="207" rx={s.legWidth * 0.9} ry="5" fill="url(#skinGrad)" />

          {/* Right thigh */}
          <rect x={55 + s.waistWidth * 0.85 - s.legWidth} y="140" width={s.legWidth} height="36" rx={s.legWidth / 2} fill="url(#skinGrad)" />
          {/* Right calf */}
          <rect x={55 + s.waistWidth * 0.82 - s.legWidth * 0.8} y="174" width={s.legWidth * 0.8} height="30" rx={s.legWidth * 0.4} fill="url(#skinGrad)" />
          {/* Right foot */}
          <ellipse cx={55 + s.waistWidth * 0.7} cy="207" rx={s.legWidth * 0.9} ry="5" fill="url(#skinGrad)" />

          {/* Rank energy effects for high ranks */}
          {rankIndex >= 6 && (
            <motion.circle cx="55" cy="85" r="50" fill="none" stroke={colors.from} strokeWidth="1.5"
              animate={{ r: [50, 58, 50], opacity: [0.5, 0.1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              filter="url(#glow2)" />
          )}
        </svg>
      </motion.div>

      {/* Level + Rank label */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-bold"
        style={{
          background: `${colors.from}22`,
          border: `1px solid ${colors.from}60`,
          color: colors.from,
          backdropFilter: "blur(6px)",
        }}
      >
        Lv.{level} · {RANKS[rankIndex]}
      </div>
    </div>
  );
}
