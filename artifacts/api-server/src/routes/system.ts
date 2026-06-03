import { Router } from "express";

const router = Router();

router.post("/system/send-email", async (req, res): Promise<void> => {
  const { to, subject, html } = req.body as { to?: string; subject?: string; html?: string };

  if (!to || !subject || !html) {
    res.status(400).json({ error: "to, subject, and html are required" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Email not configured. Add RESEND_API_KEY to Secrets." });
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "QPX Reminder <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    res.status(502).json({ error: `Email send failed: ${err}` });
    return;
  }

  const data = await response.json();
  res.json({ success: true, id: (data as { id: string }).id });
});

export default router;
