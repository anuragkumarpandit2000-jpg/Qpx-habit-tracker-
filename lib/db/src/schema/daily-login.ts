import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dailyLoginsTable = pgTable("daily_logins", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  claimed: boolean("claimed").notNull().default(false),
  rewardType: text("reward_type").notNull(),
  rewardAmount: integer("reward_amount").notNull().default(0),
  rewardLabel: text("reward_label").notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDailyLoginSchema = createInsertSchema(dailyLoginsTable).omit({ id: true, createdAt: true });
export type InsertDailyLogin = z.infer<typeof insertDailyLoginSchema>;
export type DailyLogin = typeof dailyLoginsTable.$inferSelect;
