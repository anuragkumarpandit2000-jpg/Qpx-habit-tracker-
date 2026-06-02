import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useGetPlayerProfile, useCompleteOnboarding } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetPlayerProfileQueryKey } from "@workspace/api-client-react";
import { Zap, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

const PRIORITY_OPTIONS = ["Fitness", "Career", "Finances", "Relationships", "Learning", "Health", "Creativity", "Discipline", "Mindfulness", "Business"];
const HABIT_OPTIONS = ["Workout Daily", "Morning Routine", "Read 30min", "Study", "Meditate", "Journal", "No Junk Food", "Cold Shower", "Sleep 8hrs", "Coding"];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { data: player, isLoading } = useGetPlayerProfile();
  const queryClient = useQueryClient();
  const completeOnboarding = useCompleteOnboarding();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    username: "",
    age: 25,
    height: "",
    weight: "",
    primaryGoal: "",
    topPriorities: [] as string[],
    skillsToLearn: [] as string[],
    dailyHours: 2,
    biggestWeakness: "",
    habitsToBuild: [] as string[],
    desiredIdentity: "",
  });

  useEffect(() => {
    if (!isLoading && player?.onboardingComplete) {
      navigate("/dashboard");
    }
  }, [isLoading, player?.onboardingComplete]);

  if (!isLoading && player?.onboardingComplete) {
    return null;
  }

  const STEPS = [
    {
      title: "What's your username?",
      subtitle: "This is your player name in QPX",
      field: (
        <Input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Enter username..."
          className="text-lg h-12 bg-card/50 border-border/50 text-center text-white placeholder:text-muted-foreground"
          autoFocus
        />
      ),
      valid: form.username.length >= 2,
    },
    {
      title: "How old are you?",
      subtitle: "Your age helps personalize your progression plan",
      field: (
        <div className="space-y-4">
          <div className="text-5xl font-black text-center" style={{ color: "hsl(var(--primary))" }}>{form.age}</div>
          <Slider
            value={[form.age]}
            onValueChange={([v]) => setForm({ ...form, age: v })}
            min={13} max={80} step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>13</span><span>80</span>
          </div>
        </div>
      ),
      valid: true,
    },
    {
      title: "Current height?",
      subtitle: "e.g. 5'10\" or 178cm",
      field: (
        <Input
          value={form.height}
          onChange={(e) => setForm({ ...form, height: e.target.value })}
          placeholder={'e.g. 5\'10" or 178cm'}
          className="text-lg h-12 bg-card/50 border-border/50 text-center text-white placeholder:text-muted-foreground"
        />
      ),
      valid: form.height.length > 0,
    },
    {
      title: "Current weight?",
      subtitle: "e.g. 175lbs or 80kg",
      field: (
        <Input
          value={form.weight}
          onChange={(e) => setForm({ ...form, weight: e.target.value })}
          placeholder="e.g. 175lbs or 80kg"
          className="text-lg h-12 bg-card/50 border-border/50 text-center text-white placeholder:text-muted-foreground"
        />
      ),
      valid: form.weight.length > 0,
    },
    {
      title: "What is your primary goal?",
      subtitle: "The one thing you want most from this journey",
      field: (
        <Textarea
          value={form.primaryGoal}
          onChange={(e) => setForm({ ...form, primaryGoal: e.target.value })}
          placeholder="e.g. Build muscle and get fit, start my business, master programming..."
          className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-24"
        />
      ),
      valid: form.primaryGoal.length > 5,
    },
    {
      title: "Your top 3 priorities",
      subtitle: "Select what matters most to you right now",
      field: (
        <div className="grid grid-cols-2 gap-2">
          {PRIORITY_OPTIONS.map((p) => {
            const selected = form.topPriorities.includes(p);
            return (
              <button
                key={p}
                onClick={() => {
                  if (selected) {
                    setForm({ ...form, topPriorities: form.topPriorities.filter((x) => x !== p) });
                  } else if (form.topPriorities.length < 3) {
                    setForm({ ...form, topPriorities: [...form.topPriorities, p] });
                  }
                }}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  selected
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      ),
      valid: form.topPriorities.length >= 1,
    },
    {
      title: "Skills you want to learn",
      subtitle: "What do you want to master? (type & press Enter)",
      field: (
        <div className="space-y-3">
          <Input
            placeholder="e.g. Python, Guitar, Spanish..."
            className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                const val = e.currentTarget.value.trim();
                if (!form.skillsToLearn.includes(val)) {
                  setForm({ ...form, skillsToLearn: [...form.skillsToLearn, val] });
                }
                e.currentTarget.value = "";
              }
            }}
          />
          <div className="flex flex-wrap gap-2">
            {form.skillsToLearn.map((s) => (
              <button
                key={s}
                onClick={() => setForm({ ...form, skillsToLearn: form.skillsToLearn.filter((x) => x !== s) })}
                className="px-3 py-1 rounded-full text-xs font-medium border border-primary/50 text-primary bg-primary/10"
              >
                {s} ×
              </button>
            ))}
          </div>
        </div>
      ),
      valid: form.skillsToLearn.length > 0,
    },
    {
      title: "Daily hours available",
      subtitle: "How much time can you commit to self-development?",
      field: (
        <div className="space-y-4">
          <div className="text-5xl font-black text-center" style={{ color: "hsl(var(--primary))" }}>{form.dailyHours}h</div>
          <Slider
            value={[form.dailyHours]}
            onValueChange={([v]) => setForm({ ...form, dailyHours: v })}
            min={0.5} max={12} step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0.5h</span><span>12h</span>
          </div>
        </div>
      ),
      valid: true,
    },
    {
      title: "Your biggest weakness?",
      subtitle: "Honest self-awareness is the first step to power",
      field: (
        <Textarea
          value={form.biggestWeakness}
          onChange={(e) => setForm({ ...form, biggestWeakness: e.target.value })}
          placeholder="e.g. Procrastination, lack of consistency, distractions..."
          className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-24"
        />
      ),
      valid: form.biggestWeakness.length > 3,
    },
    {
      title: "Habits you want to build",
      subtitle: "Select the daily habits for your quest list",
      field: (
        <div className="grid grid-cols-2 gap-2">
          {HABIT_OPTIONS.map((h) => {
            const selected = form.habitsToBuild.includes(h);
            return (
              <button
                key={h}
                onClick={() => {
                  if (selected) {
                    setForm({ ...form, habitsToBuild: form.habitsToBuild.filter((x) => x !== h) });
                  } else {
                    setForm({ ...form, habitsToBuild: [...form.habitsToBuild, h] });
                  }
                }}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                  selected
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border/50 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
      ),
      valid: form.habitsToBuild.length >= 1,
    },
    {
      title: "Who do you want to become?",
      subtitle: "Describe your ideal self in 1 year",
      field: (
        <Textarea
          value={form.desiredIdentity}
          onChange={(e) => setForm({ ...form, desiredIdentity: e.target.value })}
          placeholder="In 1 year, I am someone who..."
          className="bg-card/50 border-border/50 text-white placeholder:text-muted-foreground resize-none h-28"
        />
      ),
      valid: form.desiredIdentity.length > 10,
    },
  ];

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = async () => {
    if (isLast) {
      try {
        await completeOnboarding.mutateAsync({
          data: {
            username: form.username,
            age: form.age,
            height: form.height,
            weight: form.weight,
            primaryGoal: form.primaryGoal,
            topPriorities: form.topPriorities,
            skillsToLearn: form.skillsToLearn,
            dailyHours: form.dailyHours,
            biggestWeakness: form.biggestWeakness,
            habitsToBuild: form.habitsToBuild,
            desiredIdentity: form.desiredIdentity,
          },
        });
        queryClient.invalidateQueries({ queryKey: getGetPlayerProfileQueryKey() });
        navigate("/dashboard");
      } catch (err) {
        console.error("Onboarding failed:", err);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.15) 0%, hsl(240 20% 5%) 70%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
            >
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div className="text-3xl font-black tracking-widest text-white">QPX</div>
          </div>
          <div className="text-xs tracking-widest text-muted-foreground uppercase">Quantum Progress Experience</div>
        </motion.div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step + 1} of {STEPS.length}</span>
            <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="glass-panel rounded-2xl p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-white mb-1">{currentStep.title}</h2>
            <p className="text-sm text-muted-foreground mb-5">{currentStep.subtitle}</p>
            {currentStep.field}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="border-border/50 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <Button
            disabled={!currentStep.valid || completeOnboarding.isPending}
            onClick={handleNext}
            className="flex-1 h-11 font-bold text-black"
            style={{ background: currentStep.valid ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" : undefined }}
          >
            {completeOnboarding.isPending
              ? "Creating your character..."
              : isLast
              ? "Begin My Journey"
              : "Continue"}
            {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
