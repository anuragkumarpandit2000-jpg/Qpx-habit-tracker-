import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Play, Pause, RotateCcw, Timer, Calendar, X, SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_TICKS = "qpx-chapter10-ticks";
const STORAGE_DATES = "qpx-chapter10-dates";

// ─── Pomodoro config ────────────────────────────────────────────────
const POMO_MODES = {
  focus:       { label: "Focus",       minutes: 25, color: "#ef4444" },
  shortBreak:  { label: "Short Break", minutes: 5,  color: "#22c55e" },
  longBreak:   { label: "Long Break",  minutes: 15, color: "#3b82f6" },
} as const;
type PomoMode = keyof typeof POMO_MODES;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch { /* ignore */ }
}

// ─── Subject data ────────────────────────────────────────────────────
interface Section { name: string; chapters: string[] }
interface Subject  { emoji: string; label: string; color: string; sections: Section[] }

const SUBJECTS: Subject[] = [
  {
    emoji: "📘", label: "Science", color: "#3b82f6",
    sections: [
      { name: "Biology", chapters: ["Life Processes","Control and Coordination","How Do Organisms Reproduce?","Heredity and Evolution"] },
      { name: "Chemistry", chapters: ["Chemical Reactions and Equations","Acids, Bases and Salts","Metals and Non-Metals","Carbon and Its Compounds","Periodic Classification of Elements"] },
      { name: "Physics", chapters: ["Light – Reflection and Refraction","Human Eye and the Colourful World","Electricity","Magnetic Effects of Electric Current","Sources of Energy"] },
    ],
  },
  {
    emoji: "📗", label: "Mathematics", color: "#22c55e",
    sections: [
      { name: "Chapters", chapters: ["Real Numbers","Polynomials","Pair of Linear Equations in Two Variables","Quadratic Equations","Arithmetic Progressions","Triangles","Coordinate Geometry","Introduction to Trigonometry","Some Applications of Trigonometry","Circles","Areas Related to Circles","Surface Areas and Volumes","Statistics","Probability"] },
    ],
  },
  {
    emoji: "📙", label: "Social Science", color: "#f59e0b",
    sections: [
      { name: "History", chapters: ["The Rise of Nationalism in Europe","Nationalism in India","The Making of a Global World","The Age of Industrialisation","Print Culture and the Modern World"] },
      { name: "Geography", chapters: ["Resources and Development","Forest and Wildlife Resources","Water Resources","Agriculture","Minerals and Energy Resources","Manufacturing Industries","Lifelines of National Economy"] },
      { name: "Political Science (Civics)", chapters: ["Power Sharing","Federalism","Gender, Religion and Caste","Political Parties","Outcomes of Democracy"] },
      { name: "Economics", chapters: ["Development","Sectors of the Indian Economy","Money and Credit","Globalisation and the Indian Economy","Consumer Rights"] },
    ],
  },
  {
    emoji: "📕", label: "English – First Flight", color: "#ef4444",
    sections: [
      { name: "Prose", chapters: ["A Letter to God","Nelson Mandela: Long Walk to Freedom","Two Stories about Flying","From the Diary of Anne Frank","Glimpses of India","Mijbil the Otter","Madam Rides the Bus","The Sermon at Benares","The Proposal"] },
      { name: "Poems", chapters: ["Dust of Snow","Fire and Ice","A Tiger in the Zoo","How to Tell Wild Animals","The Ball Poem","Amanda!","Animals","The Trees","Fog","The Tale of Custard the Dragon","For Anne Gregory"] },
    ],
  },
  {
    emoji: "📒", label: "Hindi – क्षितिज (Kshitij 2)", color: "#a855f7",
    sections: [
      { name: "गद्य (Prose)", chapters: ["नेताजी का चश्मा","बालगोबिन भगत","लखनवी अंदाज़","मानवीय करुणा की दिव्य चमक","एक कहानी यह भी","स्त्री शिक्षा के विरोधी कुतर्कों का खंडन"] },
      { name: "पद्य (Poetry)", chapters: ["सूरदास के पद","राम-लक्ष्मण-परशुराम संवाद","उत्साह और अट नहीं रही","आत्मकथ्य","यह दंतुरित मुस्कान और फसल","संगतकार"] },
    ],
  },
  {
    emoji: "📓", label: "Hindi – कृतिका (Kritika 2)", color: "#ec4899",
    sections: [
      { name: "Chapters", chapters: ["माता का अँचल","जॉर्ज पंचम की नाक","साना-साना हाथ जोड़ि","एही ठैयाँ झुलनी हेरानी हो रामा","मैं क्यों लिखता हूँ"] },
    ],
  },
];

