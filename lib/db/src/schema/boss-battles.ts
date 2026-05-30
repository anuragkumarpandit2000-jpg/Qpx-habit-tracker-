import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bossBattlesTable = pgTable("boss_battles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("discipline"),
  targetValue: integer("target_value").notNull(),
  currentProgress: integer("current_progress").notNull().default(0),
  xpReward: integer("xp_reward").notNull().default(500),
  coinReward: integer("coin_reward").notNull().default(200),
  badgeReward: text("badge_reward"),
  status: text("status").notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBossBattleSchema = createInsertSchema(bossBattlesTable).omit({ id: true, createdAt: true });
export type InsertBossBattle = z.infer<typeof insertBossBattleSchema>;
export type BossBattle = typeof bossBattlesTable.$inferSelect;
