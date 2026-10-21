> **Verified deployment — 21 October 2026.** New Bradbury contract:
> `0x59195008F33aa97AaF0bB73ECbd22187694AF559`.
> [Deployment transaction](https://explorer-bradbury.genlayer.com/tx/0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8)
> returned ACCEPTED / AGREE / FINISHED_WITH_RETURN. Live RPC confirmed the
> deployed source matches both repositories byte-for-byte (SHA-256
> `1d5134bc1499a9d18504fd72b6ec5061f5ae63a158a458ca5af595aecd4dd6f2`).
> App wallet writes remain disabled until real claim resolution and external
> wallet security clearance are complete.

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
| Address | [NEW 0x59195008F33aa97AaF0bB73ECbd22187694AF559](https://explorer-bradbury.genlayer.com/address/0x59195008F33aa97AaF0bB73ECbd22187694AF559) |
| Deploy | [NEW 0x8827fec6…922f8](https://explorer-bradbury.genlayer.com/tx/0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8) |
| `open_claim` | [`0x7f46ff83…d934`](https://explorer-bradbury.genlayer.com/tx/0x7f46ff8380e262b167740385e511666d25f3eb366d43e76b5f0ed97f4951d934) |
| `resolve` PASS | [`0x01e47a5b…7d49`](https://explorer-bradbury.genlayer.com/tx/0x01e47a5b666f42a36c0ffa86e5bd2602f0cc6230f6bfda705833382494f27d49) (claim id `1`) |

### Calls

1. `open_claim(standard, url_a, url_b)` → claim id
2. `resolve(id)` → consensus verdict
3. `get_claim(id)` → JSON state

Source: [`contracts/CrossSourceAttestation.py`](contracts/CrossSourceAttestation.py)

## App

The public desk is currently **read-only** and queries the new Bradbury contract without a wallet. The original wallet write workflow is temporarily disabled during the outstanding security review. The intended full write path uses `genlayer-js`:

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
