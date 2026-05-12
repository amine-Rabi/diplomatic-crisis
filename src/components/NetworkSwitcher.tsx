"use client";

import { useEffect, useState } from "react";
import {
  getActiveNetwork,
  setActiveNetwork,
  isNetworkConfigured,
  listNetworks,
  NETWORK_LABELS,
  CHAIN_CHANGE_EVENT,
  type NetworkId,
} from "@/lib/chain";

export default function NetworkSwitcher() {
  const [active, setActive] = useState<NetworkId>("studionet");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setActive(getActiveNetwork());
    const handler = () => setActive(getActiveNetwork());
    window.addEventListener(CHAIN_CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHAIN_CHANGE_EVENT, handler);
  }, []);

  const ok = isNetworkConfigured(active);
  const networks = listNetworks();

  const choose = (id: NetworkId) => {
    setActiveNetwork(id);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "7px 14px",
          background: "transparent",
          border: "1px solid var(--gov-on-navy-muted)",
          borderRadius: 999,
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--gov-on-navy)",
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.12s ease, border-color 0.12s ease",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: ok ? "#4ade80" : "#f87171",
            boxShadow: ok
              ? "0 0 0 2px rgba(74,222,128,0.2)"
              : "0 0 0 2px rgba(248,113,113,0.25)",
          }}
        />
        Network · {NETWORK_LABELS[active]}
        <span
          style={{
            marginLeft: 4,
            opacity: 0.7,
            fontSize: 9,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "var(--gov-surface)",
            border: "1px solid var(--gov-rule-strong)",
            borderTop: "3px solid var(--gov-navy)",
            borderRadius: 4,
            boxShadow: "0 12px 28px -8px rgba(12,35,64,0.35)",
            color: "var(--gov-ink)",
            zIndex: 50,
            minWidth: 240,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px 6px",
              fontFamily: "Inter, sans-serif",
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--gov-ink-muted)",
              fontWeight: 600,
              borderBottom: "1px solid var(--gov-rule)",
              background: "var(--gov-surface-2)",
            }}
          >
            Select Network
          </div>
          {networks.map((id) => {
            const configured = isNetworkConfigured(id);
            const isActive = id === active;
            return (
              <button
                key={id}
                onClick={() => choose(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "11px 14px",
                  background: isActive ? "rgba(12,35,64,0.05)" : "transparent",
                  borderLeft: isActive
                    ? "3px solid var(--gov-burgundy)"
                    : "3px solid transparent",
                  borderBottom: "1px solid var(--gov-rule)",
                  borderTop: "none",
                  borderRight: "none",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 12,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--gov-navy)",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.1s ease",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: configured ? "#16a34a" : "var(--gov-burgundy)",
                    boxShadow: configured
                      ? "0 0 0 2px rgba(22,163,74,0.18)"
                      : "0 0 0 2px rgba(138,32,38,0.18)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{NETWORK_LABELS[id]}</span>
                {isActive && (
                  <span
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      color: "var(--gov-burgundy)",
                    }}
                  >
                    ACTIVE
                  </span>
                )}
                {!isActive && !configured && (
                  <span
                    style={{
                      fontFamily: "IBM Plex Mono, monospace",
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      color: "var(--gov-ink-faint)",
                      textTransform: "uppercase",
                    }}
                  >
                    not set
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
