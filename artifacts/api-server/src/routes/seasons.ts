import { Router } from "express";
import { db, seasonsTable, playersTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

async function seedSeasonsIfNeeded() {
  const existing = await db.select().from(seasonsTable);
  if (existing.length >= 6) return;

  if (existing.length > 0) await db.delete(seasonsTable);

  await db.insert(seasonsTable).values([
    { name: "Season 1", subtitle: "Rise of Titan", description: "Prove your worth. Rise from Recruit to Champion. Only the most disciplined become Titan.", startDate: "2025-01-01", endDate: "2025-03-31", active: true, rewards: ["Titan Crown", "Season 1 Badge", "Gold Frame", "1000 Coins"] },
    { name: "Season 2", subtitle: "Path of Ascension", description: "Evolve beyond limits. Walk the path from Seeker to Ascendant.", startDate: "2025-04-01", endDate: "2025-06-30", active: false, rewards: ["Ascendant Aura", "Season 2 Badge", "Crystal Frame", "2000 Coins"] },
    { name: "Season 3", subtitle: "Age of Legends", description: "Build your identity. Forge your legend from Storyteller to Legend itself.", startDate: "2025-07-01", endDate: "2025-09-30", active: false, rewards: ["Emerald Crown", "Season 3 Badge", "Emerald Frame", "3000 Coins"] },
    { name: "Season 4", subtitle: "Master Protocol", description: "Master your craft. From Student to Master — the protocol demands perfection.", startDate: "2025-10-01", endDate: "2025-12-31", active: false, rewards: ["Master Emblem", "Season 4 Badge", "Sapphire Frame", "4000 Coins"] },
    { name: "Season 5", subtitle: "Beyond Human", description: "Transcend human limits. Evolve from Enhanced to Beyond Human.", startDate: "2026-01-01", endDate: "2026-03-31", active: false, rewards: ["Crimson Aegis", "Season 5 Badge", "Flame Frame", "5000 Coins"] },
    { name: "Season 6", subtitle: "Quantum Awakening", description: "The ultimate transformation. Rise from Awakened to Quantum Emperor.", startDate: "2026-04-01", endDate: "2026-06-30", active: false, rewards: ["Quantum Crown", "Season 6 Badge", "Quantum Frame", "10000 Coins"] },
  ]);
}

router.get("/seasons/current", async (req, res): Promise<void> => {
  await seedSeasonsIfNeeded();

  // Return the season matching the player's current season
  const [player] = await db.select().from(playersTable).limit(1);
  const currentSeasonNum = player?.currentSeason ?? 1;

  const allSeasons = await db.select().from(seasonsTable).orderBy(asc(seasonsTable.id));
  const season = allSeasons[currentSeasonNum - 1] ?? allSeasons[0];

  if (!season) {
    res.status(200).json(null);
    return;
  }

  res.json({
    ...season,
    createdAt: season.createdAt.toISOString(),
  });
});

export { router as seasonsRouter };
