type Payload = {
  mimeType?: string;
  body?: { data?: string };
  parts?: Payload[];
  headers?: { name: string; value: string }[];
};

function config() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");
  return { clientId, clientSecret };
}

export async function accessToken(refreshToken: string) {
  const { clientId, clientSecret } = config();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });
  if (!response.ok) throw new Error("Google token refresh failed");
  return (await response.json()).access_token as string;
}

async function gmail<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Gmail returned ${response.status}`);
  return response.json();
}

export async function assertTestUser(token: string) {
  const profile = await gmail<{ emailAddress: string }>(token, "profile");
  const allowed = process.env.GMAIL_TEST_USER?.trim().toLowerCase();
  if (!allowed || profile.emailAddress.toLowerCase() !== allowed) throw new Error("Only GMAIL_TEST_USER is allowed");
}

function decode(data = "") {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function body(payload: Payload): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) return decode(payload.body.data);
  for (const part of payload.parts || []) {
    const text = body(part);
    if (text) return text;
  }
  if (payload.body?.data) return decode(payload.body.data).replace(/<[^>]+>/g, " ");
  return "";
}

export async function recentEmails(token: string, limit: number) {
  const list = await gmail<{ messages?: { id: string }[] }>(token, `messages?labelIds=INBOX&maxResults=${limit}`);
  return Promise.all((list.messages || []).map(async ({ id }) => {
    const message = await gmail<{ payload: Payload }>(token, `messages/${id}?format=full`);
    const subject = message.payload.headers?.find(header => header.name.toLowerCase() === "subject")?.value || "No subject";
    return { subject, text: body(message.payload).replace(/\s+/g, " ").trim().slice(0, 6000) };
  }));
}
