import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const progressHistoryTable = pgTable("progress_history", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  questsCompleted: integer("quests_completed").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProgressHistorySchema = createInsertSchema(progressHistoryTable).omit({ id: true, createdAt: true });
export type InsertProgressHistory = z.infer<typeof insertProgressHistorySchema>;
export type ProgressHistory = typeof progressHistoryTable.$inferSelect;
