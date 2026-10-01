# CrossSource Desk

A GenLayer project around the accepted **CrossSourceAttestation** Intelligent Contract.

Lock a natural-language standard and two independent `https` pages. `resolve()` has every validator fetch both pages live, run a structured JSON judge, and accept the leader only when the verdict enum matches: `PASS | FAIL | INSUFFICIENT`. Reasoning text may differ.

This is not a thin “AI decides X” wrapper. Equivalence is the verdict field only. The pages are unstructured HTML, so consensus is required.

Live desk: https://knisaci.github.io/CrossSourceAttestation/

## Why it exists

Milestones, listing rules, and agent deliverables are usually checked by a person or a single model. CrossSource turns that check into an on-chain evidence gate:

- the criterion is locked before anyone looks at the pages
- the two sources are locked and must be distinct https URLs
- validators refetch the pages at resolve time
- they only have to agree on `PASS`, `FAIL`, or `INSUFFICIENT`

## Contract

| Field | Value |
| --- | --- |
| Network | Testnet Bradbury |
| Address | [`0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c`](https://explorer-bradbury.genlayer.com/address/0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c) |
| Deploy | [`0x0fcaae6c…9a21`](https://explorer-bradbury.genlayer.com/tx/0x0fcaae6c78611df87a6914fd9fce952b45cca336c0db828769b284ff697a9a21) |
| `open_claim` | [`0x7f46ff83…d934`](https://explorer-bradbury.genlayer.com/tx/0x7f46ff8380e262b167740385e511666d25f3eb366d43e76b5f0ed97f4951d934) |
| `resolve` PASS | [`0x01e47a5b…7d49`](https://explorer-bradbury.genlayer.com/tx/0x01e47a5b666f42a36c0ffa86e5bd2602f0cc6230f6bfda705833382494f27d49) (claim id `1`) |

### Calls

1. `open_claim(standard, url_a, url_b)` → claim id
2. `resolve(id)` → consensus verdict
3. `get_claim(id)` → JSON state

Source: [`contracts/CrossSourceAttestation.py`](contracts/CrossSourceAttestation.py)

## App

The desk is a static frontend. It talks to Bradbury through `genlayer-js`:

- connect / switch the injected wallet to chain id `4221`
- estimate fees when the SDK supports it
- `writeContract` for `open_claim` and `resolve`
- wait until the transaction is accepted / decided
- `readContract({ stateStatus: "accepted" })` for `get_claim`

No build step. No API keys. Open `index.html` over http.

```
index.html                         # desk UI
src/main.js src/genlayer.js src/styles.css
contracts/CrossSourceAttestation.py
```

## Run locally

You need a Bradbury-capable wallet and testnet GEN from [the faucet](https://testnet-faucet.genlayer.foundation).

```bash
git clone https://github.com/knisaci/CrossSourceDesk.git
cd CrossSourceDesk
python3 -m http.server 4173
```

Open http://localhost:4173, connect the wallet, load a demo preset, then Open claim → Resolve.

Fast path: click **Read claim** with id `1` (already PASS).

### Demo pages

The presets use `https://example.org` and `https://www.iana.org/domains/reserved`.

- Reserved-domain standard → usually `PASS`
- Marketplace standard those pages do not support → usually `FAIL`
- Audited-financials standard those pages cannot satisfy → usually `INSUFFICIENT`

`resolve` can take several minutes. That is validator consensus fetching live HTML, not a UI hang.

## Project vs standalone contract

The standalone Intelligent Contract was accepted on 17 Sep 2026. This repository is the project form of the same primitive: public desk, full transaction lifecycle, and copy stewards can replay without Studio.
