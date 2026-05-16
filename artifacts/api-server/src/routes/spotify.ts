import { Router } from "express";
import Groq from "groq-sdk";
import { supabase, getUserFromToken } from "../lib/supabase.js";
import {
  ConnectSpotifyQueryParams,
  ConnectSpotifyBody,
  GetSpotifyRecommendationQueryParams,
} from "@workspace/api-zod";

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface SpotifyArtist { name: string }
interface SpotifyTrack { name: string; artists: SpotifyArtist[] }
interface SpotifyPlaylist { id: string; name: string; uri: string }
interface SpotifyTopArtistsResponse { items?: SpotifyArtist[] }
interface SpotifyTopTracksResponse { items?: SpotifyTrack[] }
interface SpotifyPlaylistsResponse { items?: SpotifyPlaylist[] }
interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

async function refreshSpotifyToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });

  if (!resp.ok) return null;
  const data = (await resp.json()) as SpotifyTokenResponse;
  return data.access_token ?? null;
}

router.get("/spotify/auth-url", (req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    res.status(500).json({ error: "Spotify not configured" });
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "user-read-private user-top-read playlist-read-private",
    state: req.query["state"] as string ?? "",
  });

  res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
});

router.get("/spotify/callback", async (req, res) => {
  const code = req.query["code"] as string;
  const accessToken = req.query["state"] as string;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!code || !accessToken || !clientId || !clientSecret || !redirectUri) {
    res.status(400).json({ error: "Missing parameters" });
    return;
  }

  const tokenResp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });

  if (!tokenResp.ok) { res.status(400).json({ error: "Token exchange failed" }); return; }

  const tokens = (await tokenResp.json()) as SpotifyTokenResponse;
  const user = await getUserFromToken(accessToken);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  await supabase.from("spotify_connections").upsert(
    { user_id: user.id, access_token: tokens.access_token, refresh_token: tokens.refresh_token ?? "" },
    { onConflict: "user_id" }
  );

  res.redirect(`/?spotify_connected=true`);
});

router.post("/spotify/connect", async (req, res) => {
  const parsed = ConnectSpotifyQueryParams.safeParse(req.query);
  const body = ConnectSpotifyBody.safeParse(req.body);
  if (!parsed.success || !body.success) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { error } = await supabase.from("spotify_connections").upsert(
    { user_id: user.id, access_token: body.data.access_token, refresh_token: body.data.refresh_token },
    { onConflict: "user_id" }
  );
  if (error) { res.status(500).json({ error: "Failed to save tokens" }); return; }

  res.json({ success: true, message: "Spotify connected" });
});

router.get("/spotify/recommend", async (req, res) => {
  const parsed = GetSpotifyRecommendationQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Missing access_token" }); return; }
  const user = await getUserFromToken(parsed.data.access_token);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { data: conn } = await supabase
    .from("spotify_connections")
    .select("access_token, refresh_token")
    .eq("user_id", user.id)
    .single();

  if (!conn) { res.status(404).json({ error: "Spotify not connected" }); return; }

  let spotifyToken = conn.access_token;

  const testResp = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${spotifyToken}` },
  });

  if (testResp.status === 401) {
    const refreshed = await refreshSpotifyToken(conn.refresh_token);
    if (!refreshed) { res.status(401).json({ error: "Spotify token expired" }); return; }
    spotifyToken = refreshed;
    await supabase.from("spotify_connections").upsert(
      { user_id: user.id, access_token: refreshed, refresh_token: conn.refresh_token },
      { onConflict: "user_id" }
    );
  }

  try {
    const [artistsResp, tracksResp, playlistsResp] = await Promise.all([
      fetch("https://api.spotify.com/v1/me/top/artists?limit=5&time_range=short_term", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      }),
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      }),
      fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
        headers: { Authorization: `Bearer ${spotifyToken}` },
      }),
    ]);

    const artists = artistsResp.ok ? ((await artistsResp.json()) as SpotifyTopArtistsResponse).items ?? [] : [];
    const tracks = tracksResp.ok ? ((await tracksResp.json()) as SpotifyTopTracksResponse).items ?? [] : [];
    const playlists = playlistsResp.ok ? ((await playlistsResp.json()) as SpotifyPlaylistsResponse).items ?? [] : [];

    if (playlists.length === 0) {
      res.json({ playlists: [], context: "no playlists found" });
      return;
    }

    const today = new Date();
    const hour = today.getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    const artistNames = artists.slice(0, 5).map((a) => a.name).join(", ");
    const trackNames = tracks.slice(0, 5).map((t) => `${t.name} by ${t.artists[0]?.name}`).join(", ");
    const playlistNames = playlists.map((p) => `"${p.name}" (id: ${p.id})`).join(", ");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are flo., a music assistant. Pick 2-3 playlists from the user's own list that match their day. Return a JSON object: { playlists: [{ id, name, reason }], context: string }. Only reference playlists from the provided list. Be warm and brief.",
        },
        {
          role: "user",
          content: `Time of day: ${timeOfDay}. Top artists: ${artistNames}. Top tracks: ${trackNames}. Available playlists: ${playlistNames}. Pick 2-3 playlists that fit this ${timeOfDay}.`,
        },
      ],
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { res.json({ playlists: [], context: "" }); return; }

    const result = JSON.parse(jsonMatch[0]) as {
      playlists: Array<{ id: string; name: string; reason: string }>;
      context: string;
    };

    const enriched = result.playlists.map((p) => {
      const found = playlists.find((pl) => pl.id === p.id || pl.name === p.name);
      return {
        id: p.id,
        name: p.name,
        reason: p.reason,
        uri: found?.uri ?? `spotify:playlist:${p.id}`,
      };
    });

    res.json({ playlists: enriched, context: result.context });
  } catch {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

export default router;
