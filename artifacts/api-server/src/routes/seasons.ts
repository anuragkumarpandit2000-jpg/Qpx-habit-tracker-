import { Router } from "express";
import { db, seasonsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

async function seedSeasonIfEmpty() {
  const existing = await db.select().from(seasonsTable);
  if (existing.length > 0) return;

  await db.insert(seasonsTable).values({
    name: "Season 1",
    subtitle: "Rise of Titan",
    description: "The first season of QPX. Prove your worth and rise through the ranks from Recruit to Titan. Only the most disciplined will reach the top.",
    startDate: "2025-01-01",
    endDate: "2025-03-31",
    active: true,
    rewards: [
      "Exclusive Titan Badge",
      "Season 1 Profile Frame",
      "5000 Bonus XP",
      "1000 Coins",
      "Legendary Title: Season 1 Champion",
    ],
  });
}

router.get("/seasons/current", async (req, res): Promise<void> => {
  await seedSeasonIfEmpty();
  const [season] = await db
    .select()
    .from(seasonsTable)
    .where(eq(seasonsTable.active, true))
    .limit(1);

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
