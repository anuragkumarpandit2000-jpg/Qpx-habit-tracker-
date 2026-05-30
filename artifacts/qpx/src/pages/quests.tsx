import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetQuests,
  useCreateQuest,
  useCompleteQuest,
  useDeleteQuest,
  useGetPlayerProfile,
  getGetQuestsQueryKey,
  getGetPlayerProfileQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, CheckCircle2, Circle, Trash2, Sword, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XpFloat, LevelUpBanner } from "@/components/xp-animation";
import { cn } from "@/lib/utils";

const CATEGORIES = ["mind", "body", "knowledge", "creation", "discipline", "health", "productivity"];
const CATEGORY_COLORS: Record<string, string> = {
  mind: "hsl(270 70% 60%)",
  body: "hsl(150 70% 50%)",
  knowledge: "hsl(190 90% 50%)",
  creation: "hsl(35 90% 60%)",
  discipline: "hsl(0 80% 60%)",
  health: "hsl(170 70% 50%)",
  productivity: "hsl(50 90% 60%)",
};

export default function Quests() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [form, setForm] = useState({ title: "", category: "productivity", xpReward: 10, coinReward: 5 });

  const { data: quests = [], isLoading } = useGetQuests();
  const createQuest = useCreateQuest();
  const completeQuest = useCompleteQuest();
  const deleteQuest = useDeleteQuest();

  const grouped = CATEGORIES.reduce<Record<string, typeof quests>>((acc, cat) => {
    acc[cat] = quests.filter((q) => q.category === cat);
    return acc;
  }, {});

  const handleComplete = async (questId: number) => {
    const result = await completeQuest.mutateAsync({ id: questId });
    setXpAmount(result.xpGained);
    setShowXp(true);
    if (result.leveledUp) {
      setTimeout(() => { setNewLevel(result.player.level); setShowLevelUp(true); setTimeout(() => setShowLevelUp(false), 3000); }, 1000);
    }
    queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
  };

  const handleDelete = async (questId: number) => {
    await deleteQuest.mutateAsync({ id: questId });
    queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey() });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createQuest.mutateAsync({ data: form });
    queryClient.invalidateQueries({ queryKey: getGetQuestsQueryKey() });
    setForm({ title: "", category: "productivity", xpReward: 10, coinReward: 5 });
    setShowForm(false);
  };

  const completedCount = quests.filter((q) => q.completed).length;

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <XpFloat amount={xpAmount} visible={showXp} onComplete={() => setShowXp(false)} />
      <LevelUpBanner visible={showLevelUp} level={newLevel} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sword className="w-6 h-6" style={{ color: "hsl(var(--primary))" }} />
            Daily Quests
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{completedCount}/{quests.length} completed today</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="text-black font-bold"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Quest
        </Button>
      </div>

      {/* Progress bar */}
      {quests.length > 0 && (
        <div className="glass-panel rounded-xl p-4 mb-5">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Today's Progress</span>
            <span>{Math.round((completedCount / quests.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              animate={{ width: `${(completedCount / quests.length) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      )}

      {/* Add quest form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="glass-panel rounded-xl p-4 mb-5 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">New Quest</h3>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Quest title..."
              className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="bg-card/50 border-border/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={form.xpReward}
                onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })}
                placeholder="XP reward"
                min={1}
                className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground"
              />
            </div>
            <Button
              type="submit"
              disabled={createQuest.isPending}
              className="w-full text-black font-bold"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
            >
              {createQuest.isPending ? "Adding..." : "Add Quest"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grouped quests */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const catQuests = grouped[cat];
          if (catQuests.length === 0) return null;
          const color = CATEGORY_COLORS[cat];
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-semibold capitalize" style={{ color }}>{cat}</span>
                <span className="text-[10px] text-muted-foreground">
                  ({catQuests.filter((q) => q.completed).length}/{catQuests.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {catQuests.map((quest) => (
                  <motion.div
                    key={quest.id}
                    layout
                    className={cn(
                      "glass-panel rounded-xl p-3 flex items-center gap-3 group",
                      quest.completed && "opacity-50"
                    )}
                  >
                    <button
                      onClick={() => !quest.completed && handleComplete(quest.id)}
                      disabled={quest.completed || completeQuest.isPending}
                      className="flex-shrink-0"
                    >
                      <motion.div whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                        {quest.completed ? (
                          <CheckCircle2 className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </motion.div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={cn("text-sm", quest.completed ? "line-through text-muted-foreground" : "text-white")}>
                        {quest.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>+{quest.xpReward} XP</span>
                      <button
                        onClick={() => handleDelete(quest.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
        {quests.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Sword className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No quests yet. Add your first quest to begin!</p>
          </div>
        )}
      </div>
    </div>
  );
}
