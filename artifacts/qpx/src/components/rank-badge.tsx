import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const RANKS = [
  "Recruit", "Cadet", "Trainee", "Warrior", "Elite Warrior",
  "Champion", "Legend", "Master", "Grandmaster", "Titan"
];

const RANK_COLORS = [
  { from: "#cd7f32", to: "#a0522d", glow: "#cd7f3260" }, // Recruit - Bronze
  { from: "#8a9ba8", to: "#607b8c", glow: "#8a9ba860" }, // Cadet - Steel
  { from: "#c0c0c0", to: "#909090", glow: "#c0c0c060" }, // Trainee - Silver
  { from: "#ffd700", to: "#b8860b", glow: "#ffd70060" }, // Warrior - Gold
  { from: "#e5e4e2", to: "#c0c0c0", glow: "#e5e4e260" }, // Elite Warrior - Platinum
  { from: "#878681", to: "#545350", glow: "#87868160" }, // Champion - Titanium
  { from: "#a8d8ea", to: "#5bb4d4", glow: "#a8d8ea80" }, // Legend - Crystal
  { from: "#00ffff", to: "#0088cc", glow: "#00ffff80" }, // Master - Energy Core
  { from: "#bf00ff", to: "#7a00cc", glow: "#bf00ff80" }, // Grandmaster - Energy Core 2
  { from: "#ffffff", to: "#aaaaff", glow: "#ffffff80" }, // Titan - Pure Light
];

interface RankBadgeProps {
  rankIndex: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}

export function RankBadge({ rankIndex, size = "md", showLabel = false, className }: RankBadgeProps) {
  const idx = Math.max(0, Math.min(9, rankIndex));
  const colors = RANK_COLORS[idx];
  const rank = RANKS[idx];

  const sizeMap = {
    sm: { outer: "w-8 h-8", inner: "w-6 h-6", text: "text-[8px]" },
    md: { outer: "w-12 h-12", inner: "w-10 h-10", text: "text-[10px]" },
    lg: { outer: "w-16 h-16", inner: "w-14 h-14", text: "text-xs" },
    xl: { outer: "w-24 h-24", inner: "w-20 h-20", text: "text-sm" },
  };
  const s = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        className={cn("relative flex items-center justify-center rounded-full", s.outer)}
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          boxShadow: `0 0 20px ${colors.glow}, inset 0 1px 1px rgba(255,255,255,0.3)`,
        }}
      >
        <div
          className={cn("rounded-full flex items-center justify-center font-black text-white", s.inner)}
          style={{
            background: `linear-gradient(135deg, ${colors.from}aa, ${colors.to}aa)`,
            backdropFilter: "blur(4px)",
          }}
        >
          <span className={cn("font-black tracking-tight", s.text)}>
            {idx < 9 ? (idx + 1) : "X"}
          </span>
        </div>
      </motion.div>
      {showLabel && (
        <div className="text-[10px] font-semibold text-center" style={{ color: colors.from }}>
          {rank}
        </div>
      )}
    </div>
  );
}

export { RANKS, RANK_COLORS };
