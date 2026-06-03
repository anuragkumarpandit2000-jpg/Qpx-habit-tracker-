import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlayerProfileQueryKey } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Target, Plus, Trash2, Clock, X, Check, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_TICKS    = "qpx-skill-ticks";
const STORAGE_TARGETS  = "qpx-skill-targets";

function getSkillTier(sectionName: string): "beginner" | "intermediate" | "advanced" {
  const s = sectionName.toLowerCase();
  if (s.includes("advanced") || s.includes("expert") || s.includes("hacking") || s.includes("dream") || s.includes("🌲")) return "advanced";
  if (s.includes("intermediate") || s.includes("web") || s.includes("frontend") || s.includes("backend") || s.includes("database") || s.includes("language") || s.includes("security") || s.includes("tool") || s.includes("development") || s.includes("🌿") || s.includes("🌳") || s.includes("microcontroller") || s.includes("robotics") || s.includes("deployment") || s.includes("app development")) return "intermediate";
  return "beginner";
}
const SKILL_XP: Record<string, number> = { beginner: 5, intermediate: 10, advanced: 20 };

// ─── Types ────────────────────────────────────────────────────────────
interface SkillSection { name: string; emoji?: string; skills: string[] }
interface SkillCategory { id: string; emoji: string; label: string; color: string; sections: SkillSection[] }
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

