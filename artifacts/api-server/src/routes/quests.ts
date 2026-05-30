import { Router } from "express";
import { db, questsTable, playersTable, achievementsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateQuestBody,
  UpdateQuestBody,
  UpdateQuestParams,
  DeleteQuestParams,
  CompleteQuestParams,
} from "@workspace/api-zod";
import { getOrCreatePlayer, updatePlayerXp, formatPlayer } from "./player";
import { RANKS } from "../lib/rpg-system";

const router = Router();

router.get("/quests", async (req, res): Promise<void> => {
  const date = (req.query.date as string) || new Date().toISOString().split("T")[0];
  const quests = await db
    .select()
    .from(questsTable)
    .where(eq(questsTable.date, date))
    .orderBy(desc(questsTable.createdAt));
  res.json(quests.map((q) => ({
    ...q,
    completedAt: q.completedAt?.toISOString() ?? null,
    createdAt: q.createdAt.toISOString(),
  })));
});

router.post("/quests", async (req, res): Promise<void> => {
  const parsed = CreateQuestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const today = new Date().toISOString().split("T")[0];
  const [quest] = await db
    .insert(questsTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      xpReward: parsed.data.xpReward ?? 5,
      coinReward: parsed.data.coinReward ?? 2,
      hpPenalty: parsed.data.hpPenalty ?? 5,
      date: parsed.data.date ?? today,
      completed: false,
    })
    .returning();
  res.status(201).json({
    ...quest,
    completedAt: null,
    createdAt: quest.createdAt.toISOString(),
  });
});

router.patch("/quests/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateQuestParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid quest ID" });
    return;
  }
  const bodyParsed = UpdateQuestBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const [updated] = await db
    .update(questsTable)
    .set(bodyParsed.data)
    .where(eq(questsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Quest not found" });
    return;
  }
  res.json({
    ...updated,
    completedAt: updated.completedAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/quests/:id", async (req, res): Promise<void> => {
  const paramsParsed = DeleteQuestParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid quest ID" });
    return;
  }
  await db.delete(questsTable).where(eq(questsTable.id, paramsParsed.data.id));
  res.status(204).send();
});

router.post("/quests/:id/complete", async (req, res): Promise<void> => {
  const paramsParsed = CompleteQuestParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid quest ID" });
    return;
  }

  const [quest] = await db
    .select()
    .from(questsTable)
    .where(eq(questsTable.id, paramsParsed.data.id));

  if (!quest) {
    res.status(404).json({ error: "Quest not found" });
    return;
  }
  if (quest.completed) {
    res.status(400).json({ error: "Quest already completed" });
    return;
  }

  // Mark quest complete
  const [completedQuest] = await db
    .update(questsTable)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(questsTable.id, quest.id))
    .returning();

  const player = await getOrCreatePlayer();
  if (!player) {
    res.status(404).json({ error: "No player found" });
    return;
  }

  // Award XP and coins
  const result = await updatePlayerXp(player, quest.xpReward);
  await db
    .update(playersTable)
    .set({ coins: result.player.coins + quest.coinReward })
    .where(eq(playersTable.id, result.player.id));
  const [finalPlayer] = await db.select().from(playersTable).where(eq(playersTable.id, result.player.id));

  // Check achievements
  const totalCompleted = await db
    .select()
    .from(questsTable)
    .where(eq(questsTable.completed, true));

  const newAchievements: typeof achievementsTable.$inferSelect[] = [];
  const allAchievements = await db.select().from(achievementsTable);

  for (const ach of allAchievements) {
    if (ach.unlocked) continue;

    let shouldUnlock = false;
    let newProgress = ach.progress ?? 0;

    if (ach.category === "quests") {
      newProgress = totalCompleted.length;
      shouldUnlock = ach.target !== null && newProgress >= ach.target;
    } else if (ach.category === "body" && quest.category === "body") {
      const bodyCompleted = totalCompleted.filter((q) => q.category === "body").length;
      newProgress = bodyCompleted;
      shouldUnlock = ach.target !== null && newProgress >= ach.target;
    } else if (ach.category === "knowledge" && quest.category === "knowledge") {
      const knCompleted = totalCompleted.filter((q) => q.category === "knowledge").length;
      newProgress = knCompleted;
      shouldUnlock = ach.target !== null && newProgress >= ach.target;
    } else if (ach.category === "creation" && quest.category === "creation") {
      const crCompleted = totalCompleted.filter((q) => q.category === "creation").length;
      newProgress = crCompleted;
      shouldUnlock = ach.target !== null && newProgress >= ach.target;
    } else if (ach.category === "level") {
      shouldUnlock = ach.target !== null && result.newLevel >= ach.target;
      newProgress = result.newLevel;
    } else if (ach.category === "rank") {
      shouldUnlock = ach.target !== null && result.player.rankIndex >= ach.target;
      newProgress = result.player.rankIndex;
    }

    if (shouldUnlock) {
      const [unlockedAch] = await db
        .update(achievementsTable)
        .set({ unlocked: true, unlockedAt: new Date(), progress: newProgress })
        .where(eq(achievementsTable.id, ach.id))
        .returning();
      newAchievements.push(unlockedAch);
    } else if (newProgress !== (ach.progress ?? 0)) {
      await db
        .update(achievementsTable)
        .set({ progress: newProgress })
        .where(eq(achievementsTable.id, ach.id));
    }
  }

  res.json({
    quest: {
      ...completedQuest,
      completedAt: completedQuest.completedAt?.toISOString() ?? null,
      createdAt: completedQuest.createdAt.toISOString(),
    },
    player: formatPlayer(finalPlayer),
    xpGained: quest.xpReward,
    coinsGained: quest.coinReward,
    leveledUp: result.leveledUp,
    rankPromoted: result.rankPromoted,
    newAchievements: newAchievements.map((a) => ({
      ...a,
      unlockedAt: a.unlockedAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
});

export { router as questsRouter };
