import type { NextRequest } from "next/server";
import { exchangeCodeForToken } from "@/lib/strava";
import { connectToDatabase } from "@/lib/db";
import { StravaAccount } from "@/lib/models/StravaAccount";

/**
 * Strava redirects here after the user approves (or denies) the app.
 * ?code=...  on approval, ?error=access_denied on denial.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = new URL(request.url).origin;

  const error = searchParams.get("error");
  if (error) {
    return Response.redirect(`${origin}/?strava=denied`);
  }

  const code = searchParams.get("code");
  if (!code) {
    return Response.redirect(`${origin}/?strava=error`);
  }

  try {
    const tokens = await exchangeCodeForToken(code);

    await connectToDatabase();
    await StravaAccount.updateOne(
      { athleteId: tokens.athleteId },
      {
        $set: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      },
      { upsert: true },
    );

    return Response.redirect(`${origin}/?strava=connected`);
  } catch (err) {
    console.error("Strava callback error:", err);
    return Response.redirect(`${origin}/?strava=error`);
  }
}
