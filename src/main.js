import {
  CONTRACT_ADDRESS,
  EXPLORER_ADDR,
  connectWallet,
  getClaim,
  sendWrite,
  explorerTx,
  shortAddr,
} from "./genlayer.js";

const DEMO = {
  pass: {
    label: "Demo · reserved domains (likely PASS)",
    standard: "Both pages must be public documentation about reserved or example Internet domain names used for testing or documentation. Neither page may be a login wall, storefront, or commercial product listing.",
    url_a: "https://example.org",
    url_b: "https://www.iana.org/domains/reserved",
  },
  fail: {
    label: "Demo · impossible standard (likely FAIL)",
    standard: "Both pages must explicitly state that example.org is a paid commercial marketplace that sells reserved IANA domain names to the public.",
    url_a: "https://example.org",
    url_b: "https://www.iana.org/domains/reserved",
  },
  thin: {
    label: "Demo · unrelated pages (likely INSUFFICIENT)",
    standard: "Both pages must publish an audited 2024 financial statement for the same company, including net income and an auditor signature.",
    url_a: "https://example.org",
    url_b: "https://www.iana.org/domains/reserved",
  },
};

const state = {
  account: "",
  stage: "Idle",
  hash: "",
  error: "",
  lastClaimId: localStorage.getItem("cs_last_claim") || "1",
  claim: null,
  busy: false,
};

function el(tag, attrs, kids) {
  attrs = attrs || {};
  kids = kids || [];
  const node = document.createElement(tag);
  Object.keys(attrs).forEach((k) => {
    const v = attrs[k];
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v !== false && v != null) node.setAttribute(k, v);
  });
  kids.forEach((kid) => node.append(kid));
  return node;
}

function setBusy(v) {
  state.busy = v;
  document.querySelectorAll("button").forEach((b) => {
    if (b.dataset.keep) return;
    b.disabled = v;
  });
}

function banner() {
  if (state.error) return el("div", { class: "banner err" }, [state.error]);
  if (state.hash) {
    const a = el("a", { href: explorerTx(state.hash), target: "_blank", rel: "noreferrer" }, [state.hash]);
    const wrap = el("div", { class: "banner" }, [state.stage + " · "]);
    wrap.append(a);
    return wrap;
  }
  return el("div", { class: "note" }, [state.stage]);
}

function claimCard(claim) {
  if (!claim) return el("div", { class: "note" }, ["Load a claim to inspect locked sources and the current verdict."]);
  if (claim.error) return el("div", { class: "banner err" }, [claim.error]);
  const box = el("div", { class: "claim" });
  const rows = [
    ["id", claim.id],
    ["status", claim.status],
    ["verdict", claim.verdict || "—"],
    ["reason", claim.reason || "—"],
    ["opener", shortAddr(claim.opener)],
    ["resolved", shortAddr(claim.resolved_by)],
    ["source A", claim.url_a],
    ["source B", claim.url_b],
  ];
  const kv = el("div", { class: "kv" });
  rows.forEach((row) => {
    kv.append(el("span", {}, [row[0]]), el("b", {}, [row[1]]));
  });
  box.append(el("div", { style: "margin-bottom:8px;color:#9a9488" }, ["Locked standard"]), el("div", {}, [claim.standard || "—"]), el("div", { style: "height:10px" }), kv);
  return box;
}

function step(label, on) {
  return el("div", { class: "step " + (on ? "ok" : "") }, [el("div", { class: "dot" }), el("div", {}, [label])]);
}