// ─── Skill data ───────────────────────────────────────────────────────
const SKILLS: SkillCategory[] = [
  {
    id: "prog", emoji: "🚀", label: "Programming & Software Dev", color: "#3b82f6",
    sections: [
      { name: "🌱 Beginner", skills: ["Computer Basics","Typing Speed","Internet Basics","Git & GitHub","VS Code"] },
      { name: "🌿 Web Development", skills: ["HTML","CSS","Responsive Design","JavaScript","DOM Manipulation","APIs","Local Storage"] },
      { name: "🌳 Frontend", skills: ["React","Next.js","Tailwind CSS","UI/UX Basics"] },
      { name: "🌲 Backend", skills: ["Node.js","Express.js","Authentication","REST APIs","Databases"] },
      { name: "🗄️ Databases", skills: ["SQL","MySQL","PostgreSQL","MongoDB"] },
      { name: "💻 Languages", skills: ["JavaScript","Python","C","C++","Java","TypeScript"] },
      { name: "📱 App Development", skills: ["React Native","Flutter","Android Studio"] },
      { name: "☁️ Deployment", skills: ["Vercel","Netlify","Linux Basics","Docker"] },
    ],
  },
  {
    id: "ai", emoji: "🤖", label: "AI & Artificial Intelligence", color: "#8b5cf6",
    sections: [
      { name: "Foundation", skills: ["AI Basics","Machine Learning Basics","Deep Learning Basics","Python for AI","NumPy","Pandas","Matplotlib"] },
      { name: "AI Tools", skills: ["ChatGPT APIs","AI Agents","Voice Assistants","Prompt Engineering"] },
      { name: "Advanced", skills: ["Computer Vision","NLP","LLM Development","RAG Systems"] },
    ],
  },
  {
    id: "cyber", emoji: "🛡️", label: "Cybersecurity / Ethical Hacking", color: "#ef4444",
    sections: [
      { name: "Basics", skills: ["Networking","IP Address","DNS","HTTP/HTTPS"] },
      { name: "Security", skills: ["Linux","Kali Linux","Web Security","OWASP"] },
      { name: "Ethical Hacking", skills: ["Vulnerability Assessment","Penetration Testing","Wireshark","Burp Suite"] },
      { name: "Advanced", skills: ["Reverse Engineering","Malware Analysis","Digital Forensics"] },
    ],
  },
  {
    id: "robotics", emoji: "🤖", label: "Robotics & Hardware", color: "#f59e0b",
    sections: [
      { name: "Electronics", skills: ["Current","Voltage","Circuits","Components"] },
      { name: "Microcontrollers", skills: ["Arduino","ESP32","Raspberry Pi"] },
      { name: "Robotics", skills: ["Sensors","Motors","Automation"] },
      { name: "Advanced", skills: ["AI Robots","Computer Vision Robots","Humanoid Robotics"] },
    ],
  },
  {
    id: "arvr", emoji: "🥽", label: "AR / VR / Hologram Technology", color: "#06b6d4",
    sections: [
      { name: "Basics", skills: ["AR Concepts","VR Concepts"] },
      { name: "Development", skills: ["Unity","C#"] },
      { name: "Advanced", skills: ["Gesture Control","Holographic Interfaces","Smart Glasses"] },
      { name: "Dream Projects", skills: ["Parker AI","Holographic Band","AR Human Assistant"] },
    ],
  },
  {
    id: "design", emoji: "🎨", label: "Design Skills", color: "#ec4899",
    sections: [
      { name: "Graphics", skills: ["Canva","Photoshop"] },
      { name: "UI/UX", skills: ["Figma","Wireframing","Prototyping"] },
      { name: "3D Design", skills: ["Blender","3D Printing Design"] },
    ],
  },
  {
    id: "content", emoji: "🎥", label: "Content Creation", color: "#f97316",
    sections: [
      { name: "Video Editing", skills: ["CapCut","DaVinci Resolve"] },
      { name: "Content Skills", skills: ["Storytelling","Hook Creation","Script Writing"] },
      { name: "Social Media", skills: ["YouTube","Instagram","Shorts Strategy"] },
    ],
  },
  {
    id: "comms", emoji: "🗣️", label: "Communication Skills", color: "#22c55e",
    sections: [
      { name: "English", skills: ["Vocabulary","Grammar","Speaking"] },
      { name: "Public Speaking", skills: ["Confidence","Presentation"] },
      { name: "Writing", skills: ["Professional Writing","Copywriting"] },
    ],
  },
  {
    id: "biz", emoji: "💰", label: "Business & Entrepreneurship", color: "#eab308",
    sections: [
      { name: "Basics", skills: ["Business Models","Startup Basics"] },
      { name: "Online Business", skills: ["Freelancing","SaaS","Digital Products"] },
      { name: "Growth", skills: ["Marketing","Sales","Branding"] },
    ],
  },
  {
    id: "productivity", emoji: "📈", label: "Productivity & Self-Improvement", color: "#14b8a6",
    sections: [
      { name: "Discipline", skills: ["Habit Building","Time Management"] },
      { name: "Focus", skills: ["Deep Work","Meditation"] },
      { name: "Personal Growth", skills: ["Goal Setting","Decision Making"] },
    ],
  },
  {
    id: "academic", emoji: "📚", label: "Academic Mastery — IIT Path", color: "#a78bfa",
    sections: [
      { name: "Class 10", skills: ["Maths","Science","SST","English","Hindi"] },
      { name: "IIT Foundation", skills: ["Algebra","Geometry","Trigonometry","Physics Concepts"] },
      { name: "Future JEE", skills: ["JEE Maths","JEE Physics","JEE Chemistry"] },
    ],
  },
  {
    id: "special", emoji: "⚡", label: "Special Skills — Future Vision", color: "#f43f5e",
    sections: [
      { name: "Parker AI Assistant", skills: ["Voice AI","Avatar AI","Memory Systems","AI Agents"] },
      { name: "Holographic Band", skills: ["Electronics","AI","AR Interface","Gesture Recognition"] },
      { name: "AR Human Project", skills: ["Character Design","Lip Sync","Speech Synthesis","Real-Time AI"] },
    ],
  },
  {
    id: "combat", emoji: "🥊", label: "Combat Sports & Self-Defense", color: "#ef4444",
    sections: [
      { name: "🌱 Basic Fitness", skills: ["Warm-up & Mobility","Footwork","Balance","Stance (Orthodox/Southpaw)"] },
      { name: "🥊 Kickboxing", skills: ["Jab","Cross","Hook","Uppercut","Front Kick","Roundhouse Kick","Low Kick","Defense & Guard","Combinations","Sparring Basics"] },
      { name: "🛡️ Self-Defense", skills: ["Situational Awareness","Escaping Grabs","Basic Defensive Techniques","Conflict De-escalation"] },
      { name: "Advanced", skills: ["Fight Strategy","Timing & Distance Management","Counter Attacks"] },
    ],
  },
  {
    id: "calisthenics", emoji: "🤸", label: "Calisthenics", color: "#22c55e",
    sections: [
      { name: "🌱 Foundation", skills: ["Push-ups","Squats","Lunges","Plank","Jumping Jacks"] },
      { name: "💪 Strength Building", skills: ["Pull-ups","Chin-ups","Dips","Pike Push-ups","Hanging Leg Raises"] },
      { name: "🔥 Intermediate", skills: ["Archer Push-ups","Explosive Push-ups","L-Sit","Pistol Squat","Muscle-up Progression"] },
      { name: "⚡ Advanced Skills", skills: ["Muscle-up","Front Lever","Back Lever","Handstand","Handstand Push-up","Human Flag","Planche"] },
    ],
  },
  {
    id: "athletic", emoji: "🏃", label: "Athletic Development", color: "#f59e0b",
    sections: [
      { name: "Speed", skills: ["Sprinting","Agility Drills"] },
      { name: "Endurance", skills: ["Running","Cycling","Skipping Rope"] },
      { name: "Mobility", skills: ["Stretching","Flexibility","Joint Health"] },
    ],
  },
  {
    id: "mental", emoji: "🧠", label: "Mental Performance", color: "#8b5cf6",
    sections: [
      { name: "Focus", skills: ["Meditation","Concentration Training"] },
      { name: "Discipline", skills: ["Habit Tracking","Consistency"] },
      { name: "Resilience", skills: ["Handling Failure","Stress Management"] },
    ],
  },
];

