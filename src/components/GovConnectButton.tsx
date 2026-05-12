"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Wallet connection button styled to match the diplomatic masthead:
 * transparent navy chip with on-navy text, matches NetworkSwitcher.
 */
export default function GovConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        openChainModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        const baseStyle: React.CSSProperties = {
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
        };

        const dot = (color: string) => (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
            }}
          />
        );

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    style={{
                      ...baseStyle,
                      background: "var(--gov-gold)",
                      borderColor: "var(--gov-gold)",
                      color: "var(--gov-navy)",
                    }}
                  >
                    {dot("var(--gov-navy)")}
                    Connect
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    style={{
                      ...baseStyle,
                      background: "var(--gov-burgundy)",
                      borderColor: "var(--gov-burgundy)",
                      color: "var(--gov-on-navy)",
                    }}
                  >
                    {dot("#fff")}
                    Wrong Network
                  </button>
                );
              }

              return (
                <button onClick={openAccountModal} type="button" style={baseStyle}>
                  {dot("#4ade80")}
                  {account.displayName.replace("…", "·")}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
