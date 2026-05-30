import { motion } from "framer-motion";
import { useGetPlayerProfile, useGetInventory } from "@workspace/api-client-react";
import { RankBadge, RANKS, RANK_COLORS } from "@/components/rank-badge";
import { Shield, ChevronRight, Lock } from "lucide-react";

const RANK_DESCRIPTIONS = [
  "A new warrior begins their journey. Raw, untested, full of potential.",
  "Training begins in earnest. The discipline of a cadet forges the mind.",
  "Combat drills shape the body. The trainee proves their commitment.",
  "Battle-hardened. The warrior has faced adversity and grown stronger.",
  "Elite status earned. This warrior operates at peak performance.",
  "A champion among champions. Recognized by peers and rivals alike.",
  "Legendary status achieved. Stories are told of this warrior's deeds.",
  "Mastery of self and craft. The master teaches through example.",
  "Grandmaster — transcends normal limits. A force of nature.",
  "TITAN — the apex of human potential. Unstoppable. Eternal. Legendary.",
];

function CharacterSilhouette({ rankIndex }: { rankIndex: number }) {
  const colors = RANK_COLORS[rankIndex];
  const scale = 0.9 + rankIndex * 0.02;
  const glowSize = 20 + rankIndex * 8;

  return (
    <div className="relative flex items-center justify-center" style={{ height: 280 }}>
      {/* Glow ring */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
      />

      {/* Character SVG */}
      <motion.svg
        width={140 * scale}
        height={260 * scale}
        viewBox="0 0 140 260"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Body glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={rankIndex > 5 ? 4 : 2} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>

        {/* Head */}
        <circle cx="70" cy="30" r="20" fill="url(#bodyGrad)" filter={rankIndex > 4 ? "url(#glow)" : undefined} />

        {/* Neck */}
        <rect x="63" y="48" width="14" height="12" rx="4" fill="url(#bodyGrad)" />

        {/* Torso - gets more armored with rank */}
        <rect x={45 - rankIndex * 1} y="60" width={50 + rankIndex * 2} height={70 + rankIndex * 3} rx="8" fill="url(#bodyGrad)"
          filter={rankIndex > 5 ? "url(#glow)" : undefined} />

        {/* Shoulder pads - appear from rank 3 */}
        {rankIndex >= 3 && (
          <>
            <ellipse cx="38" cy="75" rx={10 + rankIndex} ry={6 + rankIndex / 2} fill={colors.from}
              opacity={0.6 + rankIndex * 0.05} filter="url(#glow)" />
            <ellipse cx="102" cy="75" rx={10 + rankIndex} ry={6 + rankIndex / 2} fill={colors.from}
              opacity={0.6 + rankIndex * 0.05} filter="url(#glow)" />
          </>
        )}

        {/* Arms */}
        <rect x="20" y="60" width={14 + rankIndex} height={50 + rankIndex * 2} rx="6" fill="url(#bodyGrad)" />
        <rect x={106 - rankIndex} y="60" width={14 + rankIndex} height={50 + rankIndex * 2} rx="6" fill="url(#bodyGrad)" />

        {/* Legs */}
        <rect x="48" y="130" width={20 + rankIndex} height={60 + rankIndex * 2} rx="6" fill="url(#bodyGrad)" />
        <rect x={72 - rankIndex} y="130" width={20 + rankIndex} height={60 + rankIndex * 2} rx="6" fill="url(#bodyGrad)" />

        {/* Feet */}
        <ellipse cx="60" cy={192 + rankIndex * 2} rx="14" ry="8" fill={colors.from} />
        <ellipse cx="80" cy={192 + rankIndex * 2} rx="14" ry="8" fill={colors.from} />

        {/* Energy effects for high ranks */}
        {rankIndex >= 6 && (
          <>
            <motion.circle
              cx="70"
              cy="95"
              r="8"
              fill="none"
              stroke={colors.from}
              strokeWidth="2"
              animate={{ r: [8, 14, 8], opacity: [0.8, 0.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <motion.circle
              cx="70"
              cy="95"
              r="20"
              fill="none"
              stroke={colors.from}
              strokeWidth="1"
              opacity="0.4"
              animate={{ r: [20, 30, 20], opacity: [0.4, 0.1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            />
          </>
        )}

        {/* Belt/rank indicator */}
        <rect x="45" y="128" width="50" height="6" rx="3" fill={colors.from} opacity="0.8" />
        {rankIndex > 0 && Array.from({ length: Math.min(rankIndex, 5) }).map((_, i) => (
          <circle key={i} cx={52 + i * 9} cy="131" r="2" fill={colors.to} />
        ))}
      </motion.svg>

      {/* Rank label under character */}
      <div className="absolute bottom-0 text-center">
        <div className="text-sm font-bold" style={{ color: colors.from }}>{RANKS[rankIndex]}</div>
      </div>
    </div>
  );
}

export default function Character() {
  const { data: player, isLoading } = useGetPlayerProfile();
  const { data: inventory } = useGetInventory();

  if (isLoading || !player) {
    return <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 rounded-full border-2 border-transparent border-t-primary" />
    </div>;
  }

  const rankColor = RANK_COLORS[player.rankIndex];

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-white mb-6"
      >
        Character Evolution
      </motion.h1>

      {/* Character display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl p-6 mb-5"
        style={{ borderColor: `${rankColor.from}30` }}
      >
        <div className="flex flex-col items-center">
          <CharacterSilhouette rankIndex={player.rankIndex} />

          <div className="text-center mt-2">
            <div className="text-xs text-muted-foreground px-4 text-center italic">
              "{RANK_DESCRIPTIONS[player.rankIndex]}"
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <RankBadge rankIndex={player.rankIndex} size="lg" showLabel />
          </div>

          {/* Equipped gear */}
          {inventory && (
            <div className="flex gap-3 mt-4">
              {inventory.equippedOutfit && (
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Outfit</div>
                  <div className="text-xs text-primary font-medium">{inventory.equippedOutfit}</div>
                </div>
              )}
              {inventory.equippedEffect && (
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Effect</div>
                  <div className="text-xs text-secondary font-medium">{inventory.equippedEffect}</div>
                </div>
              )}
              {inventory.equippedFrame && (
                <div className="text-center">
                  <div className="text-[10px] text-muted-foreground">Frame</div>
                  <div className="text-xs text-yellow-400 font-medium">{inventory.equippedFrame}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Rank progression timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl p-5"
      >
        <h2 className="font-bold text-white mb-4">Rank Progression</h2>
        <div className="space-y-2">
          {RANKS.map((rank, i) => {
            const colors = RANK_COLORS[i];
            const isUnlocked = i <= player.rankIndex;
            const isCurrent = i === player.rankIndex;
            return (
              <motion.div
                key={rank}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrent ? "border" : ""
                }`}
                style={isCurrent ? {
                  borderColor: `${colors.from}50`,
                  background: `${colors.from}10`,
                } : {}}
              >
                <RankBadge rankIndex={i} size="sm" />
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${isUnlocked ? "text-white" : "text-muted-foreground"}`}>
                    {rank}
                    {isCurrent && <span className="ml-2 text-[10px] font-normal text-muted-foreground">— Current</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{RANK_DESCRIPTIONS[i].slice(0, 50)}...</div>
                </div>
                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                {isCurrent && <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.from }} />}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
