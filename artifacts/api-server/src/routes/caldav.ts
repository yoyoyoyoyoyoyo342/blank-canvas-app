import { Router } from "express";
import { createDAVClient } from "tsdav";
import { supabase, getUserFromToken } from "../lib/supabase.js";
import {
  ConnectCalDavQueryParams,
  ConnectCalDavBody,
  GetCalDavEventsQueryParams,
  GetCalDavRemindersQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.post("/caldav/connect", async (req, res) => {
  const parsed = ConnectCalDavQueryParams.safeParse(req.query);
  const body = ConnectCalDavBody.safeParse(req.body);
  if (!parsed.success || !body.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { icloud_email, app_password } = body.data;

  try {
    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: icloud_email, password: app_password },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });
    await client.fetchCalendars();

    const { error } = await supabase.from("caldav_connections").upsert(
      { user_id: user.id, icloud_email, app_password_encrypted: app_password },
      { onConflict: "user_id" }
    );
    if (error) throw error;

    res.json({ success: true, message: "Apple Calendar connected" });
  } catch {
    res.status(400).json({ error: "Invalid iCloud credentials" });
  }
});

router.get("/caldav/events", async (req, res) => {
  const parsed = GetCalDavEventsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data: conn } = await supabase
    .from("caldav_connections")
    .select("icloud_email, app_password_encrypted")
    .eq("user_id", user.id)
    .single();

  if (!conn) { res.json([]); return; }

  try {
    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: conn.icloud_email, password: conn.app_password_encrypted },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    const calendars = await client.fetchCalendars();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const allObjects = await Promise.all(
      calendars.map((cal) =>
        client.fetchCalendarObjects({
          calendar: cal,
          timeRange: { start: startOfDay.toISOString(), end: endOfDay.toISOString() },
        })
      )
    );

    const events = allObjects.flat().map((obj) => {
      const lines = (obj.data as string).split("\n");
      const get = (key: string) => lines.find((l) => l.startsWith(key + ":"))?.split(":")[1]?.trim() ?? "";
      const dtstart = get("DTSTART");
      const dtend = get("DTEND");
      const allDay = dtstart?.length === 8;
      return {
        id: obj.url,
        title: get("SUMMARY") || "Apple Event",
        startTime: allDay ? null : (dtstart ? new Date(dtstart).toISOString() : null),
        endTime: allDay ? null : (dtend ? new Date(dtend).toISOString() : null),
        allDay,
        location: get("LOCATION") || null,
        source: "apple" as const,
      };
    });

    res.json(events);
  } catch {
    res.status(500).json({ error: "Failed to fetch CalDAV events" });
  }
});

router.get("/caldav/reminders", async (req, res) => {
  const parsed = GetCalDavRemindersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data: conn } = await supabase
    .from("caldav_connections")
    .select("icloud_email, app_password_encrypted")
    .eq("user_id", user.id)
    .single();

  if (!conn) { res.json([]); return; }

  try {
    const client = await createDAVClient({
      serverUrl: "https://caldav.icloud.com",
      credentials: { username: conn.icloud_email, password: conn.app_password_encrypted },
      authMethod: "Basic",
      defaultAccountType: "caldav",
    });

    const collections = await client.fetchCalendars();
    const reminderLists = collections.filter((c) =>
      (c.components ?? []).includes("VTODO")
    );

    const allObjects = await Promise.all(
      reminderLists.map((list) => client.fetchCalendarObjects({ calendar: list }))
    );

    const reminders = allObjects.flat()
      .filter((obj) => (obj.data as string).includes("VTODO"))
      .map((obj) => {
        const lines = (obj.data as string).split("\n");
        const get = (key: string) => lines.find((l) => l.startsWith(key + ":"))?.split(":")[1]?.trim() ?? "";
        const status = get("STATUS");
        return {
          id: obj.url,
          title: get("SUMMARY") || "Reminder",
          dueDate: get("DUE") ? new Date(get("DUE")).toISOString() : null,
          completed: status === "COMPLETED",
          listName: get("CATEGORIES") || "Reminders",
        };
      })
      .filter((r) => !r.completed)
      .slice(0, 10);

    res.json(reminders);
  } catch {
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

export default router;
