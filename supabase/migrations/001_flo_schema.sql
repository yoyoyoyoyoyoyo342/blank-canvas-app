The domain for this project is flo.localilabs.com — use this 
everywhere, not any Replit URL.

Add a Spotify OAuth callback route to the existing Express backend.
Do not change any existing code.

CREATE THIS ROUTE:
File: src/routes/api/spotify/callback.ts

This route handles GET /api/spotify/callback

It should:
1. Read the "code" query param from the request
2. Read the "state" query param and verify it matches what 
   was stored in the session (to prevent CSRF attacks)
3. Exchange the code for an access token and refresh token 
   by making a POST request to:
   https://accounts.spotify.com/api/token
   with these params:
   - grant_type: authorization_code
   - code: the code from step 1
   - redirect_uri: https://flo.localilabs.com/api/spotify/callback
   - client_id: process.env.SPOTIFY_CLIENT_ID
   - client_secret: process.env.SPOTIFY_CLIENT_SECRET
4. Save the access_token and refresh_token to the 
   spotify_connections table in Supabase for the logged 
   in user
5. On success redirect to: https://flo.localilabs.com/settings
6. On failure redirect to: 
   https://flo.localilabs.com/settings?error=spotify_failed

Also update the existing Spotify connect button/link in 
the settings screen so it points to the Spotify auth URL:
https://accounts.spotify.com/authorize?
  client_id={SPOTIFY_CLIENT_ID}
  &response_type=code
  &redirect_uri=https://flo.localilabs.com/api/spotify/callback
  &scope=user-read-private user-top-read playlist-read-private
  &state={random_state_string}

Store the state string in the user session before redirecting 
so it can be verified in the callback.

RULES
- TypeScript, no any types
- No comments in code
- All credentials via environment variables
- Handle errors gracefully
