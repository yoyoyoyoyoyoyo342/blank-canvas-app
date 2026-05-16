import { Router } from "express";
import { randomBytes } from "crypto";
import { supabase, getUserFromToken } from "../lib/supabase.js";

const router = Router();

interface StateEntry {
  accessToken: string;
  expiresAt: number;
}

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  error?: string;
}

const stateStore = new Map<string, StateEntry>();
const STATE_TTL_MS = 10 * 60 * 1000;

function cleanExpiredStates(): void {
  const now = Date.now();
  for (const [key, entry] of stateStore.entries()) {
    if (entry.expiresAt < now) {
      stateStore.delete(key);
    }
  }
}

router.get("/spotify/secure-connect-url", (req, res) => {
  const accessToken = req.query["access_token"] as string;
  if (!accessToken) {
    res.status(400).json({ error: "Missing access_token" });
    return;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "Spotify not configured" });
    return;
  }

  cleanExpiredStates();

  const state = randomBytes(16).toString("hex");
  stateStore.set(state, { accessToken, expiresAt: Date.now() + STATE_TTL_MS });

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: "https://flo.localilabs.com/api/spotify/callback",
    scope: "user-read-private user-top-read playlist-read-private",
    state,
  });

  res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
});

router.get("/spotify/callback", async (req, res) => {
  const code = req.query["code"] as string | undefined;
  const state = req.query["state"] as string | undefined;
  const error = req.query["error"] as string | undefined;

  if (error || !code || !state) {
    res.redirect("https://flo.localilabs.com/settings?error=spotify_failed");
    return;
  }

  cleanExpiredStates();

  const entry = stateStore.get(state);
  if (!entry || entry.expiresAt < Date.now()) {
    stateStore.delete(state);
    res.redirect("https://flo.localilabs.com/settings?error=spotify_failed");
    return;
  }

  stateStore.delete(state);

  const { accessToken } = entry;

  const user = await getUserFromToken(accessToken);
  if (!user) {
    res.redirect("https://flo.localilabs.com/settings?error=spotify_failed");
    return;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.redirect("https://flo.localilabs.com/settings?error=spotify_failed");
    return;
  }

  const tokenResp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://flo.localilabs.com/api/spotify/callback",
    }),
  });

  if (!tokenResp.ok) {
    res.redirect("https://flo.localilabs.com/settings?error=spotify_failed");
    return;
  }

  const tokens = (await tokenResp.json()) as SpotifyTokenResponse;

  if (tokens.error || !tokens.access_token || !tokens.refresh_token) {
    res.redirect("https://flo.localilabs.com/settings?error=spotify_failed");
    return;
  }

  const { error: dbError } = await supabase
    .from("spotify_connections")
    .upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      },
      { onConflict: "user_id" }
    );

  if (dbError) {
    res.redirect("https://flo.localilabs.com/settings?error=spotify_failed");
    return;
  }

  res.redirect("https://flo.localilabs.com/settings");
});

export default router;
