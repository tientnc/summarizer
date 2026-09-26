import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { open, seal } from "@/lib/crypto";
import { assertTestUser } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const home = new URL("/", url.origin);
  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const storedState = (await cookies()).get("oauth_state")?.value;
    if (!code || !state || !storedState || open(storedState) !== state) throw new Error();

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        code,
        grant_type: "authorization_code",
        redirect_uri: `${url.origin}/api/google/callback`
      })
    });
    if (!tokenResponse.ok) throw new Error();
    const tokens = await tokenResponse.json();
    if (!tokens.refresh_token || !tokens.access_token) throw new Error();
    await assertTestUser(tokens.access_token);

    home.searchParams.set("gmail", "connected");
    const response = NextResponse.redirect(home);
    response.cookies.set("gmail_token", seal(tokens.refresh_token), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 604800,
      path: "/"
    });
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return response;
  } catch {
    home.searchParams.set("gmail", "error");
    const response = NextResponse.redirect(home);
    response.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return response;
  }
}
