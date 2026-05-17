import type { SchoolProvider, SchoolMessage, SchoolScheduleItem, SchoolChild } from "./school-provider.js";

interface AulaProfile {
  id: number;
  displayName: string;
}

interface AulaChild {
  id: number;
  displayName: string;
}

interface AulaMessageThread {
  id: number;
  subject: string;
  latestMessage?: {
    text?: { html?: string };
    sendDateTime: string;
    messageType: string;
  };
  creator?: { displayName: string };
}

interface AulaEvent {
  id: number;
  title: string;
  startDateTime: string;
  endDateTime: string;
  belongsToProfiles?: Array<{ displayName: string }>;
}

interface AulaLoginResponse {
  status: number;
}

export class AulaSchoolProvider implements SchoolProvider {
  private sessionCookies: string = "";
  private csrfToken: string = "";
  private profileId: number | null = null;
  private childProfiles: AulaChild[] = [];

  private readonly BASE_URL = "https://www.aula.dk/api/v19";
  private readonly LOGIN_URL = "https://login.aula.dk/auth/login.php?type=unilogin";

  async auth(credentials: Record<string, string>): Promise<boolean> {
    const { username, password } = credentials;
    if (!username || !password) return false;

    try {
      const loginResp = await fetch(this.LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
        redirect: "follow",
      });

      const cookies = loginResp.headers.get("set-cookie");
      if (!cookies) return false;
      this.sessionCookies = cookies;

      const profilesResp = await fetch(`${this.BASE_URL}/?method=profiles.getProfilesByLogin`, {
        headers: { Cookie: this.sessionCookies },
      });

      if (!profilesResp.ok) return false;
      const profilesData = (await profilesResp.json()) as { data?: { profiles?: AulaProfile[] } };
      const profile = profilesData?.data?.profiles?.[0];
      if (!profile) return false;
      this.profileId = profile.id;

      return true;
    } catch {
      return false;
    }
  }

  async getChildren(): Promise<SchoolChild[]> {
    if (!this.profileId) return [];
    try {
      const resp = await fetch(
        `${this.BASE_URL}/?method=profiles.getChildProfiles&profileId=${this.profileId}`,
        { headers: { Cookie: this.sessionCookies } }
      );
      if (!resp.ok) return [];
      const data = (await resp.json()) as { data?: AulaChild[] };
      this.childProfiles = data.data ?? [];
      return this.childProfiles.map((c) => ({ id: String(c.id), name: c.displayName }));
    } catch {
      return [];
    }
  }

  async getMessages(): Promise<SchoolMessage[]> {
    if (!this.profileId) return [];
    try {
      const resp = await fetch(
        `${this.BASE_URL}/?method=messaging.getThreads&profileId=${this.profileId}&page=1&pageSize=5`,
        { headers: { Cookie: this.sessionCookies } }
      );
      if (!resp.ok) return [];
      const data = (await resp.json()) as { data?: { threads?: AulaMessageThread[] } };
      const threads = data?.data?.threads ?? [];
      return threads.map((t) => ({
        id: String(t.id),
        subject: t.subject || "(no subject)",
        sender: t.creator?.displayName ?? "Unknown",
        preview: t.latestMessage?.text?.html?.replace(/<[^>]+>/g, "").slice(0, 120) ?? "",
        receivedAt: t.latestMessage?.sendDateTime ?? new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  async getCalendar(): Promise<SchoolScheduleItem[]> {
    if (!this.profileId) return [];
    const today = new Date().toISOString().split("T")[0];
    try {
      const resp = await fetch(
        `${this.BASE_URL}/?method=calendar.getEventsByProfileIdsAndDate&profileIds[]=${this.profileId}&startDate=${today}&endDate=${today}`,
        { headers: { Cookie: this.sessionCookies } }
      );
      if (!resp.ok) return [];
      const data = (await resp.json()) as { data?: AulaEvent[] };
      const events = data?.data ?? [];
      return events.map((e) => ({
        id: String(e.id),
        title: e.title,
        startTime: e.startDateTime,
        endTime: e.endDateTime,
        childName: e.belongsToProfiles?.[0]?.displayName ?? "",
      }));
    } catch {
      return [];
    }
  }

  async getSchedule(childId?: string): Promise<SchoolScheduleItem[]> {
    const id = childId ? Number(childId) : this.childProfiles[0]?.id;
    if (!id) return [];
    const today = new Date().toISOString().split("T")[0];
    try {
      const resp = await fetch(
        `${this.BASE_URL}/?method=presence.getDailyOverview&date=${today}&childId=${id}`,
        { headers: { Cookie: this.sessionCookies } }
      );
      if (!resp.ok) return [];
      const data = (await resp.json()) as { data?: AulaEvent[] };
      const items = data?.data ?? [];
      return items.map((e) => ({
        id: String(e.id),
        title: e.title,
        startTime: e.startDateTime,
        endTime: e.endDateTime,
        childName: String(id),
      }));
    } catch {
      return [];
    }
  }
}
