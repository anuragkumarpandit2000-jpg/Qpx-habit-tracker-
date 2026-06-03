// Ranks — index = level (level 0 = Civilian, level 1 = Recruit, etc.)
export const RANKS = [
  "Civilian",       // Level 0  — starting rank
  "Recruit",        // Level 1
  "Cadet",          // Level 2
  "Trainee",        // Level 3
  "Warrior",        // Level 4
  "Elite Warrior",  // Level 5
  "Champion",       // Level 6
  "Legend",         // Level 7
  "Master",         // Level 8
  "Grandmaster",    // Level 9
  "Titan",          // Level 10
];

// Per-level conditions to level up (XP earned this level + skills + chapters)
export const LEVEL_CONDITIONS = [
  { xp: 100,  skills: 1,  chapters: 1  },  // Level 0 → 1  (Civilian → Recruit)
  { xp: 200,  skills: 3,  chapters: 2  },  // Level 1 → 2  (Recruit → Cadet)
  { xp: 350,  skills: 6,  chapters: 4  },  // Level 2 → 3  (Cadet → Trainee)
  { xp: 550,  skills: 10, chapters: 6  },  // Level 3 → 4  (Trainee → Warrior)
  { xp: 800,  skills: 15, chapters: 9  },  // Level 4 → 5  (Warrior → Elite Warrior)
  { xp: 1100, skills: 21, chapters: 13 },  // Level 5 → 6  (Elite → Champion)
  { xp: 1500, skills: 28, chapters: 18 },  // Level 6 → 7  (Champion → Legend)
  { xp: 2000, skills: 36, chapters: 24 },  // Level 7 → 8  (Legend → Master)
  { xp: 2600, skills: 45, chapters: 31 },  // Level 8 → 9  (Master → Grandmaster)
  { xp: 3300, skills: 55, chapters: 40 },  // Level 9 → 10 (Grandmaster → Titan)
];

export function getLevelUpCondition(currentLevel: number) {
  return LEVEL_CONDITIONS[Math.min(currentLevel, LEVEL_CONDITIONS.length - 1)];
}

// rank index = level (capped at max rank)
export function getRankIndex(level: number): number {
  return Math.min(level, RANKS.length - 1);
}

// Attempt to level up. Returns how many levels gained and new XP state.
export function computeLevelUp(
  currentLevel: number,
  currentXpInLevel: number,
  skillsLearned: number,
  chaptersCompleted: number
): { levelsGained: number; newXpInLevel: number; newXpToNext: number } {
  let level = currentLevel;
  let xpInLevel = currentXpInLevel;
  let levelsGained = 0;

  while (level < LEVEL_CONDITIONS.length) {
    const cond = LEVEL_CONDITIONS[level];
    if (
      xpInLevel >= cond.xp &&
      skillsLearned >= cond.skills &&
      chaptersCompleted >= cond.chapters
    ) {
      xpInLevel -= cond.xp;
      level++;
      levelsGained++;
    } else {
      break;
    }
  }

  const nextCond = LEVEL_CONDITIONS[Math.min(level, LEVEL_CONDITIONS.length - 1)];
  return { levelsGained, newXpInLevel: xpInLevel, newXpToNext: nextCond.xp };
}

// XP + coin rewards for skills by tier (used by skill-learned endpoint)
export const SKILL_REWARDS: Record<string, { xp: number; coins: number }> = {
  beginner:     { xp: 5,  coins: 2  },
  intermediate: { xp: 10, coins: 5  },
  advanced:     { xp: 20, coins: 10 },
};

export const CHAPTER_REWARD = { xp: 8, coins: 3 };

export const DEFAULT_QUESTS = [
  { title: "Morning Meditation", category: "mind",      xpReward: 5,  coinReward: 2, hpPenalty: 3  },
  { title: "Workout Session",    category: "body",      xpReward: 10, coinReward: 5, hpPenalty: 5  },
  { title: "Study Session",      category: "knowledge", xpReward: 15, coinReward: 7, hpPenalty: 10 },
  { title: "Reading",            category: "knowledge", xpReward: 5,  coinReward: 2, hpPenalty: 3  },
  { title: "Coding Practice",    category: "creation",  xpReward: 10, coinReward: 5, hpPenalty: 5  },
  { title: "Journal Entry",      category: "mind",      xpReward: 5,  coinReward: 2, hpPenalty: 3  },
  { title: "No Junk Food",       category: "health",    xpReward: 5,  coinReward: 2, hpPenalty: 5  },
  { title: "Sleep Goal (7-9 hrs)",category: "health",   xpReward: 5,  coinReward: 2, hpPenalty: 5  },
];

