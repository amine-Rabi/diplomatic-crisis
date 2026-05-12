"use client";

import { useEffect, useState } from "react";

interface Props {
  label?: string;
}

const STEPS = [
  "Cables encrypted, transmitted to validators…",
  "Panel reviewing wit, plausibility, tone…",
  "Cross-checking against historical record…",
  "Sealing the verdict on-chain…",
];

export default function ConsensusLoader({ label = "The Panel Deliberates" }: Props) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page-root min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="doc-card max-w-xl w-full px-10 py-14 text-center ink-rise">
        <div className="stamp mb-5">{label}</div>

        {/* Spinning globe */}
        <div className="flex justify-center mb-8">
          <svg
            className="globe-spin"
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
          >
            <circle cx="60" cy="60" r="52" stroke="var(--dc-ink)" strokeWidth="2" fill="rgba(29,79,140,0.05)" />
            {/* meridians */}
            <ellipse cx="60" cy="60" rx="52" ry="20" stroke="var(--dc-ink)" strokeWidth="1" fill="none" opacity="0.5" />
            <ellipse cx="60" cy="60" rx="52" ry="40" stroke="var(--dc-ink)" strokeWidth="1" fill="none" opacity="0.4" />
            <line x1="60" y1="8" x2="60" y2="112" stroke="var(--dc-ink)" strokeWidth="1" opacity="0.5" />
            <line x1="8" y1="60" x2="112" y2="60" stroke="var(--dc-ink)" strokeWidth="1" opacity="0.5" />
            {/* continents — abstract blobs */}
            <path
              d="M30 50 Q40 40 50 48 Q55 55 48 60 Q40 65 35 62 Z"
              fill="var(--dc-classified)"
              opacity="0.7"
            />
            <path
              d="M65 38 Q78 32 85 42 Q88 50 80 55 Q72 56 68 50 Z"
              fill="var(--dc-classified)"
              opacity="0.7"
            />
            <path
              d="M55 75 Q65 72 70 80 Q72 88 65 92 Q58 90 54 84 Z"
              fill="var(--dc-classified)"
              opacity="0.7"
            />
          </svg>
        </div>

        {/* Step indicator */}
        <div
          className="prose-court italic mb-2"
          style={{ minHeight: 48, color: "var(--dc-ink)", fontSize: 17 }}
        >
          {STEPS[step]}
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i <= step ? "var(--dc-classified)" : "var(--dc-rule)",
                transition: "background 0.3s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
