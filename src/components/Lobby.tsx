"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { NetworkService, PlayerInfo } from "@/lib/network";
import { SCENARIOS, rollScenario } from "@/data/scenarios";
import type { ScenarioMeta } from "@/lib/genlayer";
import type { GameContext } from "@/app/page";

interface Props {
  onLeave: () => void;
  onStart: (ctx: GameContext) => void;
}

const ROUND_OPTIONS = [1, 2, 3, 4, 5];
const DURATION_OPTIONS = [60, 90, 120, 180, 240];

type Tab = "open" | "join";

export default function Lobby({ onLeave, onStart }: Props) {
  const { address } = useAccount();
  const [mode, setMode] = useState<"choose" | "host" | "join">("choose");
  const [tab, setTab] = useState<Tab>("open");

  // Host config
  const [rounds, setRounds] = useState<number>(3);
  const [duration, setDuration] = useState<number>(120);

  const [roomCode, setRoomCode] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const networkRef = useRef<NetworkService | null>(null);
  const sessionCfgRef = useRef<{ rounds: number; duration: number }>({ rounds: 3, duration: 120 });

  const me: PlayerInfo | null = useMemo(() => {
    if (!address) return null;
    return {
      address,
      peerId: networkRef.current?.myPeerId ?? "",
      name: `${address.slice(0, 6)}…${address.slice(-4)}`,
    };
  }, [address]);

  useEffect(() => {
    return () => {
      networkRef.current?.destroy();
      networkRef.current = null;
    };
  }, []);

  const playersRef = useRef<PlayerInfo[]>(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const startHost = async () => {
    if (!me) return;
    setError(null);
    setStatus("Convening the situation room…");
    sessionCfgRef.current = { rounds, duration };
    const net = new NetworkService();
    networkRef.current = net;

    try {
      const code = await net.createRoom();
      const host: PlayerInfo = { ...me, peerId: net.myPeerId };
      setPlayers([host]);
      setRoomCode(code);
      setMode("host");
      setStatus("");

      net.onMessage((msg, from) => {
        if (msg.type === "PLAYER_JOIN") {
          const p = msg.payload as PlayerInfo;
          setPlayers((prev) => {
            if (prev.some((x) => x.address.toLowerCase() === p.address.toLowerCase())) return prev;
            const next = [...prev, { ...p, peerId: from }];
            net.broadcast({ type: "PLAYER_LIST", payload: next });
            return next;
          });
        }
      });

      net.onDisconnected((peerId) => {
        setPlayers((prev) => {
          const next = prev.filter((p) => p.peerId !== peerId);
          net.broadcast({ type: "PLAYER_LIST", payload: next });
          return next;
        });
      });
    } catch (e) {
      console.error(e);
      setError("The situation room failed to come online. Try again.");
      setStatus("");
    }
  };

  const joinRoom = async () => {
    if (!me || !joinInput) return;
    setError(null);
    setStatus("Securing the line…");
    const net = new NetworkService();
    networkRef.current = net;

    try {
      const code = joinInput.toUpperCase().trim();
      await net.joinRoom(code);
      setRoomCode(code);
      setMode("join");
      setStatus("");

      net.onMessage((msg) => {
        if (msg.type === "PLAYER_LIST") {
          setPlayers(msg.payload as PlayerInfo[]);
        }
        if (msg.type === "GAME_START") {
          const { scenarios, gameId, roundSeconds } = msg.payload as {
            scenarios: ScenarioMeta[];
            gameId: string;
            roundSeconds: number;
          };
          onStart({
            gameId,
            rounds: scenarios,
            players: playersRef.current,
            network: net,
            isHost: false,
            roundSeconds: roundSeconds ?? 120,
          });
        }
      });

      setTimeout(() => {
        net.broadcast({
          type: "PLAYER_JOIN",
          payload: { ...me, peerId: net.myPeerId },
        });
      }, 400);
    } catch (e) {
      console.error(e);
      setError("The bureau cannot verify your credentials. Check the briefing code.");
      setStatus("");
    }
  };

  const hostStartGame = () => {
    const net = networkRef.current;
    if (!net || players.length < 2) return;
    const cfg = sessionCfgRef.current;
    const used: string[] = [];
    const scenarios: ScenarioMeta[] = [];
    for (let i = 1; i <= cfg.rounds; i++) {
      const s = rollScenario(SCENARIOS, used);
      used.push(s);
      scenarios.push({ round: i, scenario: s });
    }
    const gameId = `dc-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
    net.broadcast({
      type: "GAME_START",
      payload: { scenarios, gameId, roundSeconds: cfg.duration },
    });
    onStart({
      gameId,
      rounds: scenarios,
      players,
      network: net,
      isHost: true,
      roundSeconds: cfg.duration,
    });
  };

  // ────────────────────────────────────────────────────────────────────
  // CHOOSE — single console panel with tab switch
  // ────────────────────────────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <div className="page-root min-h-screen">
        {/* Slim masthead */}
        <header className="gov-masthead" style={{ padding: "10px 24px" }}>
          <div className="gov-masthead-brand">
            <div className="gov-crest" style={{ width: 36, height: 36, fontSize: 13 }}>DC</div>
            <div>
              <div
                style={{
                  fontFamily: "Source Serif 4, Georgia, serif",
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                Situation Room Access
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "var(--gov-on-navy-muted)",
                  marginTop: 2,
                }}
              >
                Bureau of Diplomatic Affairs
              </div>
            </div>
          </div>

          <button
            onClick={onLeave}
            style={{
              padding: "7px 14px",
              background: "transparent",
              border: "1px solid var(--gov-on-navy-muted)",
              borderRadius: 2,
              fontFamily: "Inter, sans-serif",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--gov-on-navy)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Stand Down
          </button>
        </header>
        <div className="gov-tricolor" />

        <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14">
          <div className="ink-rise">
            <div className="dept-label mb-3">Access Console</div>
            <h1 className="display" style={{ fontSize: 42, marginBottom: 8 }}>
              Open the channel, or enter one.
            </h1>
            <p
              className="prose-court"
              style={{ color: "var(--gov-ink-muted)", maxWidth: 600, marginBottom: 28 }}
            >
              You may initiate a new emergency briefing from this terminal, or join
              one already in progress with a valid briefing code.
            </p>

            {/* Tabbed control */}
            <div
              role="tablist"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom: "1px solid var(--gov-rule-strong)",
              }}
            >
              {([
                ["open", "Initiate New Briefing", "Host"],
                ["join", "Join Active Briefing", "Delegate"],
              ] as const).map(([id, label, role]) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(id)}
                    style={{
                      textAlign: "left",
                      padding: "14px 18px",
                      background: active ? "var(--gov-surface)" : "transparent",
                      border: "1px solid var(--gov-rule)",
                      borderBottom: active
                        ? "1px solid var(--gov-surface)"
                        : "1px solid var(--gov-rule-strong)",
                      borderTopColor: active ? "var(--gov-navy)" : "var(--gov-rule)",
                      borderTopWidth: active ? 3 : 1,
                      marginBottom: -1,
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color: active ? "var(--gov-burgundy)" : "var(--gov-ink-muted)",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {role} Mode
                    </div>
                    <div
                      style={{
                        fontFamily: "Source Serif 4, Georgia, serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: active ? "var(--gov-navy)" : "var(--gov-ink-muted)",
                      }}
                    >
                      {label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Panel */}
            <div
              style={{
                background: "var(--gov-surface)",
                border: "1px solid var(--gov-rule-strong)",
                borderTop: "none",
                padding: "32px 28px",
              }}
            >
              {tab === "open" ? (
                <div>
                  <SettingsField
                    label="Rounds"
                    hint="How many crisis briefings to issue in this session."
                  >
                    <Segmented
                      value={rounds}
                      options={ROUND_OPTIONS}
                      onChange={setRounds}
                      formatter={(n) => String(n)}
                    />
                  </SettingsField>

                  <SettingsField
                    label="Cable Window"
                    hint="Time delegates have to compose each dispatch."
                  >
                    <Segmented
                      value={duration}
                      options={DURATION_OPTIONS}
                      onChange={setDuration}
                      formatter={(n) => `${n}s`}
                    />
                  </SettingsField>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 28,
                      padding: "18px 0",
                      borderTop: "1px solid var(--gov-rule)",
                      marginTop: 8,
                    }}
                  >
                    <Summary k="Rounds" v={String(rounds)} />
                    <Summary k="Per round" v={`${duration}s`} />
                    <Summary k="Max length" v="280 ch" />
                    <Summary k="Min players" v="2" />
                  </div>

                  <button onClick={startHost} className="btn-seal" style={{ width: "100%" }}>
                    Open the Situation Room  →
                  </button>
                </div>
              ) : (
                <div>
                  <SettingsField
                    label="Briefing Code"
                    hint="Six-character code issued by the session chair."
                  >
                    <input
                      value={joinInput}
                      onChange={(e) => setJoinInput(e.target.value.toUpperCase().slice(0, 6))}
                      placeholder="— — — — — —"
                      maxLength={6}
                      className="ink-input"
                      style={{
                        textAlign: "center",
                        fontSize: 24,
                        padding: "16px 14px",
                        letterSpacing: "0.4em",
                      }}
                    />
                  </SettingsField>

                  <div
                    style={{
                      padding: "14px 16px",
                      background: "var(--gov-surface-2)",
                      border: "1px solid var(--gov-rule)",
                      marginBottom: 20,
                      fontSize: 13,
                      color: "var(--gov-ink-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    Your delegation will be admitted to the chamber once the chair
                    seats you. Session parameters (round count, cable window) are
                    dictated by the host.
                  </div>

                  <button
                    onClick={joinRoom}
                    disabled={joinInput.length !== 6}
                    className="btn-seal"
                    style={{ width: "100%" }}
                  >
                    Request Admittance  →
                  </button>
                </div>
              )}
            </div>

            {status && (
              <div
                className="mt-6 prose-court italic"
                style={{ color: "var(--gov-ink-muted)", fontSize: 14 }}
              >
                {status}
              </div>
            )}
            {error && (
              <div
                className="mt-6 px-4 py-3"
                style={{
                  background: "rgba(138,32,38,0.06)",
                  border: "1px solid rgba(138,32,38,0.4)",
                  color: "var(--gov-burgundy-deep)",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // BRIEFING ISSUED — seating chamber
  // ────────────────────────────────────────────────────────────────────
  const cfg = sessionCfgRef.current;

  const copyCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="page-root min-h-screen">
      <header className="gov-masthead" style={{ padding: "10px 24px" }}>
        <div className="gov-masthead-brand">
          <div className="gov-crest" style={{ width: 36, height: 36, fontSize: 13 }}>DC</div>
          <div>
            <div
              style={{
                fontFamily: "Source Serif 4, Georgia, serif",
                fontSize: 14,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              {mode === "host" ? "Briefing Issued" : "Awaiting Chair"}
            </div>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "var(--gov-on-navy-muted)",
                marginTop: 2,
              }}
            >
              Bureau of Diplomatic Affairs
            </div>
          </div>
        </div>
        <button
          onClick={onLeave}
          style={{
            padding: "7px 14px",
            background: "transparent",
            border: "1px solid var(--gov-on-navy-muted)",
            borderRadius: 2,
            fontFamily: "Inter, sans-serif",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--gov-on-navy)",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ← Withdraw
        </button>
      </header>
      <div className="gov-tricolor" />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
        <div className="doc-card px-7 sm:px-12 py-10 ink-rise">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="dept-label">Briefing Code · Eyes Only</div>
            <span className="status-badge status-badge--live">Session Open</span>
          </div>

          <div className="text-center my-8">
            <button
              type="button"
              onClick={copyCode}
              title="Click to copy"
              style={{
                fontFamily: "IBM Plex Mono, monospace",
                fontWeight: 600,
                fontSize: 64,
                letterSpacing: "0.28em",
                color: "var(--gov-navy)",
                paddingLeft: "0.28em",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                lineHeight: 1.05,
              }}
            >
              {roomCode}
            </button>
            <p
              className="prose-court italic mt-2"
              style={{ color: "var(--gov-ink-muted)", fontSize: 15 }}
            >
              {copied
                ? "Code copied to clipboard."
                : mode === "host"
                ? "Click the code to copy — the delegation must assemble."
                : "You have been admitted to the chamber. Await the chair."}
            </p>
          </div>

          {/* Session parameters strip */}
          <div
            className="grid grid-cols-4 gap-2 mb-8"
            style={{
              borderTop: "1px solid var(--gov-rule)",
              borderBottom: "1px solid var(--gov-rule)",
              padding: "14px 0",
            }}
          >
            <Summary k="Rounds" v={mode === "host" ? String(cfg.rounds) : "—"} />
            <Summary k="Per round" v={mode === "host" ? `${cfg.duration}s` : "—"} />
            <Summary k="Max length" v="280 ch" />
            <Summary k="Delegates" v={`${players.length}`} />
          </div>

          {/* Delegation */}
          <div className="mb-8">
            <div className="flex items-end justify-between mb-3">
              <div className="dept-label">The Delegation</div>
              <div
                className="font-mono"
                style={{ color: "var(--gov-ink-muted)", fontSize: 11, letterSpacing: "0.2em" }}
              >
                MIN 2
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {players.map((p, i) => {
                const isChair = i === 0;
                return (
                  <div
                    key={p.peerId || p.address || i}
                    className="p-3 flex items-center gap-3"
                    style={{
                      border: "1px solid var(--gov-rule)",
                      background: "var(--gov-surface-2)",
                      borderLeft: isChair ? "3px solid var(--gov-burgundy)" : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: isChair ? "var(--gov-burgundy)" : "var(--gov-navy)",
                        color: "var(--gov-on-navy)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Source Serif 4, serif",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      {isChair ? "★" : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-mono truncate"
                        style={{ fontSize: 12, color: "var(--gov-ink)" }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: 9,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: isChair ? "var(--gov-burgundy)" : "var(--gov-ink-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {isChair ? "Chair" : "Delegate " + (i + 1)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action */}
          {mode === "host" ? (
            <button
              onClick={hostStartGame}
              disabled={players.length < 2}
              className="btn-seal w-full"
            >
              {players.length < 2
                ? `Awaiting ${2 - players.length} More Delegate${players.length === 1 ? "" : "s"}`
                : "Open the Session  →"}
            </button>
          ) : (
            <div
              className="flex items-center justify-center gap-3 py-4 prose-court italic"
              style={{ color: "var(--gov-ink-muted)" }}
            >
              <span
                className="blip"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--gov-burgundy)",
                }}
              />
              Awaiting the chair&apos;s opening cable…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── small subcomponents ─── */

function SettingsField({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        paddingBottom: 20,
        marginBottom: 20,
        borderBottom: "1px solid var(--gov-rule)",
      }}
    >
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--gov-ink-muted)",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "var(--gov-ink-soft)", marginBottom: 12 }}>
        {hint}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends number>({
  value,
  options,
  onChange,
  formatter,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  formatter: (v: T) => string;
}) {
  return (
    <div
      style={{
        display: "inline-grid",
        gridAutoFlow: "column",
        gridAutoColumns: "minmax(64px, 1fr)",
        border: "1px solid var(--gov-rule-strong)",
        borderRadius: 2,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {options.map((opt, i) => {
        const active = opt === value;
        return (
          <button
            key={String(opt)}
            onClick={() => onChange(opt)}
            style={{
              padding: "11px 8px",
              background: active ? "var(--gov-navy)" : "var(--gov-surface)",
              color: active ? "var(--gov-on-navy)" : "var(--gov-ink-soft)",
              border: "none",
              borderLeft: i > 0 ? "1px solid var(--gov-rule)" : "none",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 14,
              fontWeight: active ? 600 : 500,
              letterSpacing: "0.06em",
              cursor: "pointer",
              transition: "background 0.1s, color 0.1s",
            }}
          >
            {formatter(opt)}
          </button>
        );
      })}
    </div>
  );
}

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 9,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--gov-ink-muted)",
          fontWeight: 600,
          marginBottom: 3,
        }}
      >
        {k}
      </div>
      <div
        style={{
          fontFamily: "Source Serif 4, Georgia, serif",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--gov-navy)",
        }}
      >
        {v}
      </div>
    </div>
  );
}
