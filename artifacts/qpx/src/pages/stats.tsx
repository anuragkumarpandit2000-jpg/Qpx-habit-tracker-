import { motion } from "framer-motion";
import { useGetPlayerStats, useGetProgressHistory, useGetPlayerProfile } from "@workspace/api-client-react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PolarRadiusAxis,
} from "recharts";
import { BarChart3, Zap, Flame, Trophy, BookOpen } from "lucide-react";
import { RankBadge } from "@/components/rank-badge";

const CATEGORY_COLORS: Record<string, string> = {
  mind: "#bf00ff",
  body: "#2ecc71",
  knowledge: "#00bfff",
  creation: "#ff8c00",
  discipline: "#e74c3c",
  health: "#00bfa5",
  productivity: "#ffd700",
};

export default function Stats() {
  const { data: stats, isLoading: statsLoading } = useGetPlayerStats();
  const { data: history = [] } = useGetProgressHistory({ days: 30 });
  const { data: player } = useGetPlayerProfile();

  if (statsLoading || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 rounded-full border-2 border-transparent border-t-primary" />
      </div>
    );
  }

  const radarData = stats.questsByCategory.map((c) => ({
    category: c.category.slice(0, 4).toUpperCase(),
    value: c.count,
    fullName: c.category,
  }));

  const xpHistory = history.map((h) => ({
    date: h.date.slice(5),
    xp: h.xp,
    level: h.level,
    quests: h.questsCompleted,
  }));

  const barData = stats.xpByCategory.map((c) => ({
    name: c.category.slice(0, 4).toUpperCase(),
    xp: c.count,
    fill: CATEGORY_COLORS[c.category] ?? "#00bfff",
  }));

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-white flex items-center gap-2">
        <BarChart3 className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
        Statistics
      </motion.h1>

      {/* Key stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3">
        {[
          { icon: Zap, label: "Total XP", value: stats.totalXp.toLocaleString(), color: "hsl(var(--primary))" },
          { icon: Flame, label: "Best Streak", value: `${stats.longestStreak} days`, color: "#ff6b35" },
          { icon: Trophy, label: "Quests Done", value: stats.totalQuestsCompleted, color: "#ffd700" },
          { icon: BookOpen, label: "Journal Entries", value: stats.totalJournalEntries, color: "hsl(var(--secondary))" },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }} className="glass-panel rounded-xl p-4">
            <Icon className="w-5 h-5 mb-2" style={{ color }} />
            <div className="text-xl font-black text-white">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* XP Progress chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass-panel rounded-xl p-4">
        <h2 className="font-bold text-white text-sm mb-3">XP Earned — Last 30 Days</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={xpHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 15%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#666" }} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: "#666" }} />
            <Tooltip
              contentStyle={{ background: "hsl(240 20% 8%)", border: "1px solid hsl(240 20% 20%)", borderRadius: 8 }}
              labelStyle={{ color: "#fff", fontSize: 10 }}
              itemStyle={{ color: "hsl(var(--primary))", fontSize: 10 }}
            />
            <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))"
              strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Quests by category radar */}
      {radarData.length > 2 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-panel rounded-xl p-4">
          <h2 className="font-bold text-white text-sm mb-3">Quest Balance by Category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(240 20% 20%)" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 10, fill: "#888" }} />
              <PolarRadiusAxis tick={{ fontSize: 8, fill: "#666" }} />
              <Radar name="Quests" dataKey="value" stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* XP by category bar chart */}
      {barData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-panel rounded-xl p-4">
          <h2 className="font-bold text-white text-sm mb-3">XP Earned by Category</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 20% 15%)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#666" }} />
              <YAxis tick={{ fontSize: 9, fill: "#666" }} />
              <Tooltip
                contentStyle={{ background: "hsl(240 20% 8%)", border: "1px solid hsl(240 20% 20%)", borderRadius: 8 }}
                labelStyle={{ color: "#fff", fontSize: 10 }}
                itemStyle={{ fontSize: 10 }}
              />
              <Bar dataKey="xp" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Rank history */}
      {stats.rankHistory.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="glass-panel rounded-xl p-4">
          <h2 className="font-bold text-white text-sm mb-3">Rank History</h2>
          <div className="space-y-2">
            {stats.rankHistory.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <RankBadge rankIndex={["Recruit","Cadet","Trainee","Warrior","Elite Warrior","Champion","Legend","Master","Grandmaster","Titan"].indexOf(r.rank)} size="sm" />
                <div>
                  <div className="text-xs font-semibold text-white">{r.rank}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(r.achievedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievements count */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass-panel rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-white">{stats.totalAchievementsUnlocked}</div>
            <div className="text-xs text-muted-foreground">Achievements Unlocked</div>
          </div>
          <Trophy className="w-10 h-10 text-yellow-400 opacity-50" />
        </div>
      </motion.div>
    </div>
  );
}
