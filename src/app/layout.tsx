import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summarizer Beta",
  description: "Concise public-source and local-only email summaries."
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
