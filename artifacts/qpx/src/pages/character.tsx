import { Suspense, lazy, useMemo } from "react";
import { motion } from "framer-motion";
import { useGetPlayerProfile, useGetInventory } from "@workspace/api-client-react";
import { RankBadge, RANKS, RANK_COLORS } from "@/components/rank-badge";
import { Shield, ChevronRight, Lock, Coins, Zap, Flame } from "lucide-react";
import CharacterFallback from "@/components/character-3d-fallback";

const CharacterScene3D = lazy(() => import("@/components/character-3d-scene"));

function checkWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch { return false; }
}

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

export default function Character() {
  const { data: player, isLoading } = useGetPlayerProfile();
  const { data: inventory } = useGetInventory();

  if (isLoading || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent border-t-primary"
        />
      </div>
    );
  }

  const rankColor = RANK_COLORS[player.rankIndex];

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-white"
      >
        My Character
      </motion.h1>

      {/* ── 3D CHARACTER SCENE ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden"
        style={{
          height: 420,
          border: `1.5px solid ${rankColor.from}40`,
          boxShadow: `0 0 40px ${rankColor.glow}`,
        }}
      >
        {checkWebGL() ? (
          <Suspense fallback={<CharacterFallback rankIndex={player.rankIndex} level={player.level} />}>
            <CharacterScene3D rankIndex={player.rankIndex} level={player.level} />
          </Suspense>
        ) : (
          <CharacterFallback rankIndex={player.rankIndex} level={player.level} />
        )}
      </motion.div>

      {/* ── PERSONAL PROFILE CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl p-5"
        style={{ borderColor: `${rankColor.from}35` }}
      >
        <div className="flex items-center gap-4 mb-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-black flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${rankColor.from}, ${rankColor.to})`,
              boxShadow: `0 0 24px ${rankColor.glow}`,
            }}
          >
            {player.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-black text-white">{player.username}</h2>
            <div className="text-xs text-muted-foreground mb-1">{player.playerId}</div>
            {player.title && (
              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                style={{
                  borderColor: `${rankColor.from}60`,
                  color: rankColor.from,
                  background: `${rankColor.from}15`,
                }}
              >
                <Shield className="w-2.5 h-2.5" />
                {player.title}
              </div>
            )}
          </div>

          <RankBadge rankIndex={player.rankIndex} size="lg" showLabel />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Zap, value: `${player.totalXp} XP`, label: "Total XP", color: "hsl(var(--primary))" },
            { icon: Coins, value: player.coins, label: "Coins", color: "#ffd700" },
            { icon: Flame, value: `${player.streak}d`, label: "Streak", color: "#ff6b35" },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: `${color}10` }}>
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
              <div className="text-sm font-bold text-white">{value}</div>
              <div className="text-[10px] text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {/* XP progress bar */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Level {player.level} Progress</span>
            <span>{player.xp} / {player.xpToNextLevel} XP</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${rankColor.from}, ${rankColor.to})` }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((player.xp / player.xpToNextLevel) * 100)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Rank lore */}
        <div
          className="rounded-xl p-3 text-xs italic text-center"
          style={{ background: `${rankColor.from}0d`, color: rankColor.from }}
        >
          "{RANK_DESCRIPTIONS[player.rankIndex]}"
        </div>

        {/* Equipped gear */}
        {inventory && (inventory.equippedOutfit || inventory.equippedEffect || inventory.equippedFrame) && (
          <div className="flex gap-3 mt-4 justify-center">
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
      </motion.div>

      {/* ── RANK PROGRESSION ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl p-5"
      >
        <h2 className="font-bold text-white mb-4">Rank Evolution</h2>
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
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent ? "border" : ""}`}
                style={
                  isCurrent
                    ? { borderColor: `${colors.from}50`, background: `${colors.from}10` }
                    : {}
                }
              >
                <RankBadge rankIndex={i} size="sm" />
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${isUnlocked ? "text-white" : "text-muted-foreground"}`}>
                    {rank}
                    {isCurrent && (
                      <span className="ml-2 text-[10px] font-normal text-muted-foreground">— Current</span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {RANK_DESCRIPTIONS[i].slice(0, 52)}…
                  </div>
                </div>
                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                {isCurrent && (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.from }} />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