function render() {
  const root = document.getElementById("app");
  root.innerHTML = "";
  const header = el("div", { class: "top" }, [
    el("div", { class: "brand" }, [
      el("div", { class: "mark", html: '<svg width="22" height="22" viewBox="0 0 64 64" fill="none"><rect x="8" y="16" width="28" height="34" rx="4" fill="#7AA2FF"/><rect x="26" y="14" width="28" height="34" rx="4" fill="#E8B86D"/><circle cx="32" cy="32" r="9" fill="#0B0D10"/><path d="M28 32.2l2.4 2.4 5.6-6" stroke="#F4F1EA" stroke-width="2.2" stroke-linecap="round"/></svg>' }),
      el("div", {}, [el("h1", {}, ["CrossSource"]), el("p", {}, ["Attestation desk"])]),
    ]),
    el("div", { class: "wallet" }, [
      el("div", { class: "addr" }, [state.account ? shortAddr(state.account) : "wallet disconnected"]),
      el("button", {
        class: "btn",
        type: "button",
        onclick: async function () {
          try {
            state.error = "";
            state.account = await connectWallet();
            state.stage = "Wallet on Bradbury";
          } catch (e) {
            state.error = e.message || String(e);
          }
          render();
        },
      }, [state.account ? "Switch / reconnect" : "Connect wallet"]),
    ]),
  ]);
  const hero = el("section", { class: "hero" }, [
    el("div", {}, [
      el("h2", { html: "Two live pages.<br><em>One locked standard.</em><br>A verdict the chain can keep." }),
      el("p", { class: "lede" }, ["CrossSource is a reusable GenLayer evidence gate. You lock a natural-language standard plus two independent https pages. resolve() has every validator fetch both pages live and accept the leader only when the verdict enum matches: PASS, FAIL, or INSUFFICIENT."]),
      el("div", { class: "chips" }, [
        el("span", { class: "chip" }, ["Bradbury 0x8bF0…4a8c"]),
        el("span", { class: "chip" }, ["equivalence = verdict only"]),
        el("span", { class: "chip" }, ["live web, not an oracle feed"]),
      ]),
    ]),
    el("aside", { class: "stamp" }, [
      el("h3", {}, ["Last inspected claim"]),
      el("div", { class: "verdict-lg " + ((state.claim && state.claim.verdict) || "") }, [(state.claim && state.claim.verdict) || "OPEN"]),
      el("div", { class: "mono" }, [state.claim && state.claim.id ? ("claim " + state.claim.id + " · " + (state.claim.status || "")) : "no claim loaded"]),
      el("p", { class: "note" }, [(state.claim && state.claim.reason) || "Reasoning text may differ across validators. Only the enum has to match."]),
    ]),
  ]);
  const openCard = el("section", { class: "card" }, [
    el("h3", {}, ["1. Open a claim"]),
    el("p", { class: "note" }, ["The standard and both URLs are locked at open time. Later resolvers cannot swap evidence."]),
    el("div", { class: "presets" }, Object.keys(DEMO).map((key) => {
      const demo = DEMO[key];
      return el("button", {
        class: "preset",
        type: "button",
        "data-keep": "1",
        onclick: function () {
          document.getElementById("standard").value = demo.standard;
          document.getElementById("url_a").value = demo.url_a;
          document.getElementById("url_b").value = demo.url_b;
        },
      }, [demo.label]);
    })),
    el("label", { for: "standard" }, ["Standard"]),
    el("textarea", { id: "standard", placeholder: "What must both pages jointly prove?" }, [DEMO.pass.standard]),
    el("label", { for: "url_a" }, ["Source A · https"]),
    el("input", { id: "url_a", value: DEMO.pass.url_a }),
    el("label", { for: "url_b" }, ["Source B · https"]),
    el("input", { id: "url_b", value: DEMO.pass.url_b }),
    el("div", { class: "row" }, [
      el("button", { class: "btn primary", type: "button", onclick: function () { openClaim(); } }, ["Open claim"]),
    ]),
  ]);
  const resolveCard = el("section", { class: "card" }, [
    el("h3", {}, ["2. Read or resolve"]),
    el("p", { class: "note" }, ["Anyone can resolve an OPEN claim. Validators refetch both pages at resolve time."]),
    el("label", { for: "claim_id" }, ["Claim id"]),
    el("input", { id: "claim_id", value: state.lastClaimId }),
    el("div", { class: "row" }, [
      el("button", { class: "btn", type: "button", onclick: function () { loadClaim(); } }, ["Read claim"]),
      el("button", { class: "btn gold", type: "button", onclick: function () { resolveClaim(); } }, ["Resolve"]),
    ]),
    el("div", { class: "lifecycle" }, [
      el("div", { class: "steps" }, [
        step("Connect wallet to Bradbury", Boolean(state.account)),
        step("Submit write (open_claim or resolve)", Boolean(state.hash)),
        step(state.stage || "Wait for consensus", Boolean(state.hash) && !state.error),
        step("Read accepted state via get_claim", Boolean(state.claim && !state.claim.error)),
      ]),
    ]),
    banner(),
    claimCard(state.claim),
  ]);
  const foot = el("footer", { class: "footer" }, [
    el("div", {}, ["Contract ", el("a", { href: EXPLORER_ADDR, target: "_blank", rel: "noreferrer" }, [CONTRACT_ADDRESS])]),
    el("div", {}, [
      el("a", { href: "https://github.com/knisaci/CrossSourceAttestation", target: "_blank", rel: "noreferrer" }, ["Source"]),
      " · faucet ",
      el("a", { href: "https://testnet-faucet.genlayer.foundation", target: "_blank", rel: "noreferrer" }, ["GEN on Bradbury"]),
    ]),
  ]);
  root.append(el("div", { class: "app" }, [header, hero, el("div", { class: "grid" }, [openCard, resolveCard]), foot]));
}

