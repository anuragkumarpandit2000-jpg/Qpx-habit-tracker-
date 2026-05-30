export const RANKS = [
  "Recruit",
  "Cadet",
  "Trainee",
  "Warrior",
  "Elite Warrior",
  "Champion",
  "Legend",
  "Master",
  "Grandmaster",
  "Titan",
];

const RANK_XP_THRESHOLDS = [0, 150, 400, 800, 1500, 2500, 4000, 6000, 9000, 13000];

export function getRankIndex(totalXp: number): number {
  let rankIndex = 0;
  for (let i = RANK_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= RANK_XP_THRESHOLDS[i]) {
      rankIndex = i;
      break;
    }
  }
  return rankIndex;
}

export function getLevelFromXp(totalXp: number): { level: number; xpInLevel: number; xpToNext: number } {
  // XP required per level: 100, 120, 140, 160, 180, 200, 220, 240, 260...
  let level = 1;
  let accumulated = 0;
  while (true) {
    const needed = 100 + (level - 1) * 20;
    if (accumulated + needed > totalXp) {
      return {
        level,
        xpInLevel: totalXp - accumulated,
        xpToNext: needed,
      };
    }
    accumulated += needed;
    level++;
    if (level > 100) break;
  }
  return { level: 100, xpInLevel: 0, xpToNext: 9999 };
}

export const DEFAULT_QUESTS = [
  { title: "Morning Meditation", category: "mind", xpReward: 5, coinReward: 2, hpPenalty: 3 },
  { title: "Workout Session", category: "body", xpReward: 10, coinReward: 5, hpPenalty: 5 },
  { title: "Study Session", category: "knowledge", xpReward: 15, coinReward: 7, hpPenalty: 10 },
  { title: "Reading", category: "knowledge", xpReward: 5, coinReward: 2, hpPenalty: 3 },
  { title: "Coding Practice", category: "creation", xpReward: 10, coinReward: 5, hpPenalty: 5 },
  { title: "Journal Entry", category: "mind", xpReward: 5, coinReward: 2, hpPenalty: 3 },
  { title: "No Junk Food", category: "health", xpReward: 5, coinReward: 2, hpPenalty: 5 },
  { title: "Sleep Goal (7-9 hrs)", category: "health", xpReward: 5, coinReward: 2, hpPenalty: 5 },
];

export const ACHIEVEMENTS_SEED = [
  { title: "First Step", description: "Complete your first quest", category: "quests", xpReward: 25, coinReward: 10, rarity: "common", target: 1 },
  { title: "Warrior Spirit", description: "Complete 10 quests", category: "quests", xpReward: 75, coinReward: 30, rarity: "common", target: 10 },
  { title: "Discipline King", description: "Complete 100 quests", category: "quests", xpReward: 250, coinReward: 100, rarity: "rare", target: 100 },
  { title: "7-Day Streak", description: "Maintain a 7-day streak", category: "streak", xpReward: 100, coinReward: 50, rarity: "rare", target: 7 },
  { title: "30-Day Discipline", description: "Maintain a 30-day streak", category: "streak", xpReward: 500, coinReward: 200, rarity: "epic", target: 30 },
  { title: "Iron Warrior", description: "Complete 50 body quests", category: "body", xpReward: 150, coinReward: 75, rarity: "rare", target: 50 },
  { title: "Study Titan", description: "Complete 50 knowledge quests", category: "knowledge", xpReward: 150, coinReward: 75, rarity: "rare", target: 50 },
  { title: "Book Slayer", description: "Complete 25 reading quests", category: "knowledge", xpReward: 100, coinReward: 50, rarity: "rare", target: 25 },
  { title: "Creator Pro", description: "Complete 30 creation quests", category: "creation", xpReward: 125, coinReward: 60, rarity: "rare", target: 30 },
  { title: "Coding Beast", description: "Complete 20 coding quests", category: "creation", xpReward: 100, coinReward: 50, rarity: "rare", target: 20 },
  { title: "Consistency Legend", description: "Reach Level 5", category: "level", xpReward: 200, coinReward: 100, rarity: "epic", target: 5 },
  { title: "Titan Achievement", description: "Reach Titan rank", category: "rank", xpReward: 1000, coinReward: 500, rarity: "legendary", target: 9 },
  { title: "Journal Master", description: "Write 30 journal entries", category: "journal", xpReward: 150, coinReward: 75, rarity: "rare", target: 30 },
  { title: "First Journal", description: "Write your first journal entry", category: "journal", xpReward: 25, coinReward: 10, rarity: "common", target: 1 },
  { title: "First Workout", description: "Complete your first workout", category: "body", xpReward: 25, coinReward: 10, rarity: "common", target: 1 },
];

export const DAILY_LOGIN_REWARDS = [
  { day: 1, type: "coins", amount: 10, label: "10 Coins" },
  { day: 2, type: "xp", amount: 15, label: "15 XP" },
  { day: 3, type: "coins", amount: 20, label: "20 Coins" },
  { day: 4, type: "xp", amount: 20, label: "20 XP" },
  { day: 5, type: "coins", amount: 25, label: "25 Coins" },
  { day: 6, type: "xp", amount: 30, label: "30 XP" },
  { day: 7, type: "special", amount: 100, label: "Special Reward: 100 XP + 50 Coins" },
  { day: 8, type: "coins", amount: 15, label: "15 Coins" },
  { day: 9, type: "xp", amount: 20, label: "20 XP" },
  { day: 10, type: "badge_fragment", amount: 1, label: "Badge Fragment" },
  { day: 14, type: "special", amount: 150, label: "Week 2 Reward: 150 XP" },
  { day: 21, type: "rare", amount: 200, label: "3-Week Legend: 200 XP + Badge" },
  { day: 30, type: "rare", amount: 500, label: "Monthly Champion: 500 XP + 200 Coins" },
];
