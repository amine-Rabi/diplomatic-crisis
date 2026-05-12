"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import NetworkSwitcher from "./NetworkSwitcher";
import GovConnectButton from "./GovConnectButton";

interface Props {
  onEnterLobby: () => void;
  onOpenLeaderboard: () => void;
}

const ISSUE_DATE = new Date().toLocaleDateString("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function MainMenu({ onEnterLobby, onOpenLeaderboard }: Props) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen" style={{ background: "var(--gov-bg)" }}>
      {/* ─── Navy masthead ─── */}
      <header className="gov-masthead">
        <div className="gov-masthead-brand">
          <div className="gov-crest">DC</div>
          <div>
            <div
              style={{
                fontFamily: "Source Serif 4, Georgia, serif",
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 1.1,
              }}
            >
              Bureau of Diplomatic Affairs
            </div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--gov-on-navy-muted)",
                marginTop: 3,
              }}
            >
              Office of Crisis Communications
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NetworkSwitcher />
          {mounted && <GovConnectButton />}
        </div>
      </header>

      <div className="gov-tricolor" />

      {/* ─── Hero ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="ink-rise">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="dept-label">Public Notice</span>
            <span
              style={{
                fontFamily: "IBM Plex Mono",
                fontSize: 11,
                letterSpacing: "0.18em",
                color: "var(--gov-ink-muted)",
                textTransform: "uppercase",
              }}
            >
              Issued {ISSUE_DATE} · Ref. DC-{new Date().getFullYear()}
            </span>
          </div>

          <h1
            className="display"
            style={{
              fontSize: "clamp(44px, 7vw, 86px)",
              lineHeight: 1.02,
              maxWidth: 980,
              marginBottom: 20,
            }}
          >
            Diplomatic Crisis.<br />
            <span style={{ color: "var(--gov-burgundy)" }}>One hundred twenty seconds.</span>{" "}
            <span style={{ color: "var(--gov-ink-muted)" }}>Two hundred eighty characters.</span>
          </h1>

          <p
            className="prose-court"
            style={{
              fontSize: 19,
              color: "var(--gov-ink-soft)",
              maxWidth: 760,
              lineHeight: 1.55,
              marginBottom: 36,
            }}
          >
            A fictional geopolitical crisis breaks. You are the envoy. Compose a
            tweet-length cable in the voice of your nation&apos;s ministry — an
            on-chain panel of AI judges then weighs your wit, plausibility, and
            diplomatic tone. The record is permanent.
          </p>

          {isConnected ? (
            <div className="flex flex-wrap gap-3 mb-14">
              <button onClick={onEnterLobby} className="btn-seal">
                Enter the Situation Room &rarr;
              </button>
              <button onClick={onOpenLeaderboard} className="btn-ghost">
                View Diplomatic Register
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 mb-14">
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--gov-ink-muted)",
                  fontWeight: 600,
                }}
              >
                Identify to the Bureau to proceed →
              </span>
            </div>
          )}
        </div>

        {/* ─── Procedure cards ─── */}
        <section className="mt-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2
              className="display"
              style={{ fontSize: 22, color: "var(--gov-navy)" }}
            >
              Procedure
            </h2>
            <span
              style={{
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--gov-ink-muted)",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
              }}
            >
              01 — 03
            </span>
          </div>
          <div
            style={{
              borderTop: "1px solid var(--gov-rule-strong)",
              borderBottom: "1px solid var(--gov-rule)",
            }}
            className="grid grid-cols-1 md:grid-cols-3"
          >
            {[
              {
                n: "01",
                t: "The Crisis Breaks",
                s: "A fictional geopolitical situation is published to every accredited delegate's desk simultaneously.",
              },
              {
                n: "02",
                t: "Cable Your Reply",
                s: "Two hundred eighty characters. One hundred twenty seconds. In the voice of your ministry. Transmitted on-chain.",
              },
              {
                n: "03",
                t: "Receive the Brief",
                s: "A panel of AI judges scores wit, plausibility, and diplomatic tone under Optimistic Democracy consensus. XP awarded.",
              },
            ].map((a, i) => (
              <article
                key={a.n}
                className="px-7 py-9"
                style={{
                  borderRight: i < 2 ? "1px solid var(--gov-rule)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "IBM Plex Mono",
                    fontSize: 12,
                    color: "var(--gov-gold-deep)",
                    letterSpacing: "0.22em",
                    marginBottom: 12,
                  }}
                >
                  {a.n}
                </div>
                <h3
                  className="display"
                  style={{ fontSize: 22, marginBottom: 10, color: "var(--gov-navy)" }}
                >
                  {a.t}
                </h3>
                <p
                  className="prose-court"
                  style={{ fontSize: 15, color: "var(--gov-ink-soft)", lineHeight: 1.55 }}
                >
                  {a.s}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── Meta strip ─── */}
        <section
          className="mt-16 pt-6"
          style={{ borderTop: "1px solid var(--gov-rule)" }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              ["Ledger", "GenLayer Network"],
              ["Consensus", "Optimistic Democracy"],
              ["Panel", "LLM Validators"],
              ["Record", "Permanent · On-Chain"],
            ].map(([k, v]) => (
              <div key={k}>
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "var(--gov-ink-muted)",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    fontFamily: "Source Serif 4, Georgia, serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--gov-navy)",
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer
        style={{
          background: "var(--gov-navy)",
          color: "var(--gov-on-navy-muted)",
          marginTop: 48,
          padding: "28px 24px",
          fontSize: 12,
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.05em",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="gov-crest" style={{ width: 30, height: 30, fontSize: 11 }}>
              DC
            </div>
            <span>
              Bureau of Diplomatic Affairs · A simulation. All scenarios are fictional.
            </span>
          </div>
          <div
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
            }}
          >
            Deployed on GenLayer
          </div>
        </div>
      </footer>
    </div>
  );
}
