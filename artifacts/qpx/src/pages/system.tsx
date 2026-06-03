import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Bell, BellOff, Timer, Mail, Clock,
  Calendar, Dumbbell, BookOpen, Coffee, Utensils, Zap, Save, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SCHEDULE_KEY = "qpx-schedule";
const POMO_KEY = "qpx-pomodoro-config";
const EMAIL_KEY = "qpx-email-config";

type ActivityType = "workout" | "study" | "meal" | "break" | "sleep" | "other";
interface ScheduleEntry {
  id: string;
  time: string;
  label: string;
  type: ActivityType;
  days: number[];
  notifyEnabled: boolean;
}
interface PomoConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
}
interface EmailConfig {
  address: string;
  enabled: boolean;
}

const TYPE_META: Record<ActivityType, { icon: React.ComponentType<{ className?: string }>, color: string, label: string }> = {
  workout:  { icon: Dumbbell,  color: "#ef4444", label: "Workout" },
  study:    { icon: BookOpen,  color: "#3b82f6", label: "Study" },
  meal:     { icon: Utensils,  color: "#f59e0b", label: "Meal" },
  break:    { icon: Coffee,    color: "#22c55e", label: "Break" },
  sleep:    { icon: Clock,     color: "#8b5cf6", label: "Sleep" },
  other:    { icon: Zap,       color: "#6b7280", label: "Other" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function defaultPomo(): PomoConfig { return { focus: 25, shortBreak: 5, longBreak: 15 }; }

function loadSchedule(): ScheduleEntry[] {
  try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || "[]"); } catch { return []; }
}
function saveSchedule(entries: ScheduleEntry[]) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(entries));
}
function loadPomo(): PomoConfig {
  try { return { ...defaultPomo(), ...JSON.parse(localStorage.getItem(POMO_KEY) || "{}") }; } catch { return defaultPomo(); }
}
function loadEmail(): EmailConfig {
  try { return JSON.parse(localStorage.getItem(EMAIL_KEY) || '{"address":"","enabled":false}'); } catch { return { address: "", enabled: false }; }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function scheduleNotificationsForToday(entries: ScheduleEntry[]) {
  const now = new Date();
  const todayDay = now.getDay();
  const todayEntries = entries.filter(e => e.notifyEnabled && e.days.includes(todayDay));
  todayEntries.forEach(entry => {
    const [h, m] = entry.time.split(":").map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    const ms = target.getTime() - now.getTime();
    if (ms > 0 && ms < 86400000) {
      setTimeout(() => {
        if (Notification.permission === "granted") {
          new Notification(`QPX Reminder: ${entry.label}`, {
            body: `Time for your ${TYPE_META[entry.type].label.toLowerCase()} session!`,
            icon: "/favicon.ico",
          });
        }
      }, ms);
    }
  });
}

export default function SystemTab() {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [pomo, setPomo] = useState<PomoConfig>(defaultPomo());
  const [email, setEmail] = useState<EmailConfig>({ address: "", enabled: false });
  const [notifGranted, setNotifGranted] = useState(false);
  const [pomoSaved, setPomoSaved] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<Omit<ScheduleEntry, "id">>({
    time: "07:00",
    label: "",
    type: "workout",
    days: [1, 2, 3, 4, 5],
    notifyEnabled: true,
  });

  useEffect(() => {
    setSchedule(loadSchedule());
    setPomo(loadPomo());
    setEmail(loadEmail());
    setNotifGranted(Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (notifGranted) scheduleNotificationsForToday(schedule);
  }, [schedule, notifGranted]);

  const handleAddEntry = useCallback(() => {
    if (!form.label.trim()) { toast({ title: "Enter an activity name", variant: "destructive" }); return; }
    if (form.days.length === 0) { toast({ title: "Select at least one day", variant: "destructive" }); return; }
    const entry: ScheduleEntry = { ...form, id: Date.now().toString() };
    const next = [...schedule, entry].sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(next);
    saveSchedule(next);
    setShowAddForm(false);
    setForm({ time: "07:00", label: "", type: "workout", days: [1, 2, 3, 4, 5], notifyEnabled: true });
    toast({ title: "Schedule entry added!" });
  }, [form, schedule]);

  const toggleNotify = useCallback((id: string) => {
    const next = schedule.map(e => e.id === id ? { ...e, notifyEnabled: !e.notifyEnabled } : e);
    setSchedule(next);
    saveSchedule(next);
  }, [schedule]);

  const deleteEntry = useCallback((id: string) => {
    const next = schedule.filter(e => e.id !== id);
    setSchedule(next);
    saveSchedule(next);
    toast({ title: "Entry removed" });
  }, [schedule]);

  const savePomo = useCallback(() => {
    localStorage.setItem(POMO_KEY, JSON.stringify(pomo));
    setPomoSaved(true);
    setTimeout(() => setPomoSaved(false), 2000);
    toast({ title: "Pomodoro settings saved!" });
  }, [pomo]);

  const saveEmail = useCallback(() => {
    localStorage.setItem(EMAIL_KEY, JSON.stringify(email));
    toast({ title: "Email settings saved!" });
  }, [email]);

  const enableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      scheduleNotificationsForToday(schedule);
      toast({ title: "Notifications enabled!", description: "Reminders will fire at scheduled times." });
    } else {
      toast({ title: "Notifications blocked", description: "Enable in browser settings.", variant: "destructive" });
    }
  }, [schedule]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black tracking-tight text-white">System Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your schedule, Pomodoro timer, and reminders</p>
      </motion.div>

      {/* ── Daily Schedule ─────────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl border border-border/40 overflow-hidden"
        style={{ background: "hsl(240 20% 8%)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm text-white">Daily Routine</h2>
          </div>
          <div className="flex items-center gap-2">
            {!notifGranted && (
              <button onClick={enableNotifications}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                <Bell className="w-3 h-3" /> Enable Alarms
              </button>
            )}
            {notifGranted && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Bell className="w-3 h-3" /> Alarms Active
              </span>
            )}
            <button onClick={() => setShowAddForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
              <Plus className="w-3 h-3" /> Add Entry
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="border-b border-border/40 overflow-hidden">
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Activity</label>
                    <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                      placeholder="e.g. Morning Workout"
                      className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Time</label>
                    <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                      className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/60" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(TYPE_META) as ActivityType[]).map(t => {
                      const { icon: Icon, color, label } = TYPE_META[t];
                      return (
                        <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                            form.type === t ? "border-transparent text-white" : "border-border/40 text-muted-foreground hover:border-border")}
                          style={form.type === t ? { background: color + "33", borderColor: color + "80", color } : {}}>
                          <Icon className="w-3 h-3" /> {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Repeat Days</label>
                  <div className="flex gap-2">
                    {DAYS.map((d, i) => (
                      <button key={d} onClick={() => setForm(f => ({
                        ...f, days: f.days.includes(i) ? f.days.filter(x => x !== i) : [...f.days, i]
                      }))}
                        className={cn("w-9 h-9 rounded-lg text-xs font-bold transition-colors border",
                          form.days.includes(i)
                            ? "bg-primary/20 border-primary/60 text-primary"
                            : "border-border/40 text-muted-foreground hover:border-border")}>
                        {d[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => setForm(f => ({ ...f, notifyEnabled: !f.notifyEnabled }))}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      form.notifyEnabled ? "bg-green-500/20 border-green-500/60 text-green-400" : "border-border/40 text-muted-foreground")}>
                    {form.notifyEnabled ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                    {form.notifyEnabled ? "Notify" : "No Notify"}
                  </button>
                  <button onClick={handleAddEntry}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-black hover:bg-primary/90 transition-colors">
                    Add to Schedule
                  </button>
                  <button onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divide-y divide-border/30">
          {schedule.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No schedule entries yet. Add your first routine!
            </div>
          )}
          <AnimatePresence>
            {schedule.map(entry => {
              const { icon: Icon, color, label: typeLabel } = TYPE_META[entry.type];
              const activeDays = entry.days.map(d => DAYS[d]).join(", ");
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: color + "22", border: `1px solid ${color}44` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{entry.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {entry.time} · {typeLabel} · {activeDays}
                    </div>
                  </div>
                  <button onClick={() => toggleNotify(entry.id)}
                    className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                      entry.notifyEnabled ? "text-green-400 bg-green-500/10" : "text-muted-foreground bg-muted/20")}>
                    {entry.notifyEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => deleteEntry(entry.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ── Pomodoro Settings ───────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border border-border/40 overflow-hidden"
        style={{ background: "hsl(240 20% 8%)" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
          <Timer className="w-4 h-4 text-red-400" />
          <h2 className="font-bold text-sm text-white">Pomodoro Timer Settings</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-6">
            {([
              { key: "focus", label: "Focus", color: "#ef4444", min: 5, max: 120 },
              { key: "shortBreak", label: "Short Break", color: "#22c55e", min: 1, max: 30 },
              { key: "longBreak", label: "Long Break", color: "#3b82f6", min: 5, max: 60 },
            ] as const).map(({ key, label, color, min, max }) => (
              <div key={key} className="flex flex-col items-center gap-3">
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
                  {label}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPomo(p => ({ ...p, [key]: Math.max(min, p[key] - 1) }))}
                    className="w-7 h-7 rounded-lg bg-muted/40 text-muted-foreground hover:text-white hover:bg-muted/70 transition-colors text-lg font-bold flex items-center justify-center">
                    −
                  </button>
                  <div className="w-16 h-12 rounded-xl flex flex-col items-center justify-center font-black text-xl text-white"
                    style={{ background: color + "22", border: `1px solid ${color}44` }}>
                    {pomo[key]}
                    <span className="text-[8px] font-normal text-muted-foreground tracking-wider">MIN</span>
                  </div>
                  <button onClick={() => setPomo(p => ({ ...p, [key]: Math.min(max, p[key] + 1) }))}
                    className="w-7 h-7 rounded-lg bg-muted/40 text-muted-foreground hover:text-white hover:bg-muted/70 transition-colors text-lg font-bold flex items-center justify-center">
                    +
                  </button>
                </div>
                <input type="range" min={min} max={max} value={pomo[key]}
                  onChange={e => setPomo(p => ({ ...p, [key]: Number(e.target.value) }))}
                  className="w-full accent-current" style={{ accentColor: color }} />
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-5">
            <button onClick={savePomo}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm bg-primary text-black hover:bg-primary/90 transition-colors">
              {pomoSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {pomoSaved ? "Saved!" : "Save Settings"}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 text-center">
            Changes apply to the Chapter 10 Pomodoro timer
          </p>
        </div>
      </motion.section>

      {/* ── Email Reminders ─────────────────────────────────── */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-xl border border-border/40 overflow-hidden"
        style={{ background: "hsl(240 20% 8%)" }}>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border/40">
          <Mail className="w-4 h-4 text-blue-400" />
          <h2 className="font-bold text-sm text-white">Email Reminders</h2>
          <span className="ml-auto text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium border border-yellow-500/30">
            Requires Setup
          </span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Reminder Email Address
            </label>
            <input value={email.address} onChange={e => setEmail(em => ({ ...em, address: e.target.value }))}
              placeholder="anuragkumar.pandit2000@gmail.com"
              className="w-full bg-muted/40 border border-border/40 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/60" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setEmail(em => ({ ...em, enabled: !em.enabled }))}
              className={cn("relative w-10 h-6 rounded-full transition-colors flex-shrink-0",
                email.enabled ? "bg-primary" : "bg-muted/60")}>
              <motion.div animate={{ x: email.enabled ? 18 : 2 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow" />
            </button>
            <span className="text-sm text-muted-foreground">Send email reminders for schedule entries</span>
          </div>
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-[11px] text-blue-300 space-y-1">
            <div className="font-semibold text-blue-200">To enable email reminders:</div>
            <div>1. Add a <span className="font-mono text-blue-100">RESEND_API_KEY</span> in the Replit Secrets panel</div>
            <div>2. Sign up free at <span className="font-mono text-blue-100">resend.com</span> to get your key</div>
            <div>3. Email will be sent from your schedule when the server-side job fires</div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveEmail}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              <Save className="w-4 h-4" /> Save Email Settings
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
