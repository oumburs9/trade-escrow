/* global ethers, ESCROW_CONFIG */
const STATUS = ["Funded", "Shipped", "Released", "Refunded"];
const NETWORKS = {
  11155111: { name: "Sepolia", explorer: "https://sepolia.etherscan.io" },
  31337: { name: "Localhost", explorer: "" },
};

let provider, signer, account, contract;

const $ = (id) => document.getElementById(id);
const short = (a) => `${a.slice(0, 6)}…${a.slice(-4)}`;

function toast(msg, isError = false) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "toast" + (isError ? " error" : "");
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 5000);
}

function niceError(e) {
  if (e?.code === "ACTION_REJECTED") return "You cancelled the transaction.";
  const name = e?.revert?.name || e?.info?.error?.data?.message;
  const map = {
    NoPayment: "Enter a payment amount.",
    InvalidParty: "Buyer, exporter and inspector must be three different addresses.",
    DeadlineInPast: "Deadline must be in the future.",
    NotBuyer: "Only the buyer can do this.",
    NotExporter: "Only the exporter can do this.",
    NotInspector: "Only the inspector can do this.",
    WrongStatus: "This deal is not at the right step for that action.",
    DeadlineNotReached: "The deadline hasn't passed yet.",
  };
  return map[name] || e?.shortMessage || e?.message || "Something went wrong.";
}

async function connect() {
  if (!window.ethereum) {
    toast("No wallet found. Install MetaMask or another browser wallet.", true);
    return;
  }
  if (!ESCROW_CONFIG.address) {
    toast("The contract isn't deployed yet. Run `npm run deploy:sepolia` and push frontend/config.js.", true);
    return;
  }
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  account = (await signer.getAddress()).toLowerCase();

  const { chainId } = await provider.getNetwork();
  const net = NETWORKS[Number(chainId)];
  const expected = Number(ESCROW_CONFIG.chainId);
  if (Number(chainId) !== expected) {
    $("network").textContent = `Wrong network — switch to ${NETWORKS[expected]?.name || expected}`;
    $("network").className = "pill Refunded";
    await switchNetwork(expected);
    return;
  }

  contract = new ethers.Contract(ESCROW_CONFIG.address, ESCROW_CONFIG.abi, signer);
  $("network").textContent = `${net?.name || chainId} · ${short(account)}`;
  $("network").className = "pill Released";
  $("connect").textContent = "Connected";
  $("connect").disabled = true;
  await loadDeals();
}

async function switchNetwork(chainId) {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x" + chainId.toString(16) }],
    });
  } catch (e) {
    toast("Please switch your wallet to the right network.", true);
  }
}

function roleOf(d) {
  const roles = [];
  if (d.buyer.toLowerCase() === account) roles.push("Buyer");
  if (d.exporter.toLowerCase() === account) roles.push("Exporter");
  if (d.inspector.toLowerCase() === account) roles.push("Inspector");
  return roles;
}

function renderDeal(id, d) {
  const status = STATUS[Number(d.status)];
  const roles = roleOf(d);
  const deadline = new Date(Number(d.deadline) * 1000);
  const expired = Date.now() > deadline.getTime();
  const open = status === "Funded" || status === "Shipped";

  const stepsOn = { Funded: 1, Shipped: 2, Released: 4, Refunded: 4 }[status];
  const steps = [1, 2, 3, 4].map((i) => `<span class="${i <= stepsOn ? "on" : ""}"></span>`).join("");

  const btns = [];
  if (roles.includes("Exporter") && status === "Funded")
    btns.push(`<button class="btn primary small" data-act="ship" data-id="${id}">Mark shipped</button>`);
  if (roles.includes("Inspector") && status === "Shipped")
    btns.push(`<button class="btn primary small" data-act="approve" data-id="${id}">Approve &amp; release payment</button>`);
  if (roles.includes("Inspector") && open)
    btns.push(`<button class="btn danger small" data-act="reject" data-id="${id}">Reject &amp; refund buyer</button>`);
  if (roles.includes("Buyer") && open && expired)
    btns.push(`<button class="btn danger small" data-act="refund" data-id="${id}">Claim refund</button>`);

  const el = document.createElement("article");
  el.className = "deal";
  el.innerHTML = `
    <div class="deal-top">
      <div>
        <span class="deal-title"></span>
        <span class="muted small">#${id}</span>
      </div>
      <span class="deal-amount">${ethers.formatEther(d.amount)} ETH</span>
    </div>
    <div class="steps ${status === "Refunded" ? "refunded" : ""}">${steps}</div>
    <div>
      <span class="pill ${status}">${status}</span>
      ${roles.map((r) => `<span class="pill role">You: ${r}</span>`).join(" ")}
      <span class="muted small">· deadline ${deadline.toLocaleDateString()}${open && expired ? " (passed)" : ""}</span>
    </div>
    <dl class="parties">
      <dt>Buyer</dt><dd>${d.buyer}</dd>
      <dt>Exporter</dt><dd>${d.exporter}</dd>
      <dt>Inspector</dt><dd>${d.inspector}</dd>
    </dl>
    <div class="actions">${btns.join("")}</div>`;
  el.querySelector(".deal-title").textContent = d.product || "Untitled deal";
  return el;
}

