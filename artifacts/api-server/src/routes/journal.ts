import { Router } from "express";
import { db, journalEntriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateJournalEntryBody,
  UpdateJournalEntryBody,
  UpdateJournalEntryParams,
  DeleteJournalEntryParams,
  GetJournalEntryParams,
} from "@workspace/api-zod";

const router = Router();

function fmt(j: typeof journalEntriesTable.$inferSelect) {
  return {
    ...j,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  };
}

router.get("/journal", async (req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(journalEntriesTable)
    .orderBy(desc(journalEntriesTable.createdAt));
  res.json(entries.map(fmt));
});

router.post("/journal", async (req, res): Promise<void> => {
  const parsed = CreateJournalEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [entry] = await db.insert(journalEntriesTable).values(parsed.data).returning();
  res.status(201).json(fmt(entry));
});

router.get("/journal/:id", async (req, res): Promise<void> => {
  const paramsParsed = GetJournalEntryParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid journal entry ID" });
    return;
  }
  const [entry] = await db
    .select()
    .from(journalEntriesTable)
    .where(eq(journalEntriesTable.id, paramsParsed.data.id));
  if (!entry) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }
  res.json(fmt(entry));
});

router.patch("/journal/:id", async (req, res): Promise<void> => {
  const paramsParsed = UpdateJournalEntryParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid journal entry ID" });
    return;
  }
  const bodyParsed = UpdateJournalEntryBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }
  const [updated] = await db
    .update(journalEntriesTable)
    .set(bodyParsed.data)
    .where(eq(journalEntriesTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Journal entry not found" });
    return;
  }
  res.json(fmt(updated));
});

router.delete("/journal/:id", async (req, res): Promise<void> => {
  const paramsParsed = DeleteJournalEntryParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid journal entry ID" });
    return;
  }
  await db.delete(journalEntriesTable).where(eq(journalEntriesTable.id, paramsParsed.data.id));
  res.status(204).send();
});

export { router as journalRouter };
