import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  User,
  Sword,
  Trophy,
  BookOpen,
  BarChart3,
  Skull,
  Package,
  Gift,
  Settings,
  Zap,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetPlayerProfile } from "@workspace/api-client-react";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/character", icon: User, label: "Character" },
  { path: "/quests", icon: Sword, label: "Quests" },
  { path: "/achievements", icon: Trophy, label: "Achievements" },
  { path: "/chapter10", icon: GraduationCap, label: "Chapter 10" },
  { path: "/journal", icon: BookOpen, label: "Journal" },
  { path: "/stats", icon: BarChart3, label: "Stats" },
  { path: "/boss-battles", icon: Skull, label: "Boss Battles" },
  { path: "/inventory", icon: Package, label: "Inventory" },
  { path: "/rewards", icon: Gift, label: "Rewards" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const RANK_COLORS = [
  "#cd7f32", // Recruit - Bronze
  "#8a9ba8", // Cadet - Steel
  "#c0c0c0", // Trainee - Silver
  "#ffd700", // Warrior - Gold
  "#e5e4e2", // Elite Warrior - Platinum
  "#878681", // Champion - Titanium
  "#a8d8ea", // Legend - Crystal
  "#00ffff", // Master - Energy Core
  "#bf00ff", // Grandmaster - Energy Core 2
  "#ffffff", // Titan - Pure Light
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: player } = useGetPlayerProfile();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0 bottom-0 z-40 border-r border-border/40"
        style={{ background: "hsl(240 20% 6%)" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border/40">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))" }}>
            <Zap className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="font-black text-sm tracking-[0.2em] text-white">QPX</div>
            <div className="text-[9px] tracking-widest text-muted-foreground uppercase">Quantum Progress</div>
          </div>
        </div>

        {/* Player mini card */}
        {player && (
          <div className="px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-black"
                style={{
                  background: `linear-gradient(135deg, ${RANK_COLORS[player.rankIndex]}, ${RANK_COLORS[Math.min(player.rankIndex + 1, 9)]})`,
                  boxShadow: `0 0 10px ${RANK_COLORS[player.rankIndex]}40`
                }}>
                {player.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">{player.username}</div>
                <div className="text-[10px] text-muted-foreground">Lv.{player.level} · {player.rank}</div>
              </div>
            </div>
            {/* XP bar */}
            <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))" }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((player.xp / player.xpToNextLevel) * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{player.xp} XP</span>
              <span className="text-[9px] text-muted-foreground">{player.xpToNextLevel} XP</span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
            const active = location === path || location.startsWith(path + "/");
            return (
              <Link key={path} href={path}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                    active
                      ? "text-white font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  style={active ? {
                    background: "linear-gradient(90deg, hsl(var(--primary) / 0.2), transparent)",
                    borderLeft: "2px solid hsl(var(--primary))",
                  } : {}}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom stats */}
        {player && (
          <div className="p-4 border-t border-border/40 grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-xs font-bold text-primary">{player.streak}</div>
              <div className="text-[9px] text-muted-foreground">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold" style={{ color: "#ffd700" }}>{player.coins}</div>
              <div className="text-[9px] text-muted-foreground">Coins</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-bold" style={{ color: "#e74c3c" }}>{player.hp}</div>
              <div className="text-[9px] text-muted-foreground">HP</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 flex items-center justify-around px-1 py-2"
        style={{ background: "hsl(240 20% 5% / 0.95)", backdropFilter: "blur(12px)" }}>
        {NAV_ITEMS.slice(0, 5).map(({ path, icon: Icon, label }) => {
          const active = location === path;
          return (
            <Link key={path} href={path}>
              <div className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                <Icon className="w-5 h-5" />
                <span className="text-[9px]">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
