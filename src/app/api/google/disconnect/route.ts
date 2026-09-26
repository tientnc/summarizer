import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { open } from "@/lib/crypto";

export const runtime = "nodejs";

export async function POST() {
  const store = await cookies();
  const stored = store.get("gmail_token")?.value;
  if (stored) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(open(stored))}`, {
      method: "POST"
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("gmail_token", "", { maxAge: 0, path: "/" });
  return response;
}
