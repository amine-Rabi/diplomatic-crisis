"use client";

import { useAccount } from "wagmi";
import type { JudgingResult } from "@/lib/genlayer";

interface Props {
  result: JudgingResult;
  onDone: () => void;
}

const RANK_LABEL: Record<number, string> = {
  1: "Lead Diplomat",
  2: "Senior Envoy",
  3: "Attaché",
};

export default function Results({ result, onDone }: Props) {
  const { address } = useAccount();
  const me = address?.toLowerCase();

  return (
    <div className="page-root min-h-screen px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="doc-card px-8 sm:px-14 py-12 ink-rise relative">
          {/* CLASSIFIED corner */}
          <div className="absolute right-6 top-6">
            <div className="classified-stamp">Verified</div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="stamp mb-3">Panel Communiqué</div>
            <div className="rule-fancy mb-4">
              <span style={{ fontFamily: "Oswald", fontSize: 11, letterSpacing: "0.4em" }}>
                ◆
              </span>
            </div>
            <h1
              className="display"
              style={{ fontSize: 64, color: "var(--dc-ink)" }}
            >
              Verdict
            </h1>
            <div className="rule-fancy mt-4">
              <span style={{ fontFamily: "Oswald", fontSize: 11, letterSpacing: "0.4em" }}>
                ◆
              </span>
            </div>
            <p
              className="prose-court italic mt-4"
              style={{ fontSize: 17, color: "var(--dc-ink-muted)" }}
            >
              The chamber recognises Delegate{" "}
              <span
                style={{
                  fontFamily: "IBM Plex Mono",
                  fontSize: 14,
                  color: "var(--dc-classified)",
                  letterSpacing: "0.1em",
                }}
              >
                {shorten(result.winner)}
              </span>{" "}
              as having prevailed.
            </p>
          </div>

          {/* Embassy seal */}
          <div className="flex justify-center mb-10">
            <div className="wax-seal">DC</div>
          </div>

          {/* Rankings */}
          <div className="space-y-4">
            {result.results.map((p) => {
              const isMe = p.address.toLowerCase() === me;
              const label = RANK_LABEL[p.rank] ?? `Rank ${p.rank}`;
              return (
                <div
                  key={p.address}
                  className="p-5"
                  style={{
                    background: isMe ? "rgba(182,52,42,0.07)" : "rgba(255, 250, 230, 0.5)",
                    border: "1px solid var(--dc-ink)",
                    borderLeft: isMe ? "5px solid var(--dc-classified)" : "1px solid var(--dc-ink)",
                  }}
                >
                  <div className="flex items-center gap-5 mb-3">
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: "50%",
                        background:
                          p.rank === 1
                            ? "var(--dc-classified)"
                            : p.rank === 2
                            ? "var(--dc-gold-deep)"
                            : p.rank === 3
                            ? "var(--dc-flag-blue)"
                            : "var(--dc-ink-soft)",
                        color: "var(--dc-paper)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Oswald",
                        boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.25), 0 4px 8px -4px rgba(0,0,0,0.4)",
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
                        {p.rank}
                      </div>
                      <div style={{ fontSize: 7, letterSpacing: "0.2em", marginTop: 2 }}>
                        RANK
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontFamily: "Oswald",
                          fontSize: 11,
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "var(--dc-ink-muted)",
                          marginBottom: 4,
                        }}
                      >
                        {label}{isMe ? " · You" : ""}
                      </div>
                      <div
                        style={{
                          fontFamily: "IBM Plex Mono",
                          fontSize: 14,
                          color: "var(--dc-ink)",
                          letterSpacing: "0.06em",
                          marginBottom: 4,
                        }}
                      >
                        {shorten(p.address)}
                      </div>
                      <div
                        className="prose-court"
                        style={{ fontSize: 13, color: "var(--dc-ink-muted)" }}
                      >
                        Wit <b>{p.wit}</b> · Plausibility <b>{p.plausibility}</b> · Tone{" "}
                        <b>{p.diplomatic_tone}</b>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className="display"
                        style={{ fontSize: 38, lineHeight: 1, color: "var(--dc-ink)" }}
                      >
                        {p.total}
                      </div>
                      <div
                        style={{
                          fontFamily: "IBM Plex Mono",
                          fontSize: 10,
                          color: "var(--dc-ink-muted)",
                          letterSpacing: "0.2em",
                        }}
                      >
                        / 100
                      </div>
                    </div>

                    <div className="text-right" style={{ borderLeft: "1px solid var(--dc-rule)", paddingLeft: 18 }}>
                      <div
                        className="display"
                        style={{ fontSize: 24, color: "var(--dc-classified)" }}
                      >
                        +{p.xp_earned}
                      </div>
                      <div
                        style={{
                          fontFamily: "IBM Plex Mono",
                          fontSize: 10,
                          color: "var(--dc-ink-muted)",
                          letterSpacing: "0.2em",
                        }}
                      >
                        XP
                      </div>
                    </div>
                  </div>
                  <div
                    className="prose-court italic"
                    style={{
                      fontSize: 15,
                      paddingLeft: 4,
                      borderTop: "1px dashed var(--dc-rule)",
                      paddingTop: 10,
                    }}
                  >
                    &ldquo;{p.verdict}&rdquo;
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <button onClick={onDone} className="btn-seal">
              Return to the Bureau
            </button>
          </div>

          <div className="mt-8 pt-5 border-t flex items-center justify-between" style={{ borderColor: "var(--dc-rule)" }}>
            <span
              style={{
                fontFamily: "IBM Plex Mono",
                color: "var(--dc-ink-muted)",
                letterSpacing: "0.2em",
                fontSize: 10,
              }}
            >
              ENTERED INTO THE RECORD · GENLAYER
            </span>
            <span
              style={{
                fontFamily: "Oswald",
                color: "var(--dc-ink-muted)",
                letterSpacing: "0.25em",
                fontSize: 10,
              }}
            >
              CONSENSUS REACHED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function shorten(addr: string): string {
  if (!addr) return "0x…";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
