import { Router } from "express";
import multer from "multer";
import Groq from "groq-sdk";
import { supabase, getUserFromToken } from "../lib/supabase.js";
import {
  GetSchedulesQueryParams,
  CreateScheduleEntryQueryParams,
  CreateScheduleEntryBody,
  RemoveScheduleEntryQueryParams,
} from "@workspace/api-zod";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.get("/schedules", async (req, res) => {
  const parsed = GetSchedulesQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data, error } = await supabase
    .from("schedules")
    .select("id, day_of_week, start_time, end_time, subject, room")
    .eq("user_id", user.id)
    .order("day_of_week")
    .order("start_time");

  if (error) { res.status(500).json({ error: "Failed to fetch schedules" }); return; }

  res.json(
    (data ?? []).map((row) => ({
      id: row.id,
      day_of_week: row.day_of_week,
      start_time: row.start_time,
      end_time: row.end_time,
      subject: row.subject,
      room: row.room ?? null,
    }))
  );
});

router.post("/schedules", async (req, res) => {
  const parsed = CreateScheduleEntryQueryParams.safeParse(req.query);
  const body = CreateScheduleEntryBody.safeParse(req.body);
  if (!parsed.success || !body.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data, error } = await supabase
    .from("schedules")
    .insert({
      user_id: user.id,
      day_of_week: body.data.day_of_week,
      start_time: body.data.start_time,
      end_time: body.data.end_time,
      subject: body.data.subject,
      room: body.data.room ?? null,
    })
    .select()
    .single();

  if (error || !data) { res.status(500).json({ error: "Failed to create entry" }); return; }

  res.status(201).json({
    id: data.id,
    day_of_week: data.day_of_week,
    start_time: data.start_time,
    end_time: data.end_time,
    subject: data.subject,
    room: data.room ?? null,
  });
});

router.delete("/schedules/delete", async (req, res) => {
  const parsed = RemoveScheduleEntryQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing id or access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) { res.status(500).json({ error: "Failed to delete entry" }); return; }

  res.json({ success: true, message: "Entry deleted" });
});

router.post("/schedules/import", upload.single("file"), async (req, res) => {
  const accessToken = req.query["access_token"] as string;
  if (!accessToken || !req.file) {
    res.status(400).json({ error: "Missing file or access_token" });
    return;
  }
  const user = await getUserFromToken(accessToken);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const fileContent = req.file.buffer.toString("utf-8").slice(0, 8000);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Extract a school timetable from this content into a JSON array. Each item must have: day_of_week (Monday/Tuesday/etc), start_time (HH:MM), end_time (HH:MM), subject (string), room (string or null). Respond with only valid JSON array, no explanation.`,
        },
        { role: "user", content: fileContent },
      ],
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) { res.status(422).json({ error: "Could not parse timetable" }); return; }

    const entries = JSON.parse(jsonMatch[0]) as Array<{
      day_of_week: string;
      start_time: string;
      end_time: string;
      subject: string;
      room?: string | null;
    }>;

    const rows = entries.map((e) => ({
      user_id: user.id,
      day_of_week: e.day_of_week,
      start_time: e.start_time,
      end_time: e.end_time,
      subject: e.subject,
      room: e.room ?? null,
    }));

    const { error } = await supabase.from("schedules").insert(rows);
    if (error) { res.status(500).json({ error: "Failed to save schedule" }); return; }

    res.json({ success: true, message: `Imported ${rows.length} entries` });
  } catch {
    res.status(500).json({ error: "Failed to process file" });
  }
});

export default router;