function chapterKey(subjectLabel: string, sectionName: string, chapter: string) {
  return `${subjectLabel}::${sectionName}::${chapter}`;
}
function totalCount() {
  return SUBJECTS.reduce((a, s) => a + s.sections.reduce((b, sec) => b + sec.chapters.length, 0), 0);
}

// ─── Date helpers ────────────────────────────────────────────────────
function dateStatus(dateStr: string): "overdue" | "soon" | "upcoming" | "far" {
  if (!dateStr) return "far";
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diff < 0)  return "overdue";
  if (diff <= 3) return "soon";
  if (diff <= 7) return "upcoming";
  return "far";
}
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
const DATE_COLORS = {
  overdue:  { bg: "#ef444420", text: "#ef4444", label: "Overdue" },
  soon:     { bg: "#f59e0b20", text: "#f59e0b", label: "" },
  upcoming: { bg: "#22c55e20", text: "#22c55e", label: "" },
  far:      { bg: "#ffffff10", text: "#94a3b8",  label: "" },
};

// ─── Pomodoro Component ──────────────────────────────────────────────
function PomodoroWidget() {
  const [mode, setMode]           = useState<PomoMode>("focus");
  const [secondsLeft, setLeft]    = useState(POMO_MODES.focus.minutes * 60);
  const [running, setRunning]     = useState(false);
  const [sessions, setSessions]   = useState(0);
  const [open, setOpen]           = useState(true);
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = POMO_MODES[mode].minutes * 60;
  const modeColor    = POMO_MODES[mode].color;
  const radius       = 36;
  const circumference= 2 * Math.PI * radius;
  const progress     = secondsLeft / totalSeconds;
  const dashOffset   = circumference * (1 - progress);

  const switchMode = useCallback((m: PomoMode) => {
    setMode(m);
    setLeft(POMO_MODES[m].minutes * 60);
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setLeft(POMO_MODES[mode].minutes * 60);
    setRunning(false);
  }, [mode]);

  const skip = useCallback(() => {
    if (mode === "focus") {
      const next = sessions + 1;
      setSessions(next);
      switchMode(next % 4 === 0 ? "longBreak" : "shortBreak");
    } else {
      switchMode("focus");
    }
  }, [mode, sessions, switchMode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            playBeep();
            skip();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running, skip]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="glass-panel rounded-2xl overflow-hidden"
      style={{ borderColor: `${modeColor}30` }}>

      {/* Header row */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-white/5 transition-colors">
        <Timer className="w-4 h-4" style={{ color: modeColor }} />
        <span className="text-sm font-bold text-white flex-1 text-left">Pomodoro Timer</span>
        <span className="text-[10px] font-mono font-bold" style={{ color: modeColor }}>{mm}:{ss}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold ml-1"
          style={{ background: `${modeColor}20`, color: modeColor }}>
          {POMO_MODES[mode].label}
        </span>
        {running && (
          <span className="w-1.5 h-1.5 rounded-full animate-pulse ml-1" style={{ background: modeColor }} />
        )}
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="border-t border-border/30 px-4 py-4">

              {/* Mode tabs */}
              <div className="flex gap-1 mb-4">
                {(Object.keys(POMO_MODES) as PomoMode[]).map((m) => (
                  <button key={m} onClick={() => switchMode(m)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                    style={mode === m
                      ? { background: `${POMO_MODES[m].color}25`, color: POMO_MODES[m].color, border: `1px solid ${POMO_MODES[m].color}40` }
                      : { color: "#64748b", border: "1px solid transparent" }}>
                    {POMO_MODES[m].label}
                  </button>
                ))}
              </div>

              {/* Ring timer */}
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0" style={{ width: 96, height: 96 }}>
                  <svg width="96" height="96" className="-rotate-90">
                    <circle cx="48" cy="48" r={radius} fill="none" stroke="#ffffff10" strokeWidth="5" />
                    <motion.circle
                      cx="48" cy="48" r={radius} fill="none"
                      stroke={modeColor} strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      animate={{ strokeDashoffset: dashOffset }}
                      transition={{ duration: 0.4 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-white font-mono leading-none">{mm}:{ss}</span>
                    <span className="text-[8px] text-muted-foreground mt-0.5">{POMO_MODES[mode].label}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRunning(r => !r)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs text-black transition-all active:scale-95"
                      style={{ background: `linear-gradient(90deg, ${modeColor}, ${modeColor}cc)` }}>
                      {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {running ? "Pause" : "Start"}
                    </button>
                    <button onClick={reset}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={skip}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground">
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Session count */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground">Sessions today:</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full"
                          style={{ background: i < sessions ? modeColor : "#ffffff15" }} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold ml-1" style={{ color: modeColor }}>{sessions}</span>
                  </div>

                  {/* Tip */}
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    {mode === "focus"
                      ? "Stay focused. Close distractions. One chapter at a time."
                      : mode === "shortBreak"
                      ? "Take a short walk. Drink water. Rest your eyes."
                      : "Great work! Take a longer rest before the next round."}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────
export default function Chapter10() {
  const [ticked, setTicked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_TICKS) || "{}"); } catch { return {}; }
  });
  const [dates, setDates] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_DATES) || "{}"); } catch { return {}; }
  });
  const [editingDate, setEditingDate] = useState<string | null>(null);

  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SUBJECTS.map((s) => [s.label, true]))
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of SUBJECTS) for (const sec of s.sections) init[`${s.label}::${sec.name}`] = true;
    return init;
  });

  useEffect(() => { localStorage.setItem(STORAGE_TICKS, JSON.stringify(ticked)); }, [ticked]);
  useEffect(() => { localStorage.setItem(STORAGE_DATES, JSON.stringify(dates)); }, [dates]);

  const tick = (key: string) => setTicked((p) => ({ ...p, [key]: !p[key] }));
  const setDate = (key: string, val: string) => {
    setDates((p) => val ? { ...p, [key]: val } : Object.fromEntries(Object.entries(p).filter(([k]) => k !== key)));
    setEditingDate(null);
  };

  const tickedCount = Object.values(ticked).filter(Boolean).length;
  const total       = totalCount();
  const percent     = Math.round((tickedCount / total) * 100);

  const subjectProgress = (s: Subject) => {
    let done = 0, tot = 0;
    for (const sec of s.sections) for (const ch of sec.chapters) {
      tot++;
      if (ticked[chapterKey(s.label, sec.name, ch)]) done++;
    }
    return { done, tot };
  };

  return (
    <div className="min-h-screen pb-24"
      style={{ background: "linear-gradient(180deg, hsl(240 20% 7%) 0%, hsl(240 20% 5%) 100%)" }}
      onClick={(e) => {
        if (editingDate && !(e.target as HTMLElement).closest("[data-date-picker]")) setEditingDate(null);
      }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ── Header card ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>🎓</div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Class 10 Chapters</h1>
              <p className="text-xs text-muted-foreground">CBSE · All Subjects</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-black text-white">{tickedCount}<span className="text-muted-foreground font-normal text-sm">/{total}</span></div>
              <div className="text-[10px] text-muted-foreground">{percent}% done</div>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SUBJECTS.map((s) => {
              const { done, tot } = subjectProgress(s);
              return (
                <div key={s.label} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}>
                  {s.emoji} {done}/{tot} ({Math.round((done/tot)*100)}%)
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Pomodoro ── */}
        <PomodoroWidget />

        {/* ── Subject cards ── */}
        {SUBJECTS.map((subject, si) => {
          const { done, tot } = subjectProgress(subject);
          const subOpen = openSubjects[subject.label];

          return (
            <motion.div key={subject.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}
              className="glass-panel rounded-2xl overflow-hidden"
              style={{ borderColor: `${subject.color}25` }}>

              {/* Subject header */}
              <button onClick={() => setOpenSubjects(p => ({ ...p, [subject.label]: !p[subject.label] }))}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                <span className="text-xl">{subject.emoji}</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-white">{subject.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{done}/{tot} chapters</div>
                </div>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((done/tot)*100)}%`, background: subject.color }} />
                </div>
                <div className="ml-1 text-[10px] font-bold w-8 text-right" style={{ color: subject.color }}>
                  {Math.round((done/tot)*100)}%
                </div>
                {subOpen
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground ml-1 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground ml-1 flex-shrink-0" />}
              </button>

              <AnimatePresence initial={false}>
                {subOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                    <div className="border-t border-border/30 divide-y divide-border/20">
                      {subject.sections.map((section) => {
                        const secKey  = `${subject.label}::${section.name}`;
                        const secOpen = openSections[secKey];
                        const secDone = section.chapters.filter(ch => ticked[chapterKey(subject.label, section.name, ch)]).length;
                        const isSingle = subject.sections.length === 1 && section.name === "Chapters";

                        return (
                          <div key={section.name}>
                            {!isSingle && (
                              <button onClick={() => setOpenSections(p => ({ ...p, [secKey]: !p[secKey] }))}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: subject.color }} />
                                <span className="text-xs font-semibold text-muted-foreground flex-1 text-left">{section.name}</span>
                                <span className="text-[10px]" style={{ color: subject.color }}>{secDone}/{section.chapters.length}</span>
                                {secOpen
                                  ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                              </button>
                            )}

                            <AnimatePresence initial={false}>
                              {(secOpen || isSingle) && (
                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}
                                  exit={{ height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                  {section.chapters.map((chapter, ci) => {
                                    const key    = chapterKey(subject.label, section.name, chapter);
                                    const done   = ticked[key];
                                    const dateVal = dates[key] || "";
                                    const status = dateVal ? dateStatus(dateVal) : null;
                                    const dc     = status ? DATE_COLORS[status] : null;
                                    const isEditingThis = editingDate === key;

                                    return (
                                      <motion.div key={chapter}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.02 }}
                                        className={cn("flex flex-col border-b border-border/10 last:border-0", done ? "opacity-55" : "")}>

                                        {/* Main chapter row */}
                                        <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors group">
                                          {/* Tick button */}
                                          <button onClick={() => tick(key)} className="flex-shrink-0">
                                            <motion.div whileTap={{ scale: 0.85 }}>
                                              {done
                                                ? <CheckCircle2 className="w-4 h-4" style={{ color: subject.color }} />
                                                : <Circle className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />}
                                            </motion.div>
                                          </button>

                                          {/* Chapter name */}
                                          <span className={cn("text-sm leading-snug flex-1",
                                            done ? "line-through text-muted-foreground" : "text-foreground")}>
                                            {chapter}
                                          </span>

                                          {/* Date badge + calendar trigger */}
                                          <div className="flex items-center gap-1.5 flex-shrink-0" data-date-picker>
                                            {dateVal && dc && !isEditingThis && (
                                              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                                                className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                                                style={{ background: dc.bg, color: dc.text }}>
                                                {status === "overdue" && <span>!</span>}
                                                {formatDate(dateVal)}
                                                <button onClick={(e) => { e.stopPropagation(); setDate(key, ""); }}
                                                  className="ml-0.5 hover:opacity-70">
                                                  <X className="w-2.5 h-2.5" />
                                                </button>
                                              </motion.div>
                                            )}
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setEditingDate(isEditingThis ? null : key); }}
                                              className={cn(
                                                "p-1 rounded transition-all",
                                                isEditingThis
                                                  ? "text-white bg-white/10"
                                                  : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5"
                                              )}
                                              data-date-picker>
                                              <Calendar className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Inline date picker */}
                                        <AnimatePresence>
                                          {isEditingThis && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: "auto", opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.18 }}
                                              className="overflow-hidden"
                                              data-date-picker>
                                              <div className="flex items-center gap-2 px-4 pb-2.5 pt-0.5" data-date-picker>
                                                <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: subject.color }} />
                                                <span className="text-[11px] text-muted-foreground">Target date:</span>
                                                <input
                                                  type="date"
                                                  defaultValue={dateVal}
                                                  autoFocus
                                                  data-date-picker
                                                  min={new Date().toISOString().slice(0, 10)}
                                                  onChange={(e) => setDate(key, e.target.value)}
                                                  className="flex-1 text-xs bg-white/10 border border-border/40 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-primary/60"
                                                  style={{ colorScheme: "dark" }}
                                                />
                                                {dateVal && (
                                                  <button onClick={() => setDate(key, "")}
                                                    className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors px-1.5 py-0.5 rounded bg-white/5">
                                                    Clear
                                                  </button>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
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

        {/* ── All done ── */}
        <AnimatePresence>
          {tickedCount === total && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="glass-panel rounded-2xl p-5 text-center"
              style={{ borderColor: "#ffd70050", background: "linear-gradient(135deg, #ffd70010, #ff8c0010)" }}>
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-base font-black text-white">All Chapters Completed!</div>
              <div className="text-xs text-muted-foreground mt-1">You're fully prepared for Class 10 boards!</div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
