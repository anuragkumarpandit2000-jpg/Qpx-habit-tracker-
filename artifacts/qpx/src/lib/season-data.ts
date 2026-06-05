export interface SeasonData {
  id: number;
  name: string;
  title: string;
  theme: string;
  emoji: string;
  finalTitle: string;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  ranks: string[];
  rewards: string[];
  description: string;
  motivational: [string, string];
}

export const SEASON_DATA: SeasonData[] = [
  {
    id: 1,
    name: "Season 1",
    title: "Rise of Titan",
    theme: "Discipline ki foundation",
    emoji: "⚛️",
    finalTitle: "Titan",
    primaryColor: "#ff6b35",
    accentColor: "#ffd700",
    glowColor: "rgba(255, 107, 53, 0.35)",
    ranks: ["Recruit", "Cadet", "Apprentice", "Trainee", "Initiate", "Warrior", "Elite Warrior", "Vanguard", "Guardian", "Champion"],
    rewards: ["Titan Crown", "Season 1 Badge", "Gold Frame", "1000 Bonus Coins"],
    description: "You endured. You evolved. You became Titan.",
    motivational: ["Your previous self built the foundation.", "Now a new journey begins."],
  },
  {
    id: 2,
    name: "Season 2",
    title: "Path of Ascension",
    theme: "Growth aur self-evolution",
    emoji: "🔥",
    finalTitle: "Ascendant",
    primaryColor: "#7c3aed",
    accentColor: "#c4b5fd",
    glowColor: "rgba(124, 58, 237, 0.35)",
    ranks: ["Seeker", "Explorer", "Pathfinder", "Climber", "Challenger", "Conqueror", "Ascender", "Evolutionary", "Zenith Walker", "Ascendant"],
    rewards: ["Ascendant Aura", "Season 2 Badge", "Crystal Frame", "2000 Bonus Coins"],
    description: "You evolved beyond limits. You ascended.",
    motivational: ["The Titan you became opened this door.", "Walk through it — as an Ascendant."],
  },
  {
    id: 3,
    name: "Season 3",
    title: "Age of Legends",
    theme: "Identity building",
    emoji: "👑",
    finalTitle: "Legend",
    primaryColor: "#10b981",
    accentColor: "#6ee7b7",
    glowColor: "rgba(16, 185, 129, 0.35)",
    ranks: ["Storyteller", "Adventurer", "Hero", "Veteran", "Guardian Hero", "Myth Walker", "Epic Warrior", "Legend Maker", "Immortal Hero", "Legend"],
    rewards: ["Emerald Crown", "Season 3 Badge", "Emerald Frame", "3000 Bonus Coins"],
    description: "Your story became legend. Your name echoes through time.",
    motivational: ["Legends are not born — they are forged.", "Your legend begins its next verse."],
  },
  {
    id: 4,
    name: "Season 4",
    title: "Master Protocol",
    theme: "Skill mastery",
    emoji: "⚡",
    finalTitle: "Master",
    primaryColor: "#0ea5e9",
    accentColor: "#7dd3fc",
    glowColor: "rgba(14, 165, 233, 0.35)",
    ranks: ["Student", "Practitioner", "Specialist", "Technician", "Expert", "Professional", "Strategist", "Architect", "Virtuoso", "Master"],
    rewards: ["Master's Emblem", "Season 4 Badge", "Sapphire Frame", "4000 Bonus Coins"],
    description: "Mastery is not a destination — it is a way of being.",
    motivational: ["The Master understands that mastery never ends.", "A new art awaits your dedicated hand."],
  },
  {
    id: 5,
    name: "Season 5",
    title: "Beyond Human",
    theme: "Peak performance",
    emoji: "🌌",
    finalTitle: "Beyond Human",
    primaryColor: "#f43f5e",
    accentColor: "#fca5a5",
    glowColor: "rgba(244, 63, 94, 0.35)",
    ranks: ["Enhanced", "Optimized", "Refined", "Advanced", "Superior", "Hyperion", "Elite Prime", "Apex Runner", "Transcendent", "Beyond Human"],
    rewards: ["Crimson Aegis", "Season 5 Badge", "Flame Frame", "5000 Bonus Coins"],
    description: "You transcended the limits of what humans thought possible.",
    motivational: ["Beyond Human is just the beginning.", "The cosmos opens for those who dare."],
  },
  {
    id: 6,
    name: "Season 6",
    title: "Quantum Awakening",
    theme: "Ultimate transformation",
    emoji: "🚀",
    finalTitle: "Quantum Emperor",
    primaryColor: "#06b6d4",
    accentColor: "#a5f3fc",
    glowColor: "rgba(6, 182, 212, 0.35)",
    ranks: ["Awakened", "Enlightened", "Quantum Seeker", "Quantum Walker", "Quantum Knight", "Quantum Sage", "Quantum Lord", "Quantum Sovereign", "Quantum Prime", "Quantum Emperor"],
    rewards: ["Quantum Crown", "Season 6 Badge", "Quantum Frame", "10000 Bonus Coins"],
    description: "The quantum realm bows to the Emperor of discipline.",
    motivational: ["You have completed the ultimate journey.", "You are now beyond seasons — you are eternal."],
  },
];
