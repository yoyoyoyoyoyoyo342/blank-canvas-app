import { Router } from "express";
import { supabase, getUserFromToken } from "../lib/supabase.js";
import { GetSettingsQueryParams, UpdateSettingsQueryParams, UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

router.get("/settings", async (req, res) => {
  const parsed = GetSettingsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data: settingsRow } = await supabase
    .from("user_settings")
    .select("city_override")
    .eq("user_id", user.id)
    .single();

  const { data: spotify } = await supabase
    .from("spotify_connections")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  const { data: caldav } = await supabase
    .from("caldav_connections")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  const { data: aula } = await supabase
    .from("aula_connections")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  res.json({
    city_override: settingsRow?.city_override ?? null,
    spotify_connected: !!spotify,
    caldav_connected: !!caldav,
    aula_connected: !!aula,
  });
});

router.put("/settings", async (req, res) => {
  const parsed = UpdateSettingsQueryParams.safeParse(req.query);
  const body = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success || !body.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { error } = await supabase.from("user_settings").upsert(
    { user_id: user.id, city_override: body.data.city_override ?? null, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  if (error) { res.status(500).json({ error: "Failed to update settings" }); return; }

  const { data: updated } = await supabase
    .from("user_settings")
    .select("city_override")
    .eq("user_id", user.id)
    .single();

  const { data: spotify } = await supabase.from("spotify_connections").select("user_id").eq("user_id", user.id).single();
  const { data: caldav } = await supabase.from("caldav_connections").select("user_id").eq("user_id", user.id).single();
  const { data: aula } = await supabase.from("aula_connections").select("user_id").eq("user_id", user.id).single();

  res.json({
    city_override: updated?.city_override ?? null,
    spotify_connected: !!spotify,
    caldav_connected: !!caldav,
    aula_connected: !!aula,
  });
});

router.delete("/settings/connections/:provider", async (req, res) => {
  const accessToken = req.query["access_token"] as string;
  if (!accessToken) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(accessToken);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { provider } = req.params;
  const tableMap: Record<string, string> = {
    spotify: "spotify_connections",
    caldav: "caldav_connections",
    aula: "aula_connections",
  };

  const table = tableMap[provider];
  if (!table) { res.status(400).json({ error: "Unknown provider" }); return; }

  await supabase.from(table).delete().eq("user_id", user.id);
  res.json({ success: true, message: `${provider} disconnected` });
});

export default router;
