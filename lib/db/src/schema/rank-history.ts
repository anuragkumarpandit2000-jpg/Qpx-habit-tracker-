import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rankHistoryTable = pgTable("rank_history", {
  id: serial("id").primaryKey(),
  rank: text("rank").notNull(),
  achievedAt: timestamp("achieved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRankHistorySchema = createInsertSchema(rankHistoryTable).omit({ id: true });
export type InsertRankHistory = z.infer<typeof insertRankHistorySchema>;
export type RankHistory = typeof rankHistoryTable.$inferSelect;
