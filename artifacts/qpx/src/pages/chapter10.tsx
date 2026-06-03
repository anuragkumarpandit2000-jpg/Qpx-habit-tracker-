import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "qpx-chapter10-ticks";

interface Section {
  name: string;
  chapters: string[];
}

interface Subject {
  emoji: string;
  label: string;
  color: string;
  glow: string;
  sections: Section[];
}

const SUBJECTS: Subject[] = [
  {
    emoji: "📘",
    label: "Science",
    color: "#3b82f6",
    glow: "#3b82f640",
    sections: [
      {
        name: "Biology",
        chapters: [
          "Life Processes",
          "Control and Coordination",
          "How Do Organisms Reproduce?",
          "Heredity and Evolution",
        ],
      },
      {
        name: "Chemistry",
        chapters: [
          "Chemical Reactions and Equations",
          "Acids, Bases and Salts",
          "Metals and Non-Metals",
          "Carbon and Its Compounds",
          "Periodic Classification of Elements",
        ],
      },
      {
        name: "Physics",
        chapters: [
          "Light – Reflection and Refraction",
          "Human Eye and the Colourful World",
          "Electricity",
          "Magnetic Effects of Electric Current",
          "Sources of Energy",
        ],
      },
    ],
  },
  {
    emoji: "📗",
    label: "Mathematics",
    color: "#22c55e",
    glow: "#22c55e40",
    sections: [
      {
        name: "Chapters",
        chapters: [
          "Real Numbers",
          "Polynomials",
          "Pair of Linear Equations in Two Variables",
          "Quadratic Equations",
          "Arithmetic Progressions",
          "Triangles",
          "Coordinate Geometry",
          "Introduction to Trigonometry",
          "Some Applications of Trigonometry",
          "Circles",
          "Areas Related to Circles",
          "Surface Areas and Volumes",
          "Statistics",
          "Probability",
        ],
      },
    ],
  },
  {
    emoji: "📙",
    label: "Social Science",
    color: "#f59e0b",
    glow: "#f59e0b40",
    sections: [
      {
        name: "History",
        chapters: [
          "The Rise of Nationalism in Europe",
          "Nationalism in India",
          "The Making of a Global World",
          "The Age of Industrialisation",
          "Print Culture and the Modern World",
        ],
      },
      {
        name: "Geography",
        chapters: [
          "Resources and Development",
          "Forest and Wildlife Resources",
          "Water Resources",
          "Agriculture",
          "Minerals and Energy Resources",
          "Manufacturing Industries",
          "Lifelines of National Economy",
        ],
      },
      {
        name: "Political Science (Civics)",
        chapters: [
          "Power Sharing",
          "Federalism",
          "Gender, Religion and Caste",
          "Political Parties",
          "Outcomes of Democracy",
        ],
      },
      {
        name: "Economics",
        chapters: [
          "Development",
          "Sectors of the Indian Economy",
          "Money and Credit",
          "Globalisation and the Indian Economy",
          "Consumer Rights",
        ],
      },
    ],
  },
  {
    emoji: "📕",
    label: "English – First Flight",
    color: "#ef4444",
    glow: "#ef444440",
    sections: [
      {
        name: "Prose",
        chapters: [
          "A Letter to God",
          "Nelson Mandela: Long Walk to Freedom",
          "Two Stories about Flying",
          "From the Diary of Anne Frank",
          "Glimpses of India",
          "Mijbil the Otter",
          "Madam Rides the Bus",
          "The Sermon at Benares",
          "The Proposal",
        ],
      },
      {
        name: "Poems",
        chapters: [
          "Dust of Snow",
          "Fire and Ice",
          "A Tiger in the Zoo",
          "How to Tell Wild Animals",
          "The Ball Poem",
          "Amanda!",
          "Animals",
          "The Trees",
          "Fog",
          "The Tale of Custard the Dragon",
          "For Anne Gregory",
        ],
      },
    ],
  },
  {
    emoji: "📒",
    label: "Hindi – क्षितिज (Kshitij 2)",
    color: "#a855f7",
    glow: "#a855f740",
    sections: [
      {
        name: "गद्य (Prose)",
        chapters: [
          "नेताजी का चश्मा",
          "बालगोबिन भगत",
          "लखनवी अंदाज़",
          "मानवीय करुणा की दिव्य चमक",
          "एक कहानी यह भी",
          "स्त्री शिक्षा के विरोधी कुतर्कों का खंडन",
        ],
      },
      {
        name: "पद्य (Poetry)",
        chapters: [
          "सूरदास के पद",
          "राम-लक्ष्मण-परशुराम संवाद",
          "उत्साह और अट नहीं रही",
          "आत्मकथ्य",
          "यह दंतुरित मुस्कान और फसल",
          "संगतकार",
        ],
      },
    ],
  },
  {
    emoji: "📓",
    label: "Hindi – कृतिका (Kritika 2)",
    color: "#ec4899",
    glow: "#ec489940",
    sections: [
      {
        name: "Chapters",
        chapters: [
          "माता का अँचल",
          "जॉर्ज पंचम की नाक",
          "साना-साना हाथ जोड़ि",
          "एही ठैयाँ झुलनी हेरानी हो रामा",
          "मैं क्यों लिखता हूँ",
        ],
      },
    ],
  },
];

function chapterKey(subjectLabel: string, sectionName: string, chapter: string) {
  return `${subjectLabel}::${sectionName}::${chapter}`;
}

function allChapterKeys(): string[] {
  const keys: string[] = [];
  for (const s of SUBJECTS) {
    for (const sec of s.sections) {
      for (const ch of sec.chapters) {
        keys.push(chapterKey(s.label, sec.name, ch));
      }
    }
  }
  return keys;
}