async function withWalletWork(fn) {
  state.error = "";
  if (!state.account) {
    try {
      state.account = await connectWallet();
    } catch (e) {
      state.error = e.message || String(e);
      render();
      return;
    }
  }
  setBusy(true);
  try {
    await fn();
  } catch (e) {
    state.error = e.shortMessage || e.message || String(e);
    if (!state.stage || state.stage === "Idle") state.stage = "Write failed";
  } finally {
    setBusy(false);
    render();
  }
}

async function openClaim() {
  const standard = document.getElementById("standard").value.trim();
  const url_a = document.getElementById("url_a").value.trim();
  const url_b = document.getElementById("url_b").value.trim();
  await withWalletWork(async function () {
    const result = await sendWrite({
      address: state.account,
      functionName: "open_claim",
      args: [standard, url_a, url_b],
      onHash: function (h) { state.hash = h; state.stage = "open_claim submitted"; render(); },
      onStage: function (s) { state.stage = s; render(); },
    });
    state.hash = result.hash;
    let id = String(result.returned || "").replace(/[^0-9]/g, "");
    if (id) {
      state.lastClaimId = id;
      localStorage.setItem("cs_last_claim", id);
      state.claim = await getClaim(id);
      state.stage = result.ok ? ("Claim " + id + " opened") : ("Claim " + id + " submitted but execution looked unsuccessful");
    } else {
      state.stage = result.ok
        ? "Claim opened. If the id is missing from the receipt, read the next unused id."
        : "open_claim landed but execution may have reverted";
    }
  });
}

async function loadClaim() {
  const id = document.getElementById("claim_id").value.trim();
  state.error = "";
  state.lastClaimId = id;
  localStorage.setItem("cs_last_claim", id);
  try {
    state.claim = await getClaim(id);
    state.stage = state.claim.error ? "Read returned an error" : ("Loaded claim " + id);
  } catch (e) {
    state.error = e.message || String(e);
    state.stage = "Read failed";
  }
  render();
}

async function resolveClaim() {
  const id = document.getElementById("claim_id").value.trim();
  await withWalletWork(async function () {
    const result = await sendWrite({
      address: state.account,
      functionName: "resolve",
      args: [id],
      onHash: function (h) { state.hash = h; state.stage = "resolve submitted — validators fetching both pages"; render(); },
      onStage: function (s) { state.stage = s; render(); },
    });
    state.hash = result.hash;
    state.lastClaimId = id;
    localStorage.setItem("cs_last_claim", id);
    try { state.claim = await getClaim(id); } catch (_) {}
    state.stage = result.ok
      ? ("Resolved claim " + id + " · " + ((state.claim && state.claim.verdict) || "see state"))
      : "resolve accepted by the chain but execution may have errored (already resolved?)";
  });
}

render();
