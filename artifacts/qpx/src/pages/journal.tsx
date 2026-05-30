import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  getGetJournalEntriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, X, Trash2, Edit3, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const MOODS = [
  { value: "excellent", label: "Excellent", color: "#2ecc71", emoji: "A" },
  { value: "good", label: "Good", color: "#3498db", emoji: "B" },
  { value: "neutral", label: "Neutral", color: "#95a5a6", emoji: "C" },
  { value: "low", label: "Low", color: "#e67e22", emoji: "D" },
  { value: "terrible", label: "Terrible", color: "#e74c3c", emoji: "E" },
];

const MOOD_COLORS: Record<string, string> = {
  excellent: "#2ecc71",
  good: "#3498db",
  neutral: "#95a5a6",
  low: "#e67e22",
  terrible: "#e74c3c",
};

function EntryForm({ onClose, initial }: { onClose: () => void; initial?: any }) {
  const queryClient = useQueryClient();
  const createEntry = useCreateJournalEntry();
  const updateEntry = useUpdateJournalEntry();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    wins: initial?.wins ?? "",
    lessons: initial?.lessons ?? "",
    goals: initial?.goals ?? "",
    mood: initial?.mood ?? "neutral",
    energyLevel: initial?.energyLevel ?? 7,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initial?.id) {
      await updateEntry.mutateAsync({ id: initial.id, data: form });
    } else {
      await createEntry.mutateAsync({ data: form });
    }
    queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass-panel rounded-2xl p-5 mb-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white">{initial ? "Edit Entry" : "New Journal Entry"}</h3>
        <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Entry title..."
          className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground"
          required
        />
        <Textarea
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder="What's on your mind today?"
          className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-28"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <Textarea
            value={form.wins}
            onChange={(e) => setForm({ ...form, wins: e.target.value })}
            placeholder="Today's wins..."
            className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-16 text-xs"
          />
          <Textarea
            value={form.lessons}
            onChange={(e) => setForm({ ...form, lessons: e.target.value })}
            placeholder="Lessons learned..."
            className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-16 text-xs"
          />
        </div>
        <Textarea
          value={form.goals}
          onChange={(e) => setForm({ ...form, goals: e.target.value })}
          placeholder="Goals for tomorrow..."
          className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-16 text-xs"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Mood</label>
            <Select value={form.mood} onValueChange={(v) => setForm({ ...form, mood: v })}>
              <SelectTrigger className="bg-card/50 border-border/50 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <span style={{ color: m.color }}>{m.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Energy: {form.energyLevel}/10</label>
            <Slider
              value={[form.energyLevel]}
              onValueChange={([v]) => setForm({ ...form, energyLevel: v })}
              min={1} max={10} step={1}
              className="mt-2"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={createEntry.isPending || updateEntry.isPending}
          className="w-full text-black font-bold"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
        >
          {createEntry.isPending || updateEntry.isPending ? "Saving..." : initial ? "Update Entry" : "Save Entry"}
        </Button>
      </form>
    </motion.div>
  );
}

export default function Journal() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: entries = [] } = useGetJournalEntries();
  const deleteEntry = useDeleteJournalEntry();

  const handleDelete = async (id: number) => {
    await deleteEntry.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetJournalEntriesQueryKey() });
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6" style={{ color: "hsl(var(--secondary))" }} />
          Journal
        </h1>
        <Button
          onClick={() => { setEditEntry(null); setShowForm(!showForm); }}
          size="sm"
          className="text-black font-bold"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Entry
        </Button>
      </div>

      <AnimatePresence>
        {(showForm || editEntry) && (
          <EntryForm
            onClose={() => { setShowForm(false); setEditEntry(null); }}
            initial={editEntry}
          />
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {entries.map((entry, i) => {
          const moodColor = MOOD_COLORS[entry.mood] ?? "#95a5a6";
          const isExpanded = expandedId === entry.id;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel rounded-xl overflow-hidden"
            >
              <div
                className="p-4 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                {/* Mood indicator */}
                <div
                  className="w-2 self-stretch rounded-full flex-shrink-0"
                  style={{ background: moodColor }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white text-sm truncate">{entry.title}</h3>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: moodColor, background: `${moodColor}20` }}>
                        {entry.mood}
                      </span>
                      <span className="text-[10px] text-muted-foreground">E:{entry.energyLevel}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
                </div>
                <ChevronDown
                  className={cn("w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform", isExpanded && "rotate-180")}
                />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-border/30 pt-3 ml-5">
                      <p className="text-sm text-foreground/80">{entry.content}</p>
                      {entry.wins && (
                        <div>
                          <div className="text-[10px] font-bold text-green-400 mb-0.5">WINS</div>
                          <p className="text-xs text-muted-foreground">{entry.wins}</p>
                        </div>
                      )}
                      {entry.lessons && (
                        <div>
                          <div className="text-[10px] font-bold text-blue-400 mb-0.5">LESSONS</div>
                          <p className="text-xs text-muted-foreground">{entry.lessons}</p>
                        </div>
                      )}
                      {entry.goals && (
                        <div>
                          <div className="text-[10px] font-bold text-yellow-400 mb-0.5">GOALS</div>
                          <p className="text-xs text-muted-foreground">{entry.goals}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border/50 text-xs"
                          onClick={(e) => { e.stopPropagation(); setEditEntry(entry); setShowForm(false); }}
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/50 text-destructive text-xs"
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {entries.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Your journal is empty. Write your first entry!</p>
          </div>
        )}
      </div>
    </div>
  );
}
