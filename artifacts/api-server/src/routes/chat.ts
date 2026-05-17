import { Router } from "express";
import Groq from "groq-sdk";
import { supabase, getUserFromToken } from "../lib/supabase.js";
import { GetChatHistoryQueryParams } from "@workspace/api-zod";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.get("/chat/history", async (req, res) => {
  const parsed = GetChatHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data, error } = await supabase
    .from("chats")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) { res.status(500).json({ error: "Failed to fetch history" }); return; }

  res.json(
    (data ?? []).map((row) => ({
      id: row.id as string,
      role: row.role as "user" | "assistant",
      content: row.content as string,
      created_at: (row.created_at as string),
    }))
  );
});

router.post("/chat/message", async (req, res) => {
  const accessToken = req.query["access_token"] as string;
  const { message, context } = req.body as { message: string; context?: string };

  if (!accessToken || !message) {
    res.status(400).json({ error: "Missing access_token or message" });
    return;
  }

  const user = await getUserFromToken(accessToken);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data: history } = await supabase
    .from("chats")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(20);

  await supabase.from("chats").insert({
    user_id: user.id,
    role: "user",
    content: message,
  });

  const systemPrompt = `You are flo., a warm calm personal assistant. You know the user's day including their calendar events, emails, weather, reminders, school schedule and music. Be concise, friendly, never robotic.${context ? `\n\nContext about today: ${context}` : ""}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(history ?? []).map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content as string,
    })),
    { role: "user" as const, content: message },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 600,
      stream: true,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    await supabase.from("chats").insert({
      user_id: user.id,
      role: "assistant",
      content: fullContent,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
    res.end();
  }
});

router.delete("/chat/history", async (req, res) => {
  const accessToken = req.query["access_token"] as string;
  if (!accessToken) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(accessToken);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  await supabase.from("chats").delete().eq("user_id", user.id);
  res.json({ success: true, message: "Chat history cleared" });
});

export default router;
