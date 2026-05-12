"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import type { GameContext } from "@/app/page";
import { submitEntry, finalizeGame, getSubmissionCount, getGameResult } from "@/lib/genlayer";
import type { JudgingResult } from "@/lib/genlayer";
import ConsensusLoader from "./ConsensusLoader";

interface Props {
  ctx: GameContext;
  onFinish: (r: JudgingResult) => void;
  onAbort: () => void;
}

type RoundState = "input" | "submitting" | "submitted";

const MAX_RESPONSE_LEN = 280; // tweet-length

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export default function GameRound({ ctx, onFinish, onAbort }: Props) {
  const { address } = useAccount();
  const totalRounds = ctx.rounds.length;
  const [roundIdx, setRoundIdx] = useState(0);
  const [state, setState] = useState<RoundState>("input");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const round = ctx.rounds[roundIdx];

  // ── Per-round countdown ───────────────────────────────────
  const roundSeconds = ctx.roundSeconds ?? 120;
  const [secondsLeft, setSecondsLeft] = useState(roundSeconds);
  useEffect(() => {
    setSecondsLeft(roundSeconds);
  }, [roundIdx, roundSeconds]);
  useEffect(() => {
    if (state !== "input") return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [state, secondsLeft, roundSeconds]);
  useEffect(() => {
    if (state !== "input") return;
    if (secondsLeft > 0) return;
    if (response.trim().length > 0) {
      submitThisRound(true);
    } else {
      if (roundIdx < totalRounds - 1) {
        setRoundIdx((i) => i + 1);
        setState("input");
        setResponse("");
      } else {
        setWaitingForOthers(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, state]);

  // ── Finalize flow (host only, after all rounds submitted) ──────────────
  const [finalizing, setFinalizing] = useState(false);
  const [waitingForOthers, setWaitingForOthers] = useState(false);
  const finalizeStartedRef = useRef(false);

  const submitThisRound = async (auto = false) => {
    if (!address) return;
    if (response.trim().length === 0) {
      if (auto) return;
      setError("The bureau requires a written dispatch.");
      return;
    }
    setError(null);
    setState("submitting");
    try {
      // `persona` arg is unused by the contract but kept for ABI compatibility.
      await submitEntry(
        address,
        ctx.gameId,
        round.round,
        "",
        response.trim(),
      );
      setState("submitted");
      setTimeout(() => {
        if (roundIdx < totalRounds - 1) {
          setRoundIdx((i) => i + 1);
          setState("input");
          setResponse("");
        } else {
          setWaitingForOthers(true);
        }
      }, 1200);
    } catch (e) {
      console.error(e);
      setError("Submit again.");
      setState("input");
    }
  };

  useEffect(() => {
    if (!waitingForOthers || !ctx.isHost || finalizeStartedRef.current) return;
    const expected = ctx.players.length * totalRounds;
    let cancelled = false;

    (async () => {
      while (!cancelled) {
        const cnt = await getSubmissionCount(ctx.gameId).catch(() => 0);
        if (cnt >= expected) {
          if (finalizeStartedRef.current) return;
          finalizeStartedRef.current = true;
          setFinalizing(true);
          try {
            const result = await finalizeGame(
              address!,
              ctx.gameId,
              ctx.rounds,
              ctx.players.map((p) => p.address),
            );
            ctx.network.broadcast({ type: "JUDGING_RESULT", payload: result });
            onFinish(result);
          } catch (e) {
            console.error(e);
            setError("The panel could not seal the verdict. Try again.");
            setFinalizing(false);
            finalizeStartedRef.current = false;
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [waitingForOthers, ctx, address, totalRounds, onFinish]);

  useEffect(() => {
    if (!waitingForOthers || ctx.isHost) return;
    let cancelled = false;
    let done = false;

    ctx.network.onMessage((msg) => {
      if (done) return;
      if (msg.type === "JUDGING_RESULT") {
        done = true;
        onFinish(msg.payload as JudgingResult);
      }
    });

    (async () => {
      while (!cancelled && !done) {
        const r = await getGameResult(ctx.gameId).catch(() => null);
        if (!cancelled && !done && r) {
          done = true;
          onFinish(r);
          return;
        }
        await new Promise((res) => setTimeout(res, 4000));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [waitingForOthers, ctx, onFinish]);

  if (finalizing) {
    return <ConsensusLoader label="The Panel Deliberates" />;
  }

  if (waitingForOthers) {
    return (
      <div className="page-root min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="doc-card max-w-xl w-full px-10 py-12 text-center ink-rise">
          <div className="stamp mb-4">All Cables Filed</div>
          <h2 className="display text-4xl mb-3">Awaiting the Panel</h2>
          <p className="prose-court italic mb-8" style={{ color: "var(--dc-ink-muted)" }}>
            Once every delegate has filed all {totalRounds} dispatches on-chain,
            the panel shall seal the verdict.
          </p>
          <div className="flex justify-center mb-2">
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid var(--dc-rule)",
                borderTopColor: "var(--dc-classified)",
                borderRadius: "50%",
                animation: "spin 1.2s linear infinite",
              }}
            />
          </div>
          {error && (
            <div className="prose-court mt-4" style={{ color: "var(--dc-classified)" }}>
              {error}
            </div>
          )}
        </div>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const timerWarn = secondsLeft <= Math.min(15, Math.floor(roundSeconds * 0.15));
  const timerCaution =
    !timerWarn && secondsLeft <= Math.min(45, Math.floor(roundSeconds * 0.35));
  const charCount = response.length;
  const charWarn = charCount > MAX_RESPONSE_LEN - 30;

  return (
    <div className="page-root min-h-screen px-4 sm:px-6 py-6">
      <button onClick={onAbort} className="btn-ghost" style={{ padding: "8px 14px", fontSize: 11 }}>
        ← Stand Down
      </button>

      <div className="max-w-3xl mx-auto mt-8">
        <div className="doc-card px-7 sm:px-12 py-10 ink-rise">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2">
            <div className="stamp">
              Round {ROMAN[round.round - 1]} of {ROMAN[totalRounds - 1]}
            </div>
            <div
              className="font-mono tabular-nums px-3 py-1"
              style={{
                fontSize: 14,
                letterSpacing: "0.15em",
                border: "1px solid",
                borderColor: timerWarn
                  ? "var(--dc-classified)"
                  : timerCaution
                  ? "var(--dc-gold-deep)"
                  : "var(--dc-ink)",
                color: timerWarn
                  ? "var(--dc-classified)"
                  : timerCaution
                  ? "var(--dc-gold-deep)"
                  : "var(--dc-ink)",
                background: timerWarn ? "rgba(182,52,42,0.08)" : "transparent",
              }}
            >
              {String(Math.floor(secondsLeft / 60))}:
              {String(secondsLeft % 60).padStart(2, "0")}
            </div>
          </div>

          {/* Round progress ticks */}
          <div className="flex gap-1.5 mb-7">
            {ctx.rounds.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 4,
                  flex: 1,
                  background:
                    i < roundIdx
                      ? "var(--dc-classified)"
                      : i === roundIdx
                      ? "var(--dc-ink)"
                      : "var(--dc-rule)",
                }}
              />
            ))}
          </div>

          {/* Crisis briefing */}
          <div className="text-center mb-8">
            <div className="stamp-ink mb-3">⚠ Incoming Crisis Briefing</div>
            <h2
              className="display"
              style={{ fontSize: 26, lineHeight: 1.3 }}
            >
              &ldquo;{round.scenario}&rdquo;
            </h2>
          </div>

          {/* Dispatch */}
          <div className="mb-6">
            <div className="flex items-end justify-between mb-2">
              <div className="stamp-ink">Diplomatic Dispatch</div>
              <div
                className="font-mono"
                style={{
                  fontSize: 12,
                  color: charWarn ? "var(--dc-classified)" : "var(--dc-ink-muted)",
                  letterSpacing: "0.15em",
                  fontWeight: charWarn ? 700 : 400,
                }}
              >
                {charCount} / {MAX_RESPONSE_LEN}
              </div>
            </div>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value.slice(0, MAX_RESPONSE_LEN))}
              disabled={state !== "input"}
              placeholder="Compose your tweet-length cable. Be witty. Be plausible. Don't start a war."
              rows={4}
              className="ink-textarea"
            />
          </div>

          {error && (
            <div
              className="mb-4 px-4 py-3"
              style={{
                background: "rgba(182,52,42,0.08)",
                border: "1px solid var(--dc-classified)",
                color: "var(--dc-classified-deep)",
                fontFamily: "Inter, sans-serif",
                fontSize: 15,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={() => submitThisRound(false)}
            disabled={state !== "input" || response.trim().length === 0}
            className="btn-seal w-full"
          >
            {state === "submitting"
              ? "Submitting on Chain…"
              : state === "submitted"
              ? "✓ Cable Logged"
              : `Submit ${ROMAN[round.round - 1]}`}
          </button>
        </div>
      </div>
    </div>
  );
}
