> **Verified deployment — 21 October 2026.** New Bradbury contract:
> `0x59195008F33aa97AaF0bB73ECbd22187694AF559`.
> [Deployment transaction](https://explorer-bradbury.genlayer.com/tx/0x8827fec61f1d475ad9f21b8c337b7a6b672a35237d4587ef6b815fbfcf0922f8)
> returned ACCEPTED / AGREE / FINISHED_WITH_RETURN. Live RPC confirmed the
> deployed source matches both repositories byte-for-byte (SHA-256
> `1d5134bc1499a9d18504fd72b6ec5061f5ae63a158a458ca5af595aecd4dd6f2`).
> Claim 1 has now been resolved with an actual Bradbury PASS verdict
> ([resolve tx](https://explorer-bradbury.genlayer.com/tx/0x441c3d80d074508d5a01f23aa43c8a695e47a11915f1dd985d80d6990653795a)),
> 4 AGREE validator votes and 1 TIMEOUT. Wallet writes remain disabled pending
> independent clearance of the reported wallet/browser security warning.

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
| `open_claim` | [Claim 1, 0xdbe32671…df683e](https://explorer-bradbury.genlayer.com/tx/0xdbe326718f9c67980bb9949912cc61fc9f8ea7b1b8b0bdee474336dad2df683e) |
| `resolve` PASS | [Claim 1, 0x441c3d80…53795a](https://explorer-bradbury.genlayer.com/tx/0x441c3d80d074508d5a01f23aa43c8a695e47a11915f1dd985d80d6990653795a) (4 AGREE, 1 TIMEOUT) |

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

The CrossSourceDesk repository contains a no-wallet static status page, not the active app build. The live verified read-only claim viewer and production frontend are maintained in [CrossSourceAttestation](https://github.com/knisaci/CrossSourceAttestation).

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

Open http://localhost:4173 to view the no-wallet status page. For the active browser claim viewer, use https://knisaci.github.io/CrossSourceAttestation/ and read claim ID `1` (RESOLVED/PASS).

### Demo pages

The presets use `https://example.org` and `https://www.iana.org/domains/reserved`.

- Reserved-domain standard → usually `PASS`
- Marketplace standard those pages do not support → usually `FAIL`
- Audited-financials standard those pages cannot satisfy → usually `INSUFFICIENT`

`resolve` can take several minutes. That is validator consensus fetching live HTML, not a UI hang.

## Project vs standalone contract

The standalone Intelligent Contract was accepted on 17 Sep 2026. This repository is the project form of the same primitive: public desk, full transaction lifecycle, and copy stewards can replay without Studio.

## Independent steward verification

- [Read-only live Bradbury checks and test workflows](https://github.com/knisaci/CrossSourceAttestation/actions)
- [Remediation, limits, and explicit transaction proof](https://github.com/knisaci/CrossSourceAttestation/blob/main/docs/STEWARD-REMEDIATION.md)
- [Actual first-transaction failure and CLI typed-argument recovery](https://github.com/knisaci/CrossSourceAttestation/blob/main/docs/BRADBURY-RESOLVE-INCIDENT.md)

The project's web evidence has been intentionally restricted to wallet-free reads while an external reported phishing/malicious-site alert remains unconfirmed as cleared. Never disable wallet security protections to interact with it.
