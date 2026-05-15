import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { GetGmailSummariesQueryParams } from "@workspace/api-zod";

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface GmailMessage {
  id: string;
  payload?: {
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string };
    parts?: Array<{ mimeType: string; body?: { data?: string } }>;
  };
  internalDate?: string;
}

interface GmailListResponse {
  messages?: Array<{ id: string }>;
  error?: { message: string };
}

function decodeBase64(encoded: string): string {
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractBody(message: GmailMessage): string {
  const payload = message.payload;
  if (!payload) return "";

  if (payload.body?.data) {
    return decodeBase64(payload.body.data).slice(0, 500);
  }

  const textPart = payload.parts?.find((p) => p.mimeType === "text/plain");
  if (textPart?.body?.data) {
    return decodeBase64(textPart.body.data).slice(0, 500);
  }

  return "";
}

function getHeader(message: GmailMessage, name: string): string {
  return (
    message.payload?.headers?.find(
      (h) => h.name.toLowerCase() === name.toLowerCase()
    )?.value ?? ""
  );
}

router.get("/gmail/summaries", async (req, res) => {
  const parsed = GetGmailSummariesQueryParams.safeParse(req.query);
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

  try {
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?` +
        new URLSearchParams({
          q: "is:unread",
          maxResults: "5",
        }),
      {
        headers: { Authorization: `Bearer ${googleToken}` },
      }
    );

    if (!listResponse.ok) {
      if (listResponse.status === 401) {
        res.status(401).json({ error: "Gmail access denied" });
        return;
      }
      throw new Error(`Gmail API error: ${listResponse.status}`);
    }

    const listData = (await listResponse.json()) as GmailListResponse;
    const messageIds = (listData.messages ?? []).slice(0, 5);

    if (messageIds.length === 0) {
      res.json([]);
      return;
    }

    const messages = await Promise.all(
      messageIds.map(async ({ id }) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
          { headers: { Authorization: `Bearer ${googleToken}` } }
        );
        if (!msgResponse.ok) return null;
        return (await msgResponse.json()) as GmailMessage;
      })
    );

    const validMessages = messages.filter((m): m is GmailMessage => m !== null);

    const summaries = await Promise.all(
      validMessages.slice(0, 3).map(async (message) => {
        const from = getHeader(message, "from");
        const subject = getHeader(message, "subject") || "(no subject)";
        const body = extractBody(message);
        const receivedAt = message.internalDate
          ? new Date(parseInt(message.internalDate)).toISOString()
          : new Date().toISOString();

        let summary = subject;
        if (body) {
          try {
            const completion = await groq.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content:
                    "Summarise this email in one short sentence (max 15 words). Be direct and factual. No fluff.",
                },
                {
                  role: "user",
                  content: `Subject: ${subject}\n\n${body}`,
                },
              ],
              max_tokens: 60,
            });
            summary =
              completion.choices[0]?.message?.content?.trim() ?? subject;
          } catch {
            summary = subject;
          }
        }

        return { id: message.id, from, subject, summary, receivedAt };
      })
    );

    res.json(summaries);
  } catch {
    res.status(500).json({ error: "Failed to fetch Gmail summaries" });
  }
});

export default router;