// Beast Mode stacks (display only)
const BEAST_STACKS = [
  { emoji: "🧠", label: "Brain Skills",   color: "#8b5cf6", skills: ["Class 10 + IIT Foundation","Programming","AI","Robotics","Entrepreneurship","English Communication"] },
  { emoji: "🎬", label: "Creator Skills", color: "#f97316", skills: ["Video Editing","Content Creation","Design"] },
  { emoji: "⚙️", label: "Builder Skills", color: "#3b82f6", skills: ["Web Apps","Mobile Apps","Parker AI","Holographic Band"] },
  { emoji: "💪", label: "Body Skills",    color: "#22c55e", skills: ["Calisthenics","Kickboxing","Running","Mobility","Self-Defense"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────
function skillKey(catId: string, sectionName: string, skill: string) {
  return `${catId}::${sectionName}::${skill}`;
}

function totalSeconds(t: SkillTarget): number {
  const u = { days: 86400, weeks: 604800, months: 2592000 };
  return t.durationValue * u[t.durationUnit];
}

function elapsedFraction(t: SkillTarget): number {
  const now  = Date.now() / 1000;
  const start = new Date(t.startDate).getTime() / 1000;
  return Math.min((now - start) / totalSeconds(t), 1);
}

function durationLabel(t: SkillTarget) {
  return `${t.durationValue} ${t.durationUnit}`;
}

function deadlineLabel(t: SkillTarget) {
  const end = new Date(t.startDate).getTime() + totalSeconds(t) * 1000;
  const d = new Date(end);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
}

function daysLeft(t: SkillTarget): number {
  const end = new Date(t.startDate).getTime() + totalSeconds(t) * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

function totalSkills() {
  return SKILLS.reduce((a, c) => a + c.sections.reduce((b, s) => b + s.skills.length, 0), 0);
}

// ─── Target modal ─────────────────────────────────────────────────────
function TargetModal({
  skill, cat, onClose, onAdd,
}: {
  skill: { key: string; name: string };
  cat: SkillCategory;
  onClose: () => void;
  onAdd: (t: SkillTarget) => void;
}) {
  const [val, setVal] = useState(1);
  const [unit, setUnit] = useState<"days" | "weeks" | "months">("weeks");

  const submit = () => {
    onAdd({
      id: `${Date.now()}`,
      skillKey: skill.key,
      skillName: skill.name,
      categoryLabel: cat.label,
      categoryColor: cat.color,
      categoryEmoji: cat.emoji,
      durationValue: val,
      durationUnit: unit,
      startDate: new Date().toISOString(),
      done: false,
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="glass-panel rounded-2xl p-5 w-full max-w-sm space-y-4"
        style={{ borderColor: `${cat.color}40` }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{cat.emoji} {cat.label}</div>
            <div className="text-base font-black text-white mt-0.5">{skill.name}</div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">I will learn this in:</label>
          <div className="flex gap-2">
            <input
              type="number" min={1} max={365} value={val}
              onChange={(e) => setVal(Math.max(1, Number(e.target.value)))}
              className="w-20 text-sm bg-white/10 border border-border/40 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/60 text-center font-bold"
              style={{ colorScheme: "dark" }}
            />
            <div className="flex gap-1 flex-1">
              {(["days","weeks","months"] as const).map((u) => (
                <button key={u} onClick={() => setUnit(u)}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={unit === u
                    ? { background: `${cat.color}25`, color: cat.color, border: `1px solid ${cat.color}50` }
                    : { color: "#64748b", border: "1px solid transparent", background: "transparent" }}>
                  {u}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Deadline: <span className="text-foreground font-semibold">{deadlineLabel({ durationValue: val, durationUnit: unit, startDate: new Date().toISOString() } as SkillTarget)}</span>
          </p>
        </div>

        <button onClick={submit}
          className="w-full py-2.5 rounded-xl font-bold text-sm text-black active:scale-95 transition-transform"
          style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}bb)` }}>
          Add to Targets 🎯
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────
export default function Skills() {
  const [tab, setTab] = useState<"tree" | "targets" | "beast">("tree");

  const [ticked, setTicked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_TICKS) || "{}"); } catch { return {}; }
  });
  const [targets, setTargets] = useState<SkillTarget[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_TARGETS) || "[]"); } catch { return []; }
  });

  const [openCats, setOpenCats]     = useState<Record<string, boolean>>({});
  const [openSecs, setOpenSecs]     = useState<Record<string, boolean>>({});
  const [modal, setModal]           = useState<{ key: string; name: string; cat: SkillCategory } | null>(null);
  const [search, setSearch]         = useState("");

  useEffect(() => { localStorage.setItem(STORAGE_TICKS, JSON.stringify(ticked)); }, [ticked]);
  useEffect(() => { localStorage.setItem(STORAGE_TARGETS, JSON.stringify(targets)); }, [targets]);

  const queryClient = useQueryClient();
  const tickSkill = (key: string, sectionName: string) => {
    const nowTicked = !ticked[key];
    setTicked(p => ({ ...p, [key]: nowTicked }));
    const tier = getSkillTier(sectionName);
    fetch("/api/player/skill-learned", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, undo: !nowTicked }),
    }).then(() => queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() }))
      .catch(() => {});
  };

  const tickedCount = Object.values(ticked).filter(Boolean).length;
  const total       = totalSkills();

  const addTarget = (t: SkillTarget) => setTargets((p) => [...p, t]);
  const removeTarget = (id: string) => setTargets((p) => p.filter((t) => t.id !== id));
  const markTargetDone = (id: string) => setTargets((p) => p.map((t) => t.id === id ? { ...t, done: true } : t));

  const isTargeted = (key: string) => targets.some((t) => t.skillKey === key && !t.done);

  const filteredSkills = search.trim()
    ? SKILLS.map((cat) => ({
        ...cat,
        sections: cat.sections.map((sec) => ({
          ...sec,
          skills: sec.skills.filter((s) => s.toLowerCase().includes(search.toLowerCase())),
        })).filter((sec) => sec.skills.length > 0),
      })).filter((cat) => cat.sections.length > 0)
    : SKILLS;

  const activeTargets = targets.filter((t) => !t.done);
  const doneTargets   = targets.filter((t) => t.done);

  return (
    <div className="min-h-screen pb-24"
      style={{ background: "linear-gradient(180deg, hsl(240 20% 7%) 0%, hsl(240 20% 5%) 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Skill Tree</h1>
              <p className="text-xs text-muted-foreground">Beast Mode Stack · 16 Categories</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-black text-white">{tickedCount}<span className="text-muted-foreground font-normal text-sm">/{total}</span></div>
              <div className="text-[10px] text-muted-foreground">{Math.round((tickedCount/total)*100)}% unlocked</div>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              initial={{ width: 0 }} animate={{ width: `${Math.round((tickedCount/total)*100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] text-muted-foreground">{activeTargets.length} active targets</span>
            <span className="text-[10px] text-muted-foreground ml-auto">{tickedCount} skills mastered</span>
          </div>
        </motion.div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 p-1 glass-panel rounded-xl">
          {([
            { key: "tree",    label: "Skill Tree",   emoji: "🌳" },
            { key: "targets", label: "My Targets",   emoji: "🎯" },
            { key: "beast",   label: "Beast Mode",   emoji: "🔥" },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              style={tab === t.key
                ? { background: "linear-gradient(90deg, hsl(var(--primary)/0.25), hsl(var(--secondary)/0.15))", color: "white", border: "1px solid hsl(var(--primary)/0.4)" }
                : { color: "#64748b" }}>
              <span>{t.emoji}</span> {t.label}
              {t.key === "targets" && activeTargets.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-[9px] font-black text-black flex items-center justify-center">
                  {activeTargets.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════ SKILL TREE TAB ════ */}
        <AnimatePresence mode="wait">
          {tab === "tree" && (
            <motion.div key="tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Search */}
              <div className="relative">
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full bg-white/5 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {filteredSkills.map((cat, ci) => {
                const catDone = cat.sections.reduce((a, s) => a + s.skills.filter(sk => ticked[skillKey(cat.id, s.name, sk)]).length, 0);
                const catTotal = cat.sections.reduce((a, s) => a + s.skills.length, 0);
                const catOpen = openCats[cat.id] ?? false;

                return (
                  <motion.div key={cat.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.03 }}
                    className="glass-panel rounded-2xl overflow-hidden"
                    style={{ borderColor: `${cat.color}25` }}>

                    <button onClick={() => setOpenCats(p => ({ ...p, [cat.id]: !p[cat.id] }))}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                      <span className="text-xl">{cat.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-white">{cat.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{catDone}/{catTotal} skills</div>
                      </div>
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((catDone/catTotal)*100)}%`, background: cat.color }} />
                      </div>
                      <div className="ml-1 text-[10px] font-bold w-7 text-right" style={{ color: cat.color }}>
                        {Math.round((catDone/catTotal)*100)}%
                      </div>
                      {catOpen
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />}
                    </button>

                    <AnimatePresence initial={false}>
                      {catOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                          <div className="border-t border-border/30 divide-y divide-border/20">
                            {cat.sections.map((sec) => {
                              const secKey = `${cat.id}::${sec.name}`;
                              const secOpen = openSecs[secKey] ?? true;
                              const secDone = sec.skills.filter(sk => ticked[skillKey(cat.id, sec.name, sk)]).length;

                              return (
                                <div key={sec.name}>
                                  <button onClick={() => setOpenSecs(p => ({ ...p, [secKey]: !p[secKey] }))}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                                    <span className="text-xs font-semibold text-muted-foreground flex-1 text-left">{sec.name}</span>
                                    <span className="text-[10px]" style={{ color: cat.color }}>{secDone}/{sec.skills.length}</span>
                                    {secOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {secOpen && (
                                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                                        transition={{ duration: 0.18 }} className="overflow-hidden">
                                        {sec.skills.map((skill, si) => {
                                          const key     = skillKey(cat.id, sec.name, skill);
                                          const done    = ticked[key];
                                          const targeted = isTargeted(key);

                                          return (
                                            <motion.div key={skill}
                                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: si * 0.02 }}
                                              className={cn("flex items-center gap-2.5 px-4 py-2.5 group hover:bg-white/5 transition-colors border-b border-border/10 last:border-0", done ? "opacity-55" : "")}>

                                              <button onClick={() => tickSkill(key, sec.name)} className="flex-shrink-0">
                                                <motion.div whileTap={{ scale: 0.8 }}>
                                                  {done
                                                    ? <CheckCircle2 className="w-4 h-4" style={{ color: cat.color }} />
                                                    : <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />}
                                                </motion.div>
                                              </button>

                                              <span className={cn("text-sm flex-1 leading-snug", done ? "line-through text-muted-foreground" : "text-foreground")}>
                                                {skill}
                                              </span>
                                              {!done && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded opacity-40 group-hover:opacity-90 transition-opacity flex-shrink-0"
                                                  style={{ background: `${cat.color}15`, color: cat.color }}>
                                                  +{SKILL_XP[getSkillTier(sec.name)]}xp
                                                </span>
                                              )}

                                              {targeted && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                                                  style={{ background: `${cat.color}20`, color: cat.color }}>🎯</span>
                                              )}

                                              {!done && (
                                                <button
                                                  onClick={() => setModal({ key, name: skill, cat })}
                                                  className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 text-muted-foreground hover:text-white"
                                                  title="Set learning target">
                                                  <Target className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </motion.div>
                                          );
                                        })}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ════ TARGETS TAB ════ */}
          {tab === "targets" && (
            <motion.div key="targets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {activeTargets.length === 0 && doneTargets.length === 0 && (
                <div className="glass-panel rounded-2xl p-8 text-center">
                  <div className="text-4xl mb-3">🎯</div>
                  <div className="text-sm font-bold text-white">No targets yet</div>
                  <div className="text-xs text-muted-foreground mt-1">Go to the Skill Tree tab, hover any skill, and tap the 🎯 icon to set a learning target with a deadline.</div>
                </div>
              )}

              {activeTargets.length > 0 && (
                <>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Active Targets ({activeTargets.length})</div>
                  {activeTargets.map((t) => {
                    const frac = elapsedFraction(t);
                    const left = daysLeft(t);
                    const pct  = Math.round(frac * 100);
                    const isOverdue = left === 0 && !t.done;
                    const skillDone = ticked[t.skillKey];

                    return (
                      <motion.div key={t.id} layout
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-2xl p-4 space-y-3"
                        style={{ borderColor: isOverdue ? "#ef444440" : `${t.categoryColor}25` }}>

                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                            style={{ background: `${t.categoryColor}20` }}>
                            {t.categoryEmoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">{t.skillName}</div>
                            <div className="text-[10px] text-muted-foreground">{t.categoryLabel}</div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {skillDone && (
                              <button onClick={() => markTargetDone(t.id)}
                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg text-black active:scale-95 transition-transform"
                                style={{ background: `linear-gradient(90deg, ${t.categoryColor}, ${t.categoryColor}bb)` }}>
                                <Check className="w-3 h-3" /> Done
                              </button>
                            )}
                            <button onClick={() => removeTarget(t.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-muted-foreground transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-[10px] mb-1.5">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" /> {durationLabel(t)} target
                            </span>
                            <span style={{ color: isOverdue ? "#ef4444" : t.categoryColor }} className="font-bold">
                              {isOverdue ? "Overdue!" : `${left}d left`}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full"
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              style={{ background: isOverdue ? "#ef4444" : `linear-gradient(90deg, ${t.categoryColor}, ${t.categoryColor}bb)` }} />
                          </div>
                          <div className="flex justify-between text-[9px] mt-1 text-muted-foreground">
                            <span>Started {new Date(t.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                            <span>Due {deadlineLabel(t)}</span>
                          </div>
                        </div>

                        {!skillDone && (
                          <button onClick={() => {
                              const sectionName = t.skillKey.split("::")[1] ?? "";
                              tickSkill(t.skillKey, sectionName);
                            }}
                            className="w-full py-1.5 rounded-lg text-xs font-semibold text-center transition-colors hover:bg-white/10"
                            style={{ color: t.categoryColor, border: `1px solid ${t.categoryColor}30` }}>
                            Mark skill as learned ✓
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </>
              )}

              {doneTargets.length > 0 && (
                <>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mt-2">Completed ({doneTargets.length})</div>
                  {doneTargets.map((t) => (
                    <motion.div key={t.id} layout
                      className="glass-panel rounded-xl p-3.5 opacity-50 flex items-center gap-3">
                      <span className="text-lg">{t.categoryEmoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-muted-foreground line-through truncate">{t.skillName}</div>
                        <div className="text-[9px] text-muted-foreground">{t.categoryLabel} · {durationLabel(t)}</div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: t.categoryColor }} />
                      <button onClick={() => removeTarget(t.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </>
              )}

              {/* Quick-add panel */}
              <div className="glass-panel rounded-2xl p-4 space-y-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Quick-add a skill target</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SKILLS.slice(0, 8).map((cat) => (
                    <button key={cat.id}
                      onClick={() => setOpenCats(p => ({ ...p, [cat.id]: true }))}
                      className="text-left px-2.5 py-2 rounded-xl text-[11px] font-medium hover:bg-white/10 transition-colors"
                      style={{ background: `${cat.color}10`, border: `1px solid ${cat.color}20`, color: cat.color }}
                      onClickCapture={() => setTab("tree")}>
                      {cat.emoji} {cat.label.split("&")[0].split("/")[0].split("—")[0].trim()}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground text-center pt-1">Go to Skill Tree → hover a skill → tap 🎯 to set target</p>
              </div>
            </motion.div>
          )}

          {/* ════ BEAST MODE TAB ════ */}
          {tab === "beast" && (
            <motion.div key="beast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="glass-panel rounded-2xl p-4 text-center"
                style={{ background: "linear-gradient(135deg, #ff000010, #ff8c0010, #ffd70010)", borderColor: "#ffd70030" }}>
                <div className="text-3xl mb-1">🔥</div>
                <div className="text-base font-black text-white">Your Beast Mode Stack</div>
                <div className="text-xs text-muted-foreground mt-0.5">The complete skill blueprint to build your future</div>
              </div>

              {BEAST_STACKS.map((stack, si) => {
                const stackDone = stack.skills.filter((sk) =>
                  SKILLS.some((cat) =>
                    cat.sections.some((sec) =>
                      sec.skills.some((s) => s === sk && ticked[skillKey(cat.id, sec.name, s)])
                    )
                  )
                ).length;

                return (
                  <motion.div key={stack.label}
                    initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08 }}
                    className="glass-panel rounded-2xl p-4"
                    style={{ borderColor: `${stack.color}30` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: `${stack.color}20` }}>{stack.emoji}</div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{stack.label}</div>
                        <div className="text-[10px] text-muted-foreground">{stackDone}/{stack.skills.length} skills</div>
                      </div>
                      <div className="text-sm font-black" style={{ color: stack.color }}>
                        {Math.round((stackDone / stack.skills.length) * 100)}%
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                      <motion.div className="h-full rounded-full"
                        initial={{ width: 0 }} animate={{ width: `${Math.round((stackDone / stack.skills.length) * 100)}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ background: `linear-gradient(90deg, ${stack.color}, ${stack.color}88)` }} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {stack.skills.map((sk) => {
                        const isDone = SKILLS.some((cat) =>
                          cat.sections.some((sec) =>
                            sec.skills.some((s) => s === sk && ticked[skillKey(cat.id, sec.name, s)])
                          )
                        );
                        return (
                          <div key={sk} className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                            style={isDone
                              ? { background: `${stack.color}20`, color: stack.color, border: `1px solid ${stack.color}40` }
                              : { background: "#ffffff08", color: "#64748b", border: "1px solid #ffffff10" }}>
                            {isDone && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {sk}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}

              {/* Motivation */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="glass-panel rounded-2xl p-5 text-center"
                style={{ borderColor: "#ffd70030", background: "linear-gradient(135deg, #ffd70008, transparent)" }}>
                <div className="text-2xl mb-2">🚀</div>
                <div className="text-sm font-black text-white">"Build the future. Become the system."</div>
                <div className="text-xs text-muted-foreground mt-1.5">
                  You have <span className="text-primary font-bold">{total - tickedCount}</span> skills left to unlock.
                  Every skill mastered is a level up.
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Target modal */}
      <AnimatePresence>
        {modal && (
          <TargetModal
            skill={{ key: modal.key, name: modal.name }}
            cat={modal.cat}
            onClose={() => setModal(null)}
            onAdd={addTarget}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
