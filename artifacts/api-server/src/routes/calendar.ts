import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { GetTodayEventsQueryParams } from "@workspace/api-zod";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
}

interface GoogleCalendarResponse {
  items?: GoogleCalendarEvent[];
  error?: { message: string };
}

router.get("/calendar/today", async (req, res) => {
  const parsed = GetTodayEventsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing access_token" });
    return;
  }

  const { access_token } = parsed.data;

  const { data: userData, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !userData.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const googleToken =
    sessionData?.session?.provider_token ??
    userData.user?.user_metadata?.provider_token ??
    access_token;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin: startOfDay.toISOString(),
          timeMax: endOfDay.toISOString(),
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: "10",
        }),
      {
        headers: { Authorization: `Bearer ${googleToken}` },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        res.status(401).json({ error: "Google Calendar access denied" });
        return;
      }
      throw new Error(`Calendar API error: ${errorText}`);
    }

    const data = (await response.json()) as GoogleCalendarResponse;

    const events = (data.items ?? []).map((event) => ({
      id: event.id,
      title: event.summary ?? "Untitled event",
      startTime: event.start?.dateTime ?? event.start?.date ?? null,
      endTime: event.end?.dateTime ?? event.end?.date ?? null,
      allDay: !event.start?.dateTime,
      location: event.location ?? null,
    }));

    res.json(events);
  } catch {
    res.status(500).json({ error: "Failed to fetch calendar events" });
  }
});

export default router;
