import { Router } from "express";
import { db, inventoryItemsTable, playerInventoryTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { EquipItemParams } from "@workspace/api-zod";

const router = Router();

async function seedInventoryIfEmpty() {
  const existing = await db.select().from(inventoryItemsTable);
  if (existing.length > 0) return;

  await db.insert(inventoryItemsTable).values([
    { name: "Recruit Uniform", type: "outfit", rarity: "common", unlocked: true, equipped: true, requiredRank: "Recruit", requiredLevel: 1 },
    { name: "Cadet Armor", type: "outfit", rarity: "common", unlocked: false, equipped: false, requiredRank: "Cadet", requiredLevel: 2 },
    { name: "Warrior Plate", type: "outfit", rarity: "rare", unlocked: false, equipped: false, requiredRank: "Warrior", requiredLevel: 4 },
    { name: "Champion's Gear", type: "outfit", rarity: "epic", unlocked: false, equipped: false, requiredRank: "Champion", requiredLevel: 6 },
    { name: "Titan Armor", type: "outfit", rarity: "legendary", unlocked: false, equipped: false, requiredRank: "Titan", requiredLevel: 9 },
    { name: "Cyber Aura", type: "effect", rarity: "rare", unlocked: false, equipped: false, requiredRank: "Warrior", requiredLevel: 3 },
    { name: "Energy Flames", type: "effect", rarity: "epic", unlocked: false, equipped: false, requiredRank: "Legend", requiredLevel: 7 },
    { name: "Titan Core", type: "effect", rarity: "legendary", unlocked: false, equipped: false, requiredRank: "Titan", requiredLevel: 9 },
    { name: "Bronze Frame", type: "frame", rarity: "common", unlocked: true, equipped: false, requiredRank: "Recruit", requiredLevel: 1 },
    { name: "Gold Frame", type: "frame", rarity: "rare", unlocked: false, equipped: false, requiredRank: "Champion", requiredLevel: 6 },
    { name: "Crystal Frame", type: "frame", rarity: "legendary", unlocked: false, equipped: false, requiredRank: "Grandmaster", requiredLevel: 8 },
    { name: "Discipline King", type: "title", rarity: "rare", unlocked: false, equipped: false, requiredRank: "Warrior", requiredLevel: 4 },
    { name: "Consistency Legend", type: "title", rarity: "epic", unlocked: false, equipped: false, requiredRank: "Legend", requiredLevel: 7 },
    { name: "Iron Badge", type: "badge", rarity: "common", unlocked: true, equipped: false, requiredRank: "Recruit", requiredLevel: 1 },
    { name: "Crystal Badge", type: "badge", rarity: "legendary", unlocked: false, equipped: false, requiredRank: "Grandmaster", requiredLevel: 8 },
  ]);

  await db.insert(playerInventoryTable).values({
    equippedOutfit: "Recruit Uniform",
    equippedEffect: null,
    equippedFrame: null,
  });
}

router.get("/inventory", async (req, res): Promise<void> => {
  await seedInventoryIfEmpty();
  const items = await db.select().from(inventoryItemsTable);
  const [inv] = await db.select().from(playerInventoryTable).limit(1);
  res.json({
    items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    equippedOutfit: inv?.equippedOutfit ?? null,
    equippedEffect: inv?.equippedEffect ?? null,
    equippedFrame: inv?.equippedFrame ?? null,
  });
});

router.post("/inventory/:itemId/equip", async (req, res): Promise<void> => {
  const paramsParsed = EquipItemParams.safeParse({ itemId: Number(req.params.itemId) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid item ID" });
    return;
  }
  const [item] = await db
    .select()
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.id, paramsParsed.data.itemId));
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  if (!item.unlocked) {
    res.status(400).json({ error: "Item not unlocked" });
    return;
  }

  // Unequip others of same type
  await db
    .update(inventoryItemsTable)
    .set({ equipped: false })
    .where(eq(inventoryItemsTable.type, item.type));

  // Equip this one
  await db
    .update(inventoryItemsTable)
    .set({ equipped: true })
    .where(eq(inventoryItemsTable.id, item.id));

  // Update player inventory record
  const [inv] = await db.select().from(playerInventoryTable).limit(1);
  const field =
    item.type === "outfit" ? "equippedOutfit" :
    item.type === "effect" ? "equippedEffect" :
    item.type === "frame" ? "equippedFrame" : null;

  if (field && inv) {
    await db
      .update(playerInventoryTable)
      .set({ [field]: item.name })
      .where(eq(playerInventoryTable.id, inv.id));
  }

  const items = await db.select().from(inventoryItemsTable);
  const [updatedInv] = await db.select().from(playerInventoryTable).limit(1);

  res.json({
    items: items.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    equippedOutfit: updatedInv?.equippedOutfit ?? null,
    equippedEffect: updatedInv?.equippedEffect ?? null,
    equippedFrame: updatedInv?.equippedFrame ?? null,
  });
});

export { router as inventoryRouter };
