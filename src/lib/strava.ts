/**
 * Strava API client — OAuth token exchange/refresh and activity fetching.
 *
 * This is a pure HTTP layer with no database access; callers persist tokens via
 * the StravaAccount model. Reads STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET /
 * STRAVA_REDIRECT_URI from the environment.
 *
 * Docs: https://developers.strava.com/docs/authentication/
 */

const OAUTH_BASE = "https://www.strava.com/oauth";
const API_BASE = "https://www.strava.com/api/v3";

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix seconds
  athleteId?: number; // present on the initial code exchange, not on refresh
}

function credentials() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET are not set in the environment.");
  }
  return { clientId, clientSecret };
}

/** Build the URL we redirect the user to so they can authorize the app. */
export function buildAuthorizeUrl(): string {
  const { clientId } = credentials();
  const redirectUri = process.env.STRAVA_REDIRECT_URI;
  if (!redirectUri) throw new Error("STRAVA_REDIRECT_URI is not set in the environment.");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all", // read_all so we can see private activities too
  });
  return `${OAUTH_BASE}/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
}

async function postToken(body: Record<string, string>): Promise<StravaTokens> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(`${OAUTH_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, ...body }),
  });
  if (!res.ok) {
    throw new Error(`Strava token request failed (${res.status}): ${await res.text()}`);
  }
  const data: TokenResponse = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athleteId: data.athlete?.id,
  };
}

/** Exchange the authorization code from the OAuth redirect for tokens. */
export function exchangeCodeForToken(code: string): Promise<StravaTokens> {
  return postToken({ code, grant_type: "authorization_code" });
}

/** Trade a refresh token for a fresh access token (athleteId is not returned here). */
export function refreshAccessToken(refreshToken: string): Promise<StravaTokens> {
  return postToken({ grant_type: "refresh_token", refresh_token: refreshToken });
}

/** A summary activity as returned by GET /athlete/activities. */
export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  average_heartrate?: number;
  map?: { summary_polyline?: string };
}

/** Fetch one page of the athlete's activities (newest first). */
export async function fetchActivities(
  accessToken: string,
  page = 1,
  perPage = 100,
): Promise<StravaActivity[]> {
  const res = await fetch(`${API_BASE}/athlete/activities?per_page=${perPage}&page=${page}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Strava activities request failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/** Map a Strava activity onto our Activity schema shape. */
export function mapStravaActivity(a: StravaActivity) {
  return {
    stravaId: a.id,
    name: a.name,
    type: a.sport_type ?? a.type,
    startDate: new Date(a.start_date),
    distance: a.distance,
    movingTime: a.moving_time,
    elapsedTime: a.elapsed_time,
    totalElevationGain: a.total_elevation_gain ?? 0,
    averageSpeed: a.average_speed ?? 0,
    averageHeartrate: a.average_heartrate,
    summaryPolyline: a.map?.summary_polyline || undefined,
  };
}
