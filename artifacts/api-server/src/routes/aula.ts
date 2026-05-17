import { Router } from "express";
import { supabase, getUserFromToken } from "../lib/supabase.js";
import { AulaSchoolProvider } from "../providers/aula.js";
import {
  GetAulaDataQueryParams,
  ConnectAulaQueryParams,
  ConnectAulaBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/aula/data", async (req, res) => {
  const parsed = GetAulaDataQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data: conn } = await supabase
    .from("aula_connections")
    .select("username_encrypted, password_encrypted")
    .eq("user_id", user.id)
    .single();

  if (!conn) { res.json({ messages: [], schedule: [], children: [] }); return; }

  const provider = new AulaSchoolProvider();
  const ok = await provider.auth({
    username: conn.username_encrypted,
    password: conn.password_encrypted,
  });

  if (!ok) {
    res.status(401).json({ error: "Aula authentication failed" });
    return;
  }

  const [messages, schedule, children] = await Promise.all([
    provider.getMessages(),
    provider.getCalendar(),
    provider.getChildren(),
  ]);

  res.json({
    messages,
    schedule,
    children: children.map((c) => c.name),
  });
});

router.post("/aula/connect", async (req, res) => {
  const parsed = ConnectAulaQueryParams.safeParse(req.query);
  const body = ConnectAulaBody.safeParse(req.body);
  if (!parsed.success || !body.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const provider = new AulaSchoolProvider();
  const ok = await provider.auth({ username: body.data.username, password: body.data.password });
  if (!ok) {
    res.status(400).json({ error: "Invalid Aula credentials" });
    return;
  }

  const { error } = await supabase.from("aula_connections").upsert(
    {
      user_id: user.id,
      username_encrypted: body.data.username,
      password_encrypted: body.data.password,
    },
    { onConflict: "user_id" }
  );
  if (error) { res.status(500).json({ error: "Failed to save credentials" }); return; }

  res.json({ success: true, message: "Aula connected" });
});

export default router;
