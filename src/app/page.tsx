"use client";

import { FormEvent, useState } from "react";

type PublicResult = {
  summary: string;
  items: { title: string; source: string; url: string }[];
};

type EmailResult = {
  mode: string;
  emails: { subject: string; summary: string }[];
};

export default function Home() {
  const [source, setSource] = useState("cross");
  const [query, setQuery] = useState("AI news today");
  const [publicResult, setPublicResult] = useState<PublicResult>();
  const [emailResult, setEmailResult] = useState<EmailResult>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function summarize(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, query, limit: 3 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPublicResult(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadEmail() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/email");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEmailResult(data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    await fetch("/api/google/disconnect", { method: "POST" });
    setEmailResult(undefined);
  }

  return (
    <main>
      <header>
        <p className="eyebrow">PRIVATE BETA</p>
        <h1>Daily signal, minus the noise.</h1>
        <p>Gemma summarizes public sources. Email stays outside AI APIs.</p>
      </header>

      <section>
        <h2>Public sources</h2>
        <form onSubmit={summarize}>
          <select value={source} onChange={event => setSource(event.target.value)} aria-label="Source">
            <option value="cross">News + YouTube</option>
            <option value="news">News</option>
            <option value="youtube">YouTube</option>
          </select>
          <input value={query} onChange={event => setQuery(event.target.value)} maxLength={200} aria-label="Topic" />
          <button disabled={busy}>{busy ? "Working…" : "Summarize"}</button>
        </form>
        {publicResult && <article>
          <div className="summary">{publicResult.summary}</div>
          <ul>{publicResult.items.map(item =>
            <li key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>
          )}</ul>
        </article>}
      </section>

      <section>
        <div className="sectionTitle">
          <div><h2>Test Gmail</h2><p>Local extractive summaries only.</p></div>
          <span className="safe">NO AI API</span>
        </div>
        <div className="actions">
          <a className="button secondary" href="/api/google/connect">Connect test account</a>
          <button className="secondary" onClick={loadEmail} disabled={busy}>Summarize inbox</button>
          <button className="textButton" onClick={disconnect}>Disconnect</button>
        </div>
        {emailResult && <article>
          <ul>{emailResult.emails.map((email, index) =>
            <li className="email" key={index}><strong>{email.subject}</strong><p>{email.summary}</p></li>
          )}</ul>
        </article>}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
    </main>
  );
}
