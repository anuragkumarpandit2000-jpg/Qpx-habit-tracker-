import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Trash2, Check, Circle, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const MANUAL_KEY = "qpx-manual-targets";
const SKILL_TARGETS_KEY = "qpx-skill-targets";

interface ManualTarget {
  id: string;
  label: string;
  done: boolean;
  createdAt: string;
}

interface SkillTarget {
  id: string;
  skillKey: string;
  skillName: string;
  categoryLabel: string;
  categoryColor: string;
  categoryEmoji: string;
  durationValue: number;
  durationUnit: "days" | "weeks" | "months";
  startDate: string;
  done: boolean;
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function loadManualTargets(): ManualTarget[] {
  try {
    const raw = JSON.parse(localStorage.getItem(MANUAL_KEY) || "{}");
    return raw[todayKey()] || [];
  } catch { return []; }
}

function saveManualTargets(targets: ManualTarget[]) {
  try {
    const raw = JSON.parse(localStorage.getItem(MANUAL_KEY) || "{}");
    raw[todayKey()] = targets;
    localStorage.setItem(MANUAL_KEY, JSON.stringify(raw));
  } catch { /* ignore */ }
}

function loadSkillTargets(): SkillTarget[] {
  try { return JSON.parse(localStorage.getItem(SKILL_TARGETS_KEY) || "[]"); } catch { return []; }
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export default function TodaysTargets() {
  const { toast } = useToast();
  const [manual, setManual] = useState<ManualTarget[]>([]);
  const [skillTargets, setSkillTargets] = useState<SkillTarget[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    setManual(loadManualTargets());
    setSkillTargets(loadSkillTargets());
  }, []);

  const addTarget = useCallback(() => {
    if (!newLabel.trim()) { toast({ title: "Enter a target", variant: "destructive" }); return; }
    const t: ManualTarget = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    const next = [...manual, t];
    setManual(next);
    saveManualTargets(next);
    setNewLabel("");
    setShowInput(false);
    toast({ title: "Target added!" });
  }, [manual, newLabel]);

  const toggleManual = useCallback((id: string) => {
    const next = manual.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setManual(next);
    saveManualTargets(next);
  }, [manual]);

  const deleteManual = useCallback((id: string) => {
    const next = manual.filter(t => t.id !== id);
    setManual(next);
    saveManualTargets(next);
  }, [manual]);

  const toggleSkill = useCallback((id: string) => {
    const next = skillTargets.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setSkillTargets(next);
    localStorage.setItem(SKILL_TARGETS_KEY, JSON.stringify(next));
  }, [skillTargets]);

  const totalTargets = manual.length + skillTargets.length;
  const doneTargets = manual.filter(t => t.done).length + skillTargets.filter(t => t.done).length;
  const pct = totalTargets === 0 ? 0 : Math.round((doneTargets / totalTargets) * 100);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Today's Targets</h1>
            <p className="text-xs text-muted-foreground mt-1">{formatDate()}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-primary">{pct}%</div>
            <div className="text-[10px] text-muted-foreground">{doneTargets}/{totalTargets} done</div>
          </div>
        </div>
        {totalTargets > 0 && (
          <div className="mt-3 h-2 rounded-full bg-muted/40 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        )}
      </motion.div>

      {/* ── Skill Targets (auto-set) ──────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-white">Skill Targets</h2>
            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">Auto</span>
          </div>
          <button onClick={() => setSkillTargets(loadSkillTargets())}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {skillTargets.length === 0 ? (
          <div className="rounded-xl border border-border/40 p-6 text-center text-sm text-muted-foreground"
            style={{ background: "hsl(240 20% 8%)" }}>
            No skill targets set. Go to{" "}
            <a href="/skills" className="text-primary hover:underline">Skills</a>{" "}
            and add targets to see them here.
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {skillTargets.map(t => (
                <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                    t.done ? "opacity-60" : "hover:border-border")}
                  style={{
                    background: "hsl(240 20% 8%)",
                    borderColor: t.done ? "transparent" : `${t.categoryColor}33`,
                  }}
                  onClick={() => toggleSkill(t.id)}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: t.categoryColor + "22", border: `1px solid ${t.categoryColor}44` }}>
                    {t.categoryEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-semibold", t.done ? "line-through text-muted-foreground" : "text-white")}>
                      {t.skillName}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{t.categoryLabel}</div>
                  </div>
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    t.done ? "bg-green-500/20 text-green-400" : "bg-muted/40 text-muted-foreground group-hover:bg-muted/70")}>
                    {t.done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* ── Manual Targets ───────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-400" />
            <h2 className="font-bold text-sm text-white">Manual Targets</h2>
          </div>
          <button onClick={() => setShowInput(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors">
            <Plus className="w-3 h-3" /> Add Target
          </button>
        </div>

        <AnimatePresence>
          {showInput && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
              <div className="flex gap-2 p-1">
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTarget()}
                  placeholder="What do you want to achieve today?"
                  autoFocus
                  className="flex-1 bg-muted/40 border border-border/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-orange-500/60" />
                <button onClick={addTarget}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-400 transition-colors flex-shrink-0">
                  Add
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {manual.length === 0 ? (
          <div className="rounded-xl border border-border/40 p-6 text-center text-sm text-muted-foreground"
            style={{ background: "hsl(240 20% 8%)" }}>
            No targets for today. Add something to work towards!
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {manual.map(t => (
                <motion.div key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={cn("flex items-center gap-3 p-3 rounded-xl border transition-all group",
                    "cursor-pointer hover:border-border")}
                  style={{ background: "hsl(240 20% 8%)", borderColor: t.done ? "transparent" : "hsl(var(--border) / 0.4)" }}>
                  <button onClick={() => toggleManual(t.id)}
                    className={cn("w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors border",
                      t.done ? "bg-green-500/20 border-green-500/60 text-green-400" : "border-border/60 text-muted-foreground hover:border-orange-400/60 hover:text-orange-400")}>
                    {t.done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  </button>
                  <span className={cn("flex-1 text-sm", t.done ? "line-through text-muted-foreground" : "text-white")}>
                    {t.label}
                  </span>
                  <button onClick={() => deleteManual(t.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {doneTargets === totalTargets && totalTargets > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-4 rounded-xl p-4 text-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--secondary)/0.15))", border: "1px solid hsl(var(--primary)/0.3)" }}>
            <div className="text-2xl mb-1">🎉</div>
            <div className="font-black text-white">All targets complete!</div>
            <div className="text-xs text-muted-foreground mt-1">Outstanding work today, warrior.</div>
          </motion.div>
        )}
      </motion.section>
    </div>
  );
}
