# Summarizer Beta

Next.js app for news, YouTube, and one test Gmail account.

- Public content: Gemma through Google AI Studio.
- Email: local extractive summaries; email cannot enter the AI route.
- YouTube: official search API; captions are best-effort, then descriptions.

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. Set the Google OAuth redirect URI to `http://localhost:3000/api/google/callback`.

Use only a dedicated mailbox containing test data.
