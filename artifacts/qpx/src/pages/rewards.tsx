import { motion } from "framer-motion";
import {
  useGetDailyLoginCalendar,
  useClaimDailyLogin,
  getGetDailyLoginCalendarQueryKey,
  getGetPlayerProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Gift, CheckCircle2, Zap, Coins, Star, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REWARD_COLORS = {
  coins: "#ffd700",
  xp: "hsl(var(--primary))",
  badge_fragment: "#bf00ff",
  special: "#ff8c00",
  rare: "#ff4444",
};

const REWARD_ICONS = {
  coins: Coins,
  xp: Zap,
  badge_fragment: Star,
  special: Star,
  rare: Star,
};

export default function Rewards() {
  const queryClient = useQueryClient();
  const { data: calendar, isLoading } = useGetDailyLoginCalendar();
  const claimLogin = useClaimDailyLogin();

  const handleClaim = async () => {
    await claimLogin.mutateAsync();
    queryClient.invalidateQueries({ queryKey: getGetDailyLoginCalendarQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
  };

  const todayClaimed = calendar?.claimedDays.includes(calendar.currentStreak + 1) ?? false;

  if (isLoading || !calendar) {
    return <div className="min-h-screen flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 rounded-full border-2 border-transparent border-t-primary" />
    </div>;
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-yellow-400" />
          Daily Rewards
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Streak day {calendar.currentStreak} · Log in daily to earn rewards</p>
      </motion.div>

      {/* Today's claim */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-5 mb-5 text-center">
        {todayClaimed ? (
          <div>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-400" />
            <div className="font-bold text-white">Today's reward claimed!</div>
            <div className="text-xs text-muted-foreground mt-1">Come back tomorrow for more</div>
          </div>
        ) : (
          <div>
            <div className="text-4xl font-black mb-1" style={{ color: "hsl(var(--primary))" }}>Day {calendar.currentStreak + 1}</div>
            <div className="text-sm text-muted-foreground mb-3">Daily login reward available</div>
            <Button
              onClick={handleClaim}
              disabled={claimLogin.isPending}
              className="font-bold text-black px-8"
              style={{ background: "linear-gradient(90deg, #ffd700, #ff8c00)" }}
            >
              <Gift className="w-4 h-4 mr-2" />
              Claim Reward
            </Button>
          </div>
        )}
      </motion.div>

      {/* 30-day calendar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="font-bold text-white text-sm mb-3">30-Day Reward Calendar</h2>
        <div className="grid grid-cols-5 gap-2">
          {calendar.rewards.map((day, i) => {
            const rewardType = day.reward.type as keyof typeof REWARD_COLORS;
            const color = REWARD_COLORS[rewardType] ?? "hsl(var(--primary))";
            const Icon = REWARD_ICONS[rewardType] ?? Gift;
            const isCurrent = day.day === calendar.currentStreak + 1;
            const isClaimed = day.claimed;
            const isFuture = day.day > calendar.currentStreak + 1;

            return (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "relative rounded-xl p-2 border text-center transition-all",
                  day.special && "col-span-1",
                  isCurrent && "border-2",
                  isClaimed && "opacity-60",
                  isFuture && "opacity-40"
                )}
                style={{
                  borderColor: isCurrent ? color : `${color}20`,
                  background: isClaimed ? `${color}10` : day.special ? `${color}15` : "hsl(var(--card) / 0.5)",
                }}
              >
                <div className="text-[9px] text-muted-foreground mb-1">Day {day.day}</div>
                {isClaimed ? (
                  <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color }} />
                ) : isFuture ? (
                  <Lock className="w-3.5 h-3.5 mx-auto text-muted-foreground" />
                ) : (
                  <Icon className="w-4 h-4 mx-auto" style={{ color }} />
                )}
                <div className="text-[8px] font-bold mt-1" style={{ color }}>
                  {day.reward.amount}
                </div>
                {day.special && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400" />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-4 flex flex-wrap gap-3">
        {Object.entries(REWARD_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <span className="text-[10px] text-muted-foreground capitalize">{type.replace("_", " ")}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
