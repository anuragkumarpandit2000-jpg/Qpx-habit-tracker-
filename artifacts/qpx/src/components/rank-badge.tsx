import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { RANKS, RANK_COLORS } from "@/lib/rank-constants";

const BADGE_SHAPES = [
  "circle(48%)",
  "polygon(50% 0%, 100% 22%, 100% 65%, 50% 100%, 0% 65%, 0% 22%)",
  "polygon(50% 0%, 88% 10%, 100% 28%, 100% 66%, 50% 100%, 0% 66%, 0% 28%, 12% 10%)",
  "polygon(50% 0%, 100% 18%, 100% 70%, 50% 100%, 0% 70%, 0% 18%)",
  "polygon(50% 0%, 100% 32%, 78% 92%, 50% 100%, 22% 92%, 0% 32%)",
  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
  "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)",
  "polygon(50% 0%, 62.5% 28.3%, 93.3% 25%, 75% 50%, 93.3% 75%, 62.5% 71.7%, 50% 100%, 37.5% 71.7%, 6.7% 75%, 25% 50%, 6.7% 25%, 37.5% 28.3%)",
  "polygon(50% 0%, 59% 27%, 85% 15%, 73% 41%, 100% 50%, 73% 59%, 85% 85%, 59% 73%, 50% 100%, 41% 73%, 15% 85%, 27% 59%, 0% 50%, 27% 41%, 15% 15%, 41% 27%)",
  "polygon(50% 0%, 61.8% 33.8%, 97.6% 34.5%, 69% 56.2%, 79.4% 90.5%, 50% 70%, 20.6% 90.5%, 31% 56.2%, 2.4% 34.5%, 38.2% 33.8%)",
  "polygon(50% 0%, 58% 30%, 79% 9%, 72% 38%, 100% 35%, 80% 55%, 95% 78%, 68% 66%, 62% 95%, 50% 72%, 38% 95%, 32% 66%, 5% 78%, 20% 55%, 0% 35%, 28% 38%, 21% 9%, 42% 30%)",
];

const RANK_ICONS = ["○", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "✦"];

interface RankBadgeProps {
  rankIndex: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  className?: string;
}

export function RankBadge({ rankIndex, size = "md", showLabel = false, className }: RankBadgeProps) {
  const idx = Math.max(0, Math.min(RANKS.length - 1, rankIndex));
  const colors = RANK_COLORS[idx];
  const rank = RANKS[idx];
  const shape = BADGE_SHAPES[idx];
  const icon = RANK_ICONS[idx];

  const sizeMap = {
    sm: { px: 32,  fontSize: 8  },
    md: { px: 48,  fontSize: 11 },
    lg: { px: 64,  fontSize: 14 },
    xl: { px: 96,  fontSize: 18 },
  };
  const s = sizeMap[size];

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <motion.div
        whileHover={{ scale: 1.12 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        style={{
          width: s.px,
          height: s.px,
          position: "relative",
          filter: `drop-shadow(0 0 ${s.px * 0.2}px ${colors.glow}) drop-shadow(0 0 ${s.px * 0.08}px ${colors.from})`,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            clipPath: shape,
            background: `linear-gradient(145deg, ${colors.from} 0%, ${colors.to} 60%, ${colors.from}88 100%)`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 40%, transparent 60%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: "linear-gradient(to top, rgba(0,0,0,0.35), transparent)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: s.fontSize,
              fontWeight: 900,
              color: "rgba(255,255,255,0.92)",
              textShadow: `0 1px 2px rgba(0,0,0,0.6), 0 0 ${s.fontSize * 0.8}px ${colors.from}`,
              letterSpacing: "-0.02em",
              userSelect: "none",
            }}
          >
            {icon}
          </div>
        </div>
      </motion.div>

      {showLabel && (
        <div
          className="text-[10px] font-bold tracking-wide uppercase text-center"
          style={{ color: colors.text, textShadow: `0 0 8px ${colors.glow}` }}
        >
          {rank}
        </div>
      )}
    </div>
  );
}