function totalCount() {
  return SUBJECTS.reduce((a, s) => a + s.sections.reduce((b, sec) => b + sec.chapters.length, 0), 0);
}

export default function Chapter10() {
  const [ticked, setTicked] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SUBJECTS.map((s) => [s.label, true]))
  );

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of SUBJECTS) {
      for (const sec of s.sections) {
        init[`${s.label}::${sec.name}`] = true;
      }
    }
    return init;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ticked));
  }, [ticked]);

  const tick = (key: string) => setTicked((prev) => ({ ...prev, [key]: !prev[key] }));

  const tickedCount = Object.values(ticked).filter(Boolean).length;
  const total = totalCount();
  const percent = Math.round((tickedCount / total) * 100);

  const toggleSubject = (label: string) =>
    setOpenSubjects((prev) => ({ ...prev, [label]: !prev[label] }));

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const subjectProgress = (subject: Subject) => {
    let done = 0;
    let tot = 0;
    for (const sec of subject.sections) {
      for (const ch of sec.chapters) {
        tot++;
        if (ticked[chapterKey(subject.label, sec.name, ch)]) done++;
      }
    }
    return { done, tot };
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, hsl(240 20% 7%) 0%, hsl(240 20% 5%) 100%)" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
              🎓
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Class 10 Chapters</h1>
              <p className="text-xs text-muted-foreground">CBSE · All Subjects</p>
            </div>
            <div className="ml-auto text-right">
              <div className="text-lg font-black text-white">{tickedCount}<span className="text-muted-foreground font-normal text-sm">/{total}</span></div>
              <div className="text-[10px] text-muted-foreground">{percent}% done</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>

          {/* Per-subject pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {SUBJECTS.map((s) => {
              const { done, tot } = subjectProgress(s);
              const p = Math.round((done / tot) * 100);
              return (
                <div key={s.label} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}>
                  <span>{s.emoji}</span>
                  <span>{done}/{tot}</span>
                  <span className="opacity-60">({p}%)</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Subjects */}
        {SUBJECTS.map((subject, si) => {
          const { done, tot } = subjectProgress(subject);
          const subOpen = openSubjects[subject.label];

          return (
            <motion.div
              key={subject.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
              className="glass-panel rounded-2xl overflow-hidden"
              style={{ borderColor: `${subject.color}25` }}
            >
              {/* Subject header */}
              <button
                onClick={() => toggleSubject(subject.label)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors"
              >
                <div className="text-xl">{subject.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-white">{subject.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{done}/{tot} chapters</div>
                </div>
                {/* Mini progress bar */}
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((done / tot) * 100)}%`, background: subject.color }}
                  />
                </div>
                <div className="ml-1 text-[10px] font-bold w-8 text-right" style={{ color: subject.color }}>
                  {Math.round((done / tot) * 100)}%
                </div>
                {subOpen
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground ml-1 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground ml-1 flex-shrink-0" />}
              </button>

              <AnimatePresence initial={false}>
                {subOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/30 divide-y divide-border/20">
                      {subject.sections.map((section) => {
                        const secKey = `${subject.label}::${section.name}`;
                        const secOpen = openSections[secKey];
                        const secDone = section.chapters.filter(
                          (ch) => ticked[chapterKey(subject.label, section.name, ch)]
                        ).length;

                        return (
                          <div key={section.name}>
                            {/* Section header — only show if not a single unnamed "Chapters" section */}
                            {!(subject.sections.length === 1 && section.name === "Chapters") && (
                              <button
                                onClick={() => toggleSection(secKey)}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors"
                              >
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: subject.color }} />
                                <span className="text-xs font-semibold text-muted-foreground flex-1 text-left">
                                  {section.name}
                                </span>
                                <span className="text-[10px]" style={{ color: subject.color }}>
                                  {secDone}/{section.chapters.length}
                                </span>
                                {secOpen
                                  ? <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                  : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                              </button>
                            )}

                            <AnimatePresence initial={false}>
                              {(secOpen || (subject.sections.length === 1 && section.name === "Chapters")) && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: "auto" }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {section.chapters.map((chapter, ci) => {
                                    const key = chapterKey(subject.label, section.name, chapter);
                                    const done = ticked[key];
                                    return (
                                      <motion.button
                                        key={chapter}
                                        onClick={() => tick(key)}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ci * 0.02 }}
                                        className={cn(
                                          "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/5",
                                          done ? "opacity-60" : ""
                                        )}
                                      >
                                        <div className="flex-shrink-0">
                                          {done ? (
                                            <CheckCircle2
                                              className="w-4 h-4"
                                              style={{ color: subject.color }}
                                            />
                                          ) : (
                                            <Circle className="w-4 h-4 text-muted-foreground/50" />
                                          )}
                                        </div>
                                        <span
                                          className={cn(
                                            "text-sm leading-snug",
                                            done ? "line-through text-muted-foreground" : "text-foreground"
                                          )}
                                        >
                                          {chapter}
                                        </span>
                                        {done && (
                                          <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                                            style={{ background: `${subject.color}20`, color: subject.color }}
                                          >
                                            ✓
                                          </motion.span>
                                        )}
                                      </motion.button>
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

        {/* All done banner */}
        <AnimatePresence>
          {tickedCount === total && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel rounded-2xl p-5 text-center"
              style={{ borderColor: "#ffd70050", background: "linear-gradient(135deg, #ffd70010, #ff8c0010)" }}
            >
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
