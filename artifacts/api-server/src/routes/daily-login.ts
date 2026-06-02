import { Router } from "express";
import { db, dailyLoginsTable, playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getOrCreatePlayer, updatePlayerXp, formatPlayer } from "./player";
import { DAILY_LOGIN_REWARDS } from "../lib/rpg-system";

const router = Router();

function getDayReward(day: number) {
  const exact = DAILY_LOGIN_REWARDS.find((r) => r.day === day);
  if (exact) return exact;
  // Default pattern for days not explicitly listed
  const dayInCycle = ((day - 1) % 7) + 1;
  if (dayInCycle % 7 === 0) return { day, type: "special", amount: 100, label: "Weekly Bonus: 100 XP" };
  if (dayInCycle % 2 === 0) return { day, type: "xp", amount: 15, label: "15 XP" };
  return { day, type: "coins", amount: 10, label: "10 Coins" };
}

router.post("/daily-login", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];
  const player = await getOrCreatePlayer();
  if (!player) {
    res.status(200).json({ alreadyClaimed: true, skipped: true });
    return;
  }

  const [existing] = await db
    .select()
    .from(dailyLoginsTable)
    .where(eq(dailyLoginsTable.date, today));

  if (existing?.claimed) {
    const reward = getDayReward(player.loginStreakDay);
    res.json({
      alreadyClaimed: true,
      reward: { type: reward.type, amount: reward.amount, label: reward.label },
      streakDay: player.loginStreakDay,
      player: formatPlayer(player),
    });
    return;
  }

  const newStreakDay = player.loginStreakDay + 1;
  const reward = getDayReward(newStreakDay);

  // Record daily login
  if (existing) {
    await db
      .update(dailyLoginsTable)
      .set({ claimed: true, rewardType: reward.type, rewardAmount: reward.amount, rewardLabel: reward.label, claimedAt: new Date() })
      .where(eq(dailyLoginsTable.id, existing.id));
  } else {
    await db.insert(dailyLoginsTable).values({
      date: today,
      claimed: true,
      rewardType: reward.type,
      rewardAmount: reward.amount,
      rewardLabel: reward.label,
      claimedAt: new Date(),
    });
  }

  // Apply rewards
  let updatedPlayer = player;
  if (reward.type === "xp" || reward.type === "special" || reward.type === "rare") {
    const result = await updatePlayerXp(player, reward.amount);
    updatedPlayer = result.player;
    if (reward.type === "special" || reward.type === "rare") {
      const bonus = reward.type === "rare" ? 200 : 50;
      await db
        .update(playersTable)
        .set({ coins: updatedPlayer.coins + bonus, loginStreakDay: newStreakDay })
        .where(eq(playersTable.id, updatedPlayer.id));
    } else {
      await db
        .update(playersTable)
        .set({ loginStreakDay: newStreakDay })
        .where(eq(playersTable.id, updatedPlayer.id));
    }
  } else if (reward.type === "coins" || reward.type === "badge_fragment") {
    await db
      .update(playersTable)
      .set({ coins: player.coins + reward.amount, loginStreakDay: newStreakDay })
      .where(eq(playersTable.id, player.id));
  }

  const [finalPlayer] = await db.select().from(playersTable).where(eq(playersTable.id, player.id));

  res.json({
    alreadyClaimed: false,
    reward: { type: reward.type, amount: reward.amount, label: reward.label },
    streakDay: newStreakDay,
    player: formatPlayer(finalPlayer),
  });
});

router.get("/daily-login/calendar", async (req, res): Promise<void> => {
  const player = await getOrCreatePlayer();
  const logins = await db.select().from(dailyLoginsTable).orderBy(dailyLoginsTable.date);

  const rewards = [];
  for (let day = 1; day <= 30; day++) {
    const reward = getDayReward(day);
    const special = [7, 14, 21, 30].includes(day);
    rewards.push({
      day,
      reward: { type: reward.type, amount: reward.amount, label: reward.label },
      claimed: day <= (player?.loginStreakDay ?? 0),
      special,
    });
  }

  res.json({
    rewards,
    claimedDays: rewards.filter((r) => r.claimed).map((r) => r.day),
    currentStreak: player?.loginStreakDay ?? 0,
  });
});

export { router as dailyLoginRouter };
