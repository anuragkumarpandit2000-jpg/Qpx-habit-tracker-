import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  useGetPlayerProfile,
  useGetQuests,
  useCompleteQuest,
  useGetRecentAchievements,
  useGetCurrentSeason,
  useClaimDailyLogin,
  getGetPlayerProfileQueryKey,
  getGetQuestsQueryKey,
  getGetRecentAchievementsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Heart, Coins, Flame, CheckCircle2, Circle, Shield, Star, Gift, Trophy } from "lucide-react";
import { motion as m } from "framer-motion";
import { RankBadge } from "@/components/rank-badge";
import { RANK_COLORS } from "@/lib/rank-constants";
import { XpFloat, LevelUpBanner } from "@/components/xp-animation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SeasonTransition, { SeasonStats } from "@/components/season-transition";
import { SEASON_DATA } from "@/lib/season-data";

const CATEGORY_COLORS: Record<string, string> = {
  mind: "hsl(270 70% 60%)",
  body: "hsl(150 70% 50%)",
  knowledge: "hsl(190 90% 50%)",
  creation: "hsl(35 90% 60%)",
  discipline: "hsl(0 80% 60%)",
  health: "hsl(170 70% 50%)",
  productivity: "hsl(50 90% 60%)",
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 6) return { label: "Night", gradient: "radial-gradient(ellipse at 50% 0%, hsl(240 80% 20% / 0.4) 0%, transparent 70%)" };
  if (h < 12) return { label: "Morning", gradient: "radial-gradient(ellipse at 50% 0%, hsl(35 90% 50% / 0.2) 0%, transparent 70%)" };
  if (h < 17) return { label: "Afternoon", gradient: "radial-gradient(ellipse at 50% 0%, hsl(200 90% 50% / 0.15) 0%, transparent 70%)" };
  if (h < 20) return { label: "Evening", gradient: "radial-gradient(ellipse at 50% 0%, hsl(20 80% 50% / 0.2) 0%, transparent 70%)" };
  return { label: "Night", gradient: "radial-gradient(ellipse at 50% 0%, hsl(240 80% 20% / 0.4) 0%, transparent 70%)" };
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [showXp, setShowXp] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [newRankIndex, setNewRankIndex] = useState(0);
  const [loginClaimed, setLoginClaimed] = useState(false);
  const [claimToast, setClaimToast] = useState<string | null>(null);
  const autoClaimFired = useRef(false);
  const [showSeasonTransition, setShowSeasonTransition] = useState(false);
  const [transitionCompletedSeason, setTransitionCompletedSeason] = useState(1);
  const [transitionNextSeason, setTransitionNextSeason] = useState(2);
  const [transitionStats, setTransitionStats] = useState<SeasonStats | null>(null);

  const { data: player, isLoading: playerLoading } = useGetPlayerProfile();
  const { data: quests = [] } = useGetQuests();
  const { data: recentAchievements = [] } = useGetRecentAchievements();
  const { data: season } = useGetCurrentSeason();
  const completeQuest = useCompleteQuest();
  const claimDailyLogin = useClaimDailyLogin();

  const timeOfDay = getTimeOfDay();

  // Auto-claim daily login on every entry
  useEffect(() => {
    if (autoClaimFired.current || playerLoading || !player) return;
    autoClaimFired.current = true;
    claimDailyLogin.mutateAsync().then((res) => {
      queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
      setLoginClaimed(true);
      if (!res.alreadyClaimed) {
        setClaimToast(`+${res.reward.amount} ${res.reward.type === "coins" ? "Coins" : "XP"} — Day ${res.streakDay} reward!`);
        setTimeout(() => setClaimToast(null), 3500);
      }
    }).catch(() => {});
  }, [player, playerLoading]);

  const handleCompleteQuest = async (questId: number) => {
    const result = await completeQuest.mutateAsync({ id: questId });
    const r = result as any;
    setXpAmount(result.xpGained);
    setShowXp(true);
    if (r.seasonCompleted) {
      setTransitionCompletedSeason(r.completedSeason ?? 1);
      setTransitionNextSeason(r.nextSeason ?? 2);
      setTransitionStats({
        totalXp: r.preAdvanceStats?.totalXp ?? result.player.totalXp,
        streak: r.preAdvanceStats?.streak ?? 0,
        longestStreak: r.preAdvanceStats?.longestStreak ?? 0,
        finalRank: r.seasonFinalRank ?? result.player.rank ?? "Champion",
        finalTitle: r.preAdvanceStats?.finalTitle ?? "Titan",
        level: r.preAdvanceStats?.level ?? 10,
        questsCompleted: quests.filter((q) => q.completed).length + 1,
      });
      setShowSeasonTransition(true);
      return;
    }
    if (result.leveledUp) {
      setTimeout(() => {
        setNewLevel(result.player.level);
        setNewRankIndex(result.player.rankIndex);
        setShowLevelUp(true);
      }, 900);
    }
    queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentAchievementsQueryKey() });
  };

  const handleClaimLogin = async () => {
    try {
      await claimDailyLogin.mutateAsync();
      setLoginClaimed(true);
      queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
    } catch {
      // silently ignore
    }
  };

  const handleSeasonTransitionComplete = () => {
    setShowSeasonTransition(false);
    queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecentAchievementsQueryKey() });
  };

  if (playerLoading) {
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

  if (!player?.onboardingComplete) {
    navigate("/");
    return null;
  }

  const xpPercent = Math.round((player.xp / player.xpToNextLevel) * 100);
  const hpPercent = Math.round((player.hp / player.maxHp) * 100);
  const completedToday = quests.filter((q) => q.completed).length;
  const rankColor = RANK_COLORS[player.rankIndex];

  return (
    <div className="min-h-screen" style={{ background: timeOfDay.gradient }}>
      <XpFloat amount={xpAmount} visible={showXp} onComplete={() => setShowXp(false)} />
      <LevelUpBanner visible={showLevelUp} level={newLevel} rankIndex={newRankIndex} onComplete={() => setShowLevelUp(false)} />
      {showSeasonTransition && transitionStats && (
        <SeasonTransition
          completedSeason={transitionCompletedSeason}
          nextSeason={transitionNextSeason}
          stats={transitionStats}
          onComplete={handleSeasonTransitionComplete}
        />
      )}

      {/* Auto-claim toast */}
      <AnimatePresence>
        {claimToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-black"
            style={{ background: "linear-gradient(90deg, #ffd700, #ff8c00)", boxShadow: "0 4px 24px #ffd70080" }}
          >
            <Coins className="w-4 h-4" />
            {claimToast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Season banner — uses player's currentSeason for accurate display */}
        {(() => {
          const sd = SEASON_DATA[Math.max(0, ((player as any)?.currentSeason ?? 1) - 1)];
          if (!sd) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl px-4 py-2.5 flex items-center justify-between"
              style={{ borderColor: `${sd.primaryColor}30` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{sd.emoji}</span>
                <span className="text-xs font-semibold" style={{ color: sd.accentColor }}>{sd.name}: {sd.title}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{sd.theme}</span>
            </motion.div>
          );
        })()}

        {/* Player profile card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-5"
          style={{ borderColor: `${rankColor.from}30` }}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black text-black"
                style={{
                  background: `linear-gradient(135deg, ${rankColor.from}, ${rankColor.to})`,
                  boxShadow: `0 0 20px ${rankColor.glow}`,
                }}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1">
                <RankBadge rankIndex={player.rankIndex} size="sm" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-black text-lg text-white">{player.username}</h1>
                  <div className="text-xs text-muted-foreground">{player.playerId}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold" style={{ color: rankColor.from }}>{player.rank}</div>
                  <div className="text-xs text-muted-foreground">Level {player.level}</div>
                </div>
              </div>

              {player.title && (
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{ borderColor: `${rankColor.from}60`, color: rankColor.from, background: `${rankColor.from}15` }}>
                  <Shield className="w-2.5 h-2.5" />
                  {player.title}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { icon: Zap, value: player.totalXp, label: "Total XP", color: "hsl(var(--primary))" },
              { icon: Heart, value: `${player.hp}/${player.maxHp}`, label: "HP", color: "#e74c3c" },
              { icon: Coins, value: player.coins, label: "Coins", color: "#ffd700" },
              { icon: Flame, value: player.streak, label: "Streak", color: "#ff6b35" },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="text-center">
                <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
                <div className="text-sm font-bold text-white">{value}</div>
                <div className="text-[10px] text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* XP bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>XP Progress — Level {player.level}</span>
              <span>{player.xp} / {player.xpToNextLevel}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${rankColor.from}, ${rankColor.to})` }}
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* HP bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>HP — Discipline</span>
              <span>{player.hp} / {player.maxHp}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: hpPercent > 50 ? "#2ecc71" : hpPercent > 25 ? "#f39c12" : "#e74c3c" }}
                initial={{ width: 0 }}
                animate={{ width: `${hpPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>

        {/* Daily login claim */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #ffd700, #ff8c00)" }}>
              <Gift className="w-4 h-4 text-black" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Daily Login Reward</div>
              <div className="text-xs text-muted-foreground">
                {loginClaimed
                  ? `Day ${(player.loginStreakDay ?? 0)} claimed ✓`
                  : `Day ${(player.loginStreakDay ?? 0) + 1} reward available`}
              </div>
            </div>
          </div>
          {loginClaimed ? (
            <div className="text-xs font-bold px-3 py-1.5 rounded-lg text-black"
              style={{ background: "linear-gradient(90deg, #ffd700, #ff8c00)", opacity: 0.6 }}>
              Claimed ✓
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleClaimLogin}
              disabled={claimDailyLogin.isPending}
              className="text-black font-bold text-xs"
              style={{ background: "linear-gradient(90deg, #ffd700, #ff8c00)" }}
            >
              {claimDailyLogin.isPending ? "Claiming..." : "Claim"}
            </Button>
          )}
        </motion.div>

        {/* Today's quests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">Today's Quests</h2>
            <span className="text-xs text-muted-foreground">{completedToday}/{quests.length} complete</span>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {quests.map((quest, i) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "glass-panel rounded-xl p-3.5 flex items-center gap-3 cursor-pointer transition-all",
                    quest.completed ? "opacity-50" : "hover:border-primary/30"
                  )}
                >
                  <button
                    onClick={() => !quest.completed && handleCompleteQuest(quest.id)}
                    disabled={quest.completed || completeQuest.isPending}
                    className="flex-shrink-0"
                  >
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                      {quest.completed ? (
                        <CheckCircle2 className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </motion.div>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", quest.completed ? "line-through text-muted-foreground" : "text-white")}>
                      {quest.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          color: CATEGORY_COLORS[quest.category] ?? "hsl(var(--muted-foreground))",
                          background: `${CATEGORY_COLORS[quest.category] ?? "hsl(var(--muted))"}20`,
                        }}
                      >
                        {quest.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>+{quest.xpReward} XP</div>
                    <div className="text-[10px] text-yellow-500">+{quest.coinReward}</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Recent achievements */}
        {recentAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="font-bold text-white mb-3">Recent Achievements</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className="glass-panel rounded-xl p-3 flex-shrink-0 w-40"
                >
                  <Trophy className="w-5 h-5 mb-2" style={{ color: "hsl(var(--primary))" }} />
                  <div className="text-xs font-bold text-white truncate">{ach.title}</div>
                  <Badge variant="outline" className="mt-1 text-[9px] border-primary/30 text-primary">
                    {ach.rarity}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