export const ACHIEVEMENTS_SEED = [
  { title: "First Step",        description: "Complete your first quest",      category: "quests",  xpReward: 25,   coinReward: 10,  rarity: "common",    target: 1   },
  { title: "Warrior Spirit",    description: "Complete 10 quests",             category: "quests",  xpReward: 75,   coinReward: 30,  rarity: "common",    target: 10  },
  { title: "Discipline King",   description: "Complete 100 quests",            category: "quests",  xpReward: 250,  coinReward: 100, rarity: "rare",      target: 100 },
  { title: "7-Day Streak",      description: "Maintain a 7-day streak",        category: "streak",  xpReward: 100,  coinReward: 50,  rarity: "rare",      target: 7   },
  { title: "30-Day Discipline", description: "Maintain a 30-day streak",       category: "streak",  xpReward: 500,  coinReward: 200, rarity: "epic",      target: 30  },
  { title: "Iron Warrior",      description: "Complete 50 body quests",        category: "body",    xpReward: 150,  coinReward: 75,  rarity: "rare",      target: 50  },
  { title: "Study Titan",       description: "Complete 50 knowledge quests",   category: "knowledge",xpReward: 150, coinReward: 75,  rarity: "rare",      target: 50  },
  { title: "Book Slayer",       description: "Complete 25 reading quests",     category: "knowledge",xpReward: 100, coinReward: 50,  rarity: "rare",      target: 25  },
  { title: "Creator Pro",       description: "Complete 30 creation quests",    category: "creation",xpReward: 125,  coinReward: 60,  rarity: "rare",      target: 30  },
  { title: "Coding Beast",      description: "Complete 20 coding quests",      category: "creation",xpReward: 100,  coinReward: 50,  rarity: "rare",      target: 20  },
  { title: "Consistency Legend",description: "Reach Level 5",                  category: "level",   xpReward: 200,  coinReward: 100, rarity: "epic",      target: 5   },
  { title: "Titan Achievement", description: "Reach Titan rank",               category: "rank",    xpReward: 1000, coinReward: 500, rarity: "legendary", target: 10  },
  { title: "Journal Master",    description: "Write 30 journal entries",        category: "journal", xpReward: 150,  coinReward: 75,  rarity: "rare",      target: 30  },
  { title: "First Journal",     description: "Write your first journal entry",  category: "journal", xpReward: 25,   coinReward: 10,  rarity: "common",    target: 1   },
  { title: "First Workout",     description: "Complete your first workout",     category: "body",    xpReward: 25,   coinReward: 10,  rarity: "common",    target: 1   },
];

export const DAILY_LOGIN_REWARDS = [
  { day: 1,  type: "coins",        amount: 10,  label: "10 Coins"                        },
  { day: 2,  type: "xp",           amount: 15,  label: "15 XP"                           },
  { day: 3,  type: "coins",        amount: 20,  label: "20 Coins"                        },
  { day: 4,  type: "xp",           amount: 20,  label: "20 XP"                           },
  { day: 5,  type: "coins",        amount: 25,  label: "25 Coins"                        },
  { day: 6,  type: "xp",           amount: 30,  label: "30 XP"                           },
  { day: 7,  type: "special",      amount: 100, label: "Special Reward: 100 XP + 50 Coins"},
  { day: 8,  type: "coins",        amount: 15,  label: "15 Coins"                        },
  { day: 9,  type: "xp",           amount: 20,  label: "20 XP"                           },
  { day: 10, type: "badge_fragment",amount: 1,  label: "Badge Fragment"                  },
  { day: 14, type: "special",      amount: 150, label: "Week 2 Reward: 150 XP"           },
  { day: 21, type: "rare",         amount: 200, label: "3-Week Legend: 200 XP + Badge"   },
  { day: 30, type: "rare",         amount: 500, label: "Monthly Champion: 500 XP + 200 Coins" },
];
