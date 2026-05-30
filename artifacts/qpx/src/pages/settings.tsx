import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  useGetPlayerProfile,
  useUpdatePlayerProfile,
  getGetPlayerProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Save, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RankBadge, RANKS } from "@/components/rank-badge";

const TITLES = [
  "Book Slayer", "Study Titan", "Iron Warrior", "Discipline King",
  "Creator Pro", "Coding Beast", "Consistency Legend",
];

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: player } = useGetPlayerProfile();
  const updateProfile = useUpdatePlayerProfile();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    username: "",
    avatarUrl: "",
    bio: "",
    title: "",
  });

  useEffect(() => {
    if (player) {
      setForm({
        username: player.username ?? "",
        avatarUrl: player.avatarUrl ?? "",
        bio: player.bio ?? "",
        title: player.title ?? "",
      });
    }
  }, [player]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({ data: form });
    queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!player) return null;

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-black text-white flex items-center gap-2 mb-6">
        <SettingsIcon className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
        Settings
      </motion.h1>

      {/* Player info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3">
          <RankBadge rankIndex={player.rankIndex} size="md" />
          <div>
            <div className="font-bold text-white">{player.username}</div>
            <div className="text-xs text-muted-foreground">{player.playerId}</div>
            <div className="text-xs" style={{ color: "#ffd700" }}>Level {player.level} · {player.rank}</div>
          </div>
        </div>
      </motion.div>

      {/* Profile form */}
      <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        onSubmit={handleSave} className="glass-panel rounded-xl p-5 space-y-4">
        <h2 className="font-bold text-white text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Profile
        </h2>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Username</label>
          <Input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Avatar URL</label>
          <Input
            value={form.avatarUrl}
            onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            placeholder="https://..."
            className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground mb-1 block">Bio</label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell your story..."
            className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-20"
          />
        </div>

        {/* Title selection */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-2 block flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Legendary Title
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, title: "" })}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                form.title === ""
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              None
            </button>
            {TITLES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, title: t })}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  form.title === t
                    ? "border-secondary text-secondary bg-secondary/10"
                    : "border-border/50 text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={updateProfile.isPending}
          className="w-full font-bold text-black"
          style={{ background: saved ? "#2ecc71" : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
        >
          <Save className="w-4 h-4 mr-2" />
          {updateProfile.isPending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </motion.form>

      {/* Game stats read-only */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-panel rounded-xl p-4 mt-4">
        <h2 className="font-bold text-white text-sm mb-3">Game Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total XP", value: player.totalXp.toLocaleString() },
            { label: "Level", value: player.level },
            { label: "Rank", value: player.rank },
            { label: "Coins", value: player.coins.toLocaleString() },
            { label: "Current Streak", value: `${player.streak} days` },
            { label: "Best Streak", value: `${player.longestStreak} days` },
          ].map(({ label, value }) => (
            <div key={label} className="p-2 rounded-lg bg-muted/30">
              <div className="text-[10px] text-muted-foreground">{label}</div>
              <div className="text-sm font-bold text-white">{value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
