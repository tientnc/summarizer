import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { open } from "@/lib/crypto";
import { summarizeEmailLocally } from "@/lib/email-summary";
import { accessToken, assertTestUser, recentEmails } from "@/lib/gmail";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stored = (await cookies()).get("gmail_token")?.value;
    if (!stored) return NextResponse.json({ error: "Connect the test Gmail account" }, { status: 401 });
    const token = await accessToken(open(stored));
    await assertTestUser(token);
    const emails = await recentEmails(token, 5);
    return NextResponse.json({
      mode: "local-only",
      emails: emails.map(email => ({
        subject: email.subject,
        summary: summarizeEmailLocally(email.text)
      }))
    });
  } catch {
    return NextResponse.json({ error: "Gmail access failed" }, { status: 401 });
  }
}