async function loadDeals() {
  if (!contract) return;
  const list = $("list");
  list.innerHTML = `<p class="muted">Loading…</p>`;
  try {
    const count = Number(await contract.dealCount());
    const mineOnly = $("mineOnly").checked;
    const items = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = await contract.getDeal(i);
      if (mineOnly && roleOf(d).length === 0) continue;
      items.push(renderDeal(i, d));
    }
    list.innerHTML = "";
    if (!items.length) list.innerHTML = `<p class="muted">No deals yet. Create one on the left.</p>`;
    items.forEach((el) => list.appendChild(el));
  } catch (e) {
    list.innerHTML = `<p class="muted">Could not load deals: ${niceError(e)}</p>`;
  }
}

async function send(promiseFn, okMsg) {
  try {
    const tx = await promiseFn();
    toast("Transaction sent. Waiting for confirmation…");
    await tx.wait();
    toast(okMsg);
    await loadDeals();
  } catch (e) {
    toast(niceError(e), true);
  }
}

$("connect").addEventListener("click", () => connect().catch((e) => toast(niceError(e), true)));
$("refresh").addEventListener("click", loadDeals);
$("mineOnly").addEventListener("change", loadDeals);

$("create").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  if (!contract) return toast("Connect your wallet first.", true);
  const f = new FormData(ev.target);
  const exporterRaw = f.get("exporter").trim().toLowerCase();
  const inspectorRaw = f.get("inspector").trim().toLowerCase();
  if (!ethers.isAddress(exporterRaw) || !ethers.isAddress(inspectorRaw))
    return toast("Exporter and inspector must be valid 0x addresses.", true);
  const exporter = ethers.getAddress(exporterRaw);
  const inspector = ethers.getAddress(inspectorRaw);
  const deadline = Math.floor(Date.now() / 1000) + Number(f.get("days")) * 86400;
  await send(
    () => contract.createDeal(exporter, inspector, deadline, f.get("product").trim(), {
      value: ethers.parseEther(String(f.get("amount"))),
    }),
    "Deal created. Payment is locked in escrow."
  );
  ev.target.reset();
});

$("list").addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button[data-act]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const act = btn.dataset.act;
  btn.disabled = true;
  if (act === "ship") {
    const ref = prompt("Shipment reference (bill of lading / container no.)", "") ?? "";
    await send(() => contract.markShipped(id, ref), "Marked as shipped.");
  } else if (act === "approve") {
    await send(() => contract.approve(id), "Approved. Payment released to the exporter.");
  } else if (act === "reject") {
    const reason = prompt("Reason for rejection", "Failed quality inspection");
    if (reason === null) { btn.disabled = false; return; }
    await send(() => contract.reject(id, reason), "Rejected. Buyer refunded.");
  } else if (act === "refund") {
    await send(() => contract.claimRefund(id), "Refund claimed.");
  }
  btn.disabled = false;
});

if (window.ethereum) {
  window.ethereum.on?.("accountsChanged", () => location.reload());
  window.ethereum.on?.("chainChanged", () => location.reload());
}

(function initFooter() {
  const net = NETWORKS[Number(ESCROW_CONFIG.chainId)];
  const a = $("contractLink");
  a.textContent = ESCROW_CONFIG.address || "not deployed yet";
  if (net?.explorer && ESCROW_CONFIG.address) a.href = `${net.explorer}/address/${ESCROW_CONFIG.address}`;
})();
