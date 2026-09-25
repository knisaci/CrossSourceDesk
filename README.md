# CrossSource Desk

GenLayer Project. Frontend + Intelligent Contract for dual-source attestation on Testnet Bradbury.

Live demo: https://knisaci.github.io/CrossSourceAttestation/

Contract: [`0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c`](https://explorer-bradbury.genlayer.com/address/0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c)

Resolved PASS example: [`0x01e47a5b…`](https://explorer-bradbury.genlayer.com/tx/0x01e47a5b666f42a36c0ffa86e5bd2602f0cc6230f6bfda705833382494f27d49) (claim id `1`)

## Why this is a Project

The desk is a static app that calls the live contract through `genlayer-js`:

- `open_claim(standard, url_a, url_b)`
- `resolve(id)` and wait for validator consensus
- `get_claim(id)` from accepted state

No build step. No API keys. Open `index.html` over http.

## Run locally

```bash
git clone https://github.com/knisaci/CrossSourceDesk.git
cd CrossSourceDesk
python3 -m http.server 4173
```

Open http://localhost:4173

1. Connect MetaMask to Bradbury (chain id 4221, RPC https://rpc-bradbury.genlayer.com).
2. Get GEN from https://testnet-faucet.genlayer.foundation.
3. Click **Read claim** with id `1` (already PASS), or open + resolve a preset.

`resolve` can take several minutes. That is live web fetch + consensus, not a hang.

## Layout

```
index.html                         # desk UI
src/main.js src/genlayer.js src/styles.css
contracts/CrossSourceAttestation.py
```
