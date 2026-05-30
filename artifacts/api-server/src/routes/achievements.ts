import { Router } from "express";
import { db, achievementsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

function fmt(a: typeof achievementsTable.$inferSelect) {
  return {
    ...a,
    unlockedAt: a.unlockedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/achievements", async (req, res): Promise<void> => {
  const achievements = await db.select().from(achievementsTable).orderBy(achievementsTable.rarity, achievementsTable.title);
  res.json(achievements.map(fmt));
});

router.get("/achievements/recent", async (req, res): Promise<void> => {
  const achievements = await db
    .select()
    .from(achievementsTable)
    .where(eq(achievementsTable.unlocked, true))
    .orderBy(desc(achievementsTable.unlockedAt))
    .limit(5);
  res.json(achievements.map(fmt));
});

export { router as achievementsRouter };
