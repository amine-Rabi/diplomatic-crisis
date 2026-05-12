# Diplomatic Crisis

A multiplayer geopolitics simulator on **GenLayer**. Each round a fictional
international crisis breaks; every delegate has 120 seconds to issue a
**tweet-length (≤280 char)** diplomatic dispatch. An on-chain panel of LLM
judges scores every player on **wit**, **plausibility**, and **diplomatic
tone**, averaged equally. XP is awarded on-chain.

## Trust model

Players authenticate via their own wallet — every dispatch is signed by the
sender. The Intelligent Contract on GenLayer runs the LLM panel under
Optimistic Democracy consensus, so no single party can rig the verdict.

## Stack

- **Next.js** (App Router, Turbopack)
- **wagmi** + **RainbowKit** for wallet UX
- **PeerJS** for in-room coordination
- **genlayer-js** for contract reads/writes
- **Tailwind CSS** for styling

## Getting started

```bash
npm install
npm run dev
```

The app supports two networks (toggle from the brass plaque):

- **Studionet** — fast dev network, 1-2s confirmations.
- **Bradbury Testnet** — long-lived public testnet.

## Deploying the contract

Add a `PRIVATE_KEY=0x...` (well-funded for the target network) into
`.env.local`, then:

```bash
npm run deploy             # → Studionet (default, fast)
npm run deploy:bradbury    # → Bradbury Testnet
```

The deploy script prints a line like:

```
CONTRACT_STUDIONET=0x...
```

Paste that into `.env.local` and restart `npm run dev`. For Vercel, add the
same env var under Project Settings → Environment Variables, then redeploy
without build cache.

## License

MIT.
