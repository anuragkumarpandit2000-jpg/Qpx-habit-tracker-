import { motion } from "framer-motion";
import { useGetAchievements } from "@workspace/api-client-react";
import { Trophy, Lock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const RARITY_COLORS = {
  common: { border: "#8a9ba8", bg: "#8a9ba815", label: "#8a9ba8" },
  rare: { border: "#4a9eff", bg: "#4a9eff15", label: "#4a9eff" },
  epic: { border: "#bf00ff", bg: "#bf00ff15", label: "#bf00ff" },
  legendary: { border: "#ffd700", bg: "#ffd70015", label: "#ffd700" },
};

const RARITY_ORDER = ["legendary", "epic", "rare", "common"];

export default function Achievements() {
  const { data: achievements = [], isLoading } = useGetAchievements();

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);
  const total = achievements.length;

  const byRarity = RARITY_ORDER.reduce<Record<string, typeof achievements>>((acc, r) => {
    acc[r] = achievements.filter((a) => a.rarity === r);
    return acc;
  }, {});

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Achievements
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {unlocked.length} / {total} unlocked
        </p>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-4 mb-5"
      >
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Overall Progress</span>
          <span>{total > 0 ? Math.round((unlocked.length / total) * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #ffd700, #ff8c00)" }}
            initial={{ width: 0 }}
            animate={{ width: total > 0 ? `${(unlocked.length / total) * 100}%` : "0%" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {RARITY_ORDER.map((r) => {
            const c = RARITY_COLORS[r as keyof typeof RARITY_COLORS];
            const count = byRarity[r]?.filter((a) => a.unlocked).length ?? 0;
            const total = byRarity[r]?.length ?? 0;
            return (
              <div key={r} className="text-center p-2 rounded-lg" style={{ background: c.bg, border: `1px solid ${c.border}30` }}>
                <div className="text-sm font-bold" style={{ color: c.label }}>{count}/{total}</div>
                <div className="text-[9px] text-muted-foreground capitalize">{r}</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Achievement grids by rarity */}
      {RARITY_ORDER.map((rarity) => {
        const items = byRarity[rarity];
        if (!items || items.length === 0) return null;
        const c = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS];
        return (
          <motion.div key={rarity} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5" style={{ color: c.label }} />
              <h2 className="text-sm font-bold capitalize" style={{ color: c.label }}>{rarity}</h2>
              <span className="text-[10px] text-muted-foreground">({items.filter(a => a.unlocked).length}/{items.length})</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("rounded-xl p-3 border transition-all", !ach.unlocked && "opacity-50")}
                  style={{
                    background: ach.unlocked ? c.bg : "hsl(var(--card) / 0.5)",
                    borderColor: ach.unlocked ? `${c.border}60` : "hsl(var(--border) / 0.3)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: ach.unlocked ? c.bg : "hsl(var(--muted))", border: `1px solid ${c.border}40` }}>
                      {ach.unlocked
                        ? <Trophy className="w-4 h-4" style={{ color: c.label }} />
                        : <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    {ach.unlocked && (
                      <span className="text-[9px] font-bold" style={{ color: c.label }}>+{ach.xpReward} XP</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-white mb-0.5 leading-tight">{ach.title}</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{ach.description}</div>
                  {!ach.unlocked && ach.target && (
                    <div className="mt-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round(((ach.progress ?? 0) / ach.target) * 100)}%`,
                            background: c.label,
                          }}
                        />
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">
                        {ach.progress ?? 0} / {ach.target}
                      </div>
                    </div>
                  )}
                  {ach.unlocked && ach.unlockedAt && (
                    <div className="text-[9px] text-muted-foreground mt-1">
                      Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
