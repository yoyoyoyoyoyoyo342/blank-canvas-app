import { Router } from "express";
import Groq from "groq-sdk";
import { supabase, getUserFromToken } from "../lib/supabase.js";
import { GetTodayBriefingQueryParams } from "@workspace/api-zod";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.get("/briefings/today", async (req, res) => {
  const parsed = GetTodayBriefingQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing access_token" });
    return;
  }

  const { access_token } = parsed.data;
  const user = await getUserFromToken(access_token);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("briefings")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (existing) {
    res.json({ id: existing.id, content: existing.content, date: existing.date, cached: true });
    return;
  }

  try {
    const name = user.user_metadata?.full_name?.split(" ")[0] || "there";

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are flo., a warm and calm personal AI assistant. Generate a brief, warm 2-3 sentence morning briefing for the user. Be personal, calm, and encouraging. No emojis. No bullet points. Just flowing, warm prose.",
        },
        {
          role: "user",
          content: `Generate a morning briefing for ${name}. Today is ${new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}. Keep it to 2-3 sentences.`,
        },
      ],
      max_tokens: 200,
    });

    const content =
      completion.choices[0]?.message?.content ||
      "Good morning. Today is a new day full of possibilities. Take it one moment at a time.";

    const { data: saved, error: saveError } = await supabase
      .from("briefings")
      .insert({ user_id: user.id, content, date: today })
      .select()
      .single();

    if (saveError || !saved) {
      res.json({ id: "temp", content, date: today, cached: false });
      return;
    }

    res.json({ id: saved.id, content: saved.content, date: saved.date, cached: false });
  } catch {
    res.status(500).json({ error: "Failed to generate briefing" });
  }
});

export default router;
