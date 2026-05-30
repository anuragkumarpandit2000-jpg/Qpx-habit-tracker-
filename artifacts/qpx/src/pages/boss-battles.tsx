import { motion } from "framer-motion";
import {
  useGetBossBattles,
  useUpdateBossBattleProgress,
  getGetBossBattlesQueryKey,
  getGetPlayerProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skull, Zap, Shield, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  health: "hsl(170 70% 50%)",
  body: "hsl(150 70% 50%)",
  knowledge: "hsl(190 90% 50%)",
  discipline: "hsl(0 80% 60%)",
  mind: "hsl(270 70% 60%)",
};

export default function BossBattles() {
  const queryClient = useQueryClient();
  const { data: battles = [], isLoading } = useGetBossBattles();
  const updateProgress = useUpdateBossBattleProgress();

  const handleProgress = async (id: number) => {
    await updateProgress.mutateAsync({ id, data: { increment: 1 } });
    queryClient.invalidateQueries({ queryKey: getGetBossBattlesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
  };

  const active = battles.filter((b) => b.status === "active");
  const completed = battles.filter((b) => b.status === "completed");
  const failed = battles.filter((b) => b.status === "failed");

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Skull className="w-6 h-6 text-red-400" />
          Boss Battles
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Weekly challenges with massive rewards</p>
      </motion.div>

      {/* Active battles */}
      {active.length > 0 && (
        <div className="space-y-4 mb-6">
          {active.map((battle, i) => {
            const progress = Math.round((battle.currentProgress / battle.targetValue) * 100);
            const color = CATEGORY_COLORS[battle.category] ?? "hsl(var(--primary))";
            const daysLeft = Math.ceil((new Date(battle.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <motion.div
                key={battle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel rounded-2xl p-5 border"
                style={{ borderColor: `${color}30` }}
              >
                {/* Boss header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <Skull className="w-6 h-6" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{battle.title}</h3>
                      <p className="text-xs text-muted-foreground">{battle.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-orange-400 font-semibold">
                    <Clock className="w-3 h-3" />
                    {daysLeft}d left
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-white">{battle.currentProgress} / {battle.targetValue}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 text-right">{progress}% complete</div>
                </div>

                {/* Rewards */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary))" }} />
                    <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>+{battle.xpReward} XP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400">+{battle.coinReward} coins</span>
                  </div>
                  {battle.badgeReward && (
                    <div className="text-[10px] text-secondary font-semibold">{battle.badgeReward}</div>
                  )}
                </div>

                <Button
                  onClick={() => handleProgress(battle.id)}
                  disabled={updateProgress.isPending}
                  className="w-full font-bold text-black"
                  style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
                >
                  Mark Progress +1
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completed battles */}
      {completed.length > 0 && (
        <div className="mb-5">
          <h2 className="font-semibold text-muted-foreground text-sm mb-3 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Completed
          </h2>
          <div className="space-y-2">
            {completed.map((battle) => (
              <div key={battle.id} className="glass-panel rounded-xl p-3 flex items-center gap-3 opacity-60">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white line-through">{battle.title}</div>
                  <div className="text-[10px] text-muted-foreground">Completed · +{battle.xpReward} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {battles.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Skull className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No boss battles available. Check back soon!</p>
        </div>
      )}
    </div>
  );
}
