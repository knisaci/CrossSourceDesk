import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";

export const CONTRACT_ADDRESS = "0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c";
export const EXPLORER_TX = "https://explorer-bradbury.genlayer.com/tx/";
export const EXPLORER_ADDR =
  "https://explorer-bradbury.genlayer.com/address/0x8bF0baAC9432a9c00183de43825E39F58b3E4a8c";
export const CHAIN_ID_HEX = "0x107D";
export const RPC_URL = "https://rpc-bradbury.genlayer.com";

const ZERO = "0x0000000000000000000000000000000000000000";
const chain = { ...testnetBradbury, rpcUrls: { default: { http: [RPC_URL] } } };
let readClient;
let readReady;

export function friendlyError(err) {
  const raw = err && (err.shortMessage || err.message || String(err));
  const text = String(raw || "unknown error");
  if (/private method|__receive__|__handle_undefined_method__/i.test(text)) {
    return "Read missed get_claim. Type a numeric claim id (try 1) and click Read claim again.";
  }
  if (/Missing or invalid parameters/i.test(text)) {
    return "Claim id is missing. Enter 1 and click Read claim.";
  }
  return text.length > 220 ? text.slice(0, 220) + "…" : text;
}

export function getReadClient() {
  if (!readClient) {
    readClient = createClient({ chain, endpoint: RPC_URL });
  }
  return readClient;
}

async function readyRead() {
  const client = getReadClient();
  if (!readReady) {
    readReady = (async () => {
      try {
        if (typeof client.initializeConsensusSmartContract === "function") {
          await client.initializeConsensusSmartContract();
        }
      } catch (_) {}
    })();
  }
  await readReady;
  return client;
}

export function getWriteClient(address) {
  const provider = window.ethereum;
  if (!provider) throw new Error("No injected wallet found. Install MetaMask or another EIP-1193 wallet.");
  return createClient({ chain, endpoint: RPC_URL, account: address, provider });
}

export function explorerTx(hash) {
  return EXPLORER_TX + hash;
}

export async function ensureBradbury() {
  const provider = window.ethereum;
  if (!provider) throw new Error("No injected wallet found.");
  const current = await provider.request({ method: "eth_chainId" });
  if (current && current.toLowerCase() === CHAIN_ID_HEX.toLowerCase()) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch (err) {
    if (err && (err.code === 4902 || String(err.message || "").includes("Unrecognized chain"))) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CHAIN_ID_HEX,
          chainName: "GenLayer Testnet Bradbury",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          rpcUrls: [RPC_URL],
          blockExplorerUrls: ["https://explorer-bradbury.genlayer.com"],
        }],
      });
      return;
    }
    throw err;
  }
}

export async function connectWallet() {
  const provider = window.ethereum;
  if (!provider) throw new Error("No injected wallet found. Install MetaMask.");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (!accounts || !accounts.length) throw new Error("Wallet returned no accounts.");
  await ensureBradbury();
  try {
    const client = getWriteClient(accounts[0]);
    if (typeof client.connect === "function") await client.connect("testnetBradbury");
  } catch (_) {}
  return accounts[0];
}

function asText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.result === "string") return value.result;
    if (typeof value.return_value === "string") return value.return_value;
    try { return JSON.stringify(value); } catch (_) { return String(value); }
  }
  return String(value);
}

export function parseClaim(raw) {
  const text = asText(raw);
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.error) return { error: parsed.error, raw: text };
    return {
      id: String(parsed.id || ""),
      opener: parsed.opener || "",
      standard: parsed.standard || "",
      url_a: parsed.url_a || "",
      url_b: parsed.url_b || "",
      status: parsed.status || "",
      verdict: parsed.verdict || "",
      reason: parsed.reason || "",
      resolved_by: parsed.resolved_by || "",
    };
  } catch (_) {
    return { error: "Could not parse claim JSON", raw: text };
  }
}

export async function getClaim(id) {
  const claimId = String(id || "").trim();
  if (!claimId) throw new Error("Enter a claim id first. Use 1 for the accepted PASS example.");
  const client = await readyRead();
  const request = {
    address: CONTRACT_ADDRESS,
    functionName: "get_claim",
    args: [claimId],
    kwargs: { claim_id: claimId },
  };
  try {
    return parseClaim(await client.readContract(request));
  } catch (first) {
    try {
      return parseClaim(await client.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_claim",
        args: [claimId],
      }));
    } catch (_) {
      throw new Error(friendlyError(first));
    }
  }
}

function extractReturn(receipt) {
  const candidates = [
    receipt && receipt.consensus_data && receipt.consensus_data.leader_receipt && receipt.consensus_data.leader_receipt.execution_result,
    receipt && receipt.consensus_data && receipt.consensus_data.leader_receipt && receipt.consensus_data.leader_receipt.result,
    receipt && receipt.txExecutionResult,
    receipt && receipt.result,
    receipt && receipt.data,
    receipt && receipt.execution_result,
  ];
  for (const c of candidates) {
    if (c == null) continue;
    const text = asText(c);
    if (text && text !== "[object Object]") return text;
  }
  return "";
}

export function isWriteSuccessful(receipt) {
  const status = String((receipt && (receipt.statusName || receipt.status || receipt.transaction_status)) || "").toUpperCase();
  const exec = String((receipt && (receipt.txExecutionResultName || receipt.execution_result_name || (receipt.consensus_data && receipt.consensus_data.leader_receipt && receipt.consensus_data.leader_receipt.execution_result))) || "").toUpperCase();
  const okStatus = !status || status.includes("ACCEPT") || status.includes("FINAL");
  const badExec = exec.includes("ERROR") || exec.includes("REVERT") || exec.includes("UNDETERMINED");
  return okStatus && !badExec;
}

export async function sendWrite({ address, functionName, args, onHash, onStage }) {
  const client = getWriteClient(address);
  try {
    if (typeof client.initializeConsensusSmartContract === "function") {
      await client.initializeConsensusSmartContract();
    }
  } catch (_) {}
  onStage && onStage("Estimating fees");
  const write = { address: CONTRACT_ADDRESS, functionName, args };
  let fees;
  try {
    if (typeof client.estimateTransactionFeesForWrite === "function") {
      const estimate = await client.estimateTransactionFeesForWrite(write);
      fees = {
        distribution: estimate.distribution,
        feeValue: estimate.feeValue,
        messageAllocations: estimate.messageAllocations,
      };
    }
  } catch (err) {
    onStage && onStage("Fee estimate skipped — using wallet defaults");
    console.warn("fee estimate failed", err);
  }
  onStage && onStage("Waiting for wallet signature");
  const hash = await client.writeContract({
    ...write,
    value: 0n,
    ...(fees ? { fees } : {}),
  });
  onHash && onHash(hash);
  onStage && onStage("Submitted — waiting for validator consensus");
  const reader = await readyRead();
  let receipt;
  if (typeof reader.waitForDecision === "function") {
    try {
      receipt = await reader.waitForDecision({ hash, interval: 4000, retries: 90, fullTransaction: true });
    } catch (_) {
      receipt = await reader.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 4000, retries: 90, fullTransaction: true });
    }
  } else {
    receipt = await reader.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 4000, retries: 90, fullTransaction: true });
  }
  return { hash, receipt, returned: extractReturn(receipt), ok: isWriteSuccessful(receipt) };
}

export function shortAddr(addr) {
  if (!addr || addr.toLowerCase() === ZERO) return "—";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
