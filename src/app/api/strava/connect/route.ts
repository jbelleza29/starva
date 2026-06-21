import { buildAuthorizeUrl } from "@/lib/strava";

// Redirects the browser to Strava's OAuth consent screen.
export function GET() {
  const url = buildAuthorizeUrl();
  return Response.redirect(url);
}
