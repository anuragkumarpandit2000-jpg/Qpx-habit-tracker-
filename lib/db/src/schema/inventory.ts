import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryItemsTable = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  rarity: text("rarity").notNull().default("common"),
  unlocked: boolean("unlocked").notNull().default(false),
  equipped: boolean("equipped").notNull().default(false),
  requiredRank: text("required_rank"),
  requiredLevel: integer("required_level"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItemsTable).omit({ id: true, createdAt: true });
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItemsTable.$inferSelect;

export const playerInventoryTable = pgTable("player_inventory", {
  id: serial("id").primaryKey(),
  equippedOutfit: text("equipped_outfit"),
  equippedEffect: text("equipped_effect"),
  equippedFrame: text("equipped_frame"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
