/* Opskeep Admin — dashboard logic (vanilla, no deps) */

const state = {
  view: "overview",
  clients: [],
  runs: [],
  currentClientId: null,
  runner: null,
  runFilter: "all",
  refreshTimers: [],
  providers: [],
  pricing: {},
};

const KEY_STATUS_LABEL = {
  connected: "Connected",
  invalid: "Invalid",
  rate_limited: "Rate limited",
  not_checked: "Not checked",
  removed: "Removed",
};
const KEY_STATUS_PILL = {
  connected: "running",
  invalid: "removed",
  rate_limited: "removed",
  not_checked: "queued",
  removed: "removed",
};

const $ = (sel) => document.querySelector(sel);
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function showToast(message, tone = "error") {
  const region = $("#toast-region");
  const toast = document.createElement("div");
  toast.className = `toast toast-${tone}`;
  toast.innerHTML = `<span>${tone === "success" ? "✓" : "!"}</span><p>${esc(message)}</p>`;
  region.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 180);
  }, 4200);
}

async function api(path, opts = {}) {
  const res = await fetch(path, {
    method: opts.method || "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : {},
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) {
    window.location.href = "/login.html";
    throw new Error("unauthorized");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || res.statusText || "Request failed"), { status: res.status });
  return data;
}

/* ---------- data loading ---------- */

async function loadClients() {
  state.clients = (await api("/api/clients")).clients;
}

async function loadRuns() {
  const data = await api("/api/agents/runs");
  state.runs = data.runs || [];
}

async function loadProviders() {
  const data = await api("/api/providers");
  state.providers = data.providers || [];
  return data;
}

async function loadPricing() {
  const data = await api("/api/pricing");
  state.pricing = {};
  (data.pricing || []).forEach((p) => { state.pricing[`${p.provider}::${p.model}`] = p; });
}

function providerLabel(id) {
  return state.providers.find((p) => p.id === id)?.label || id;
}

function populateProviderSelect(select) {
  select.innerHTML = `<option value="">Select a provider…</option>${state.providers
    .map((p) => `<option value="${esc(p.id)}">${esc(p.label)}</option>`)
    .join("")}`;
}

function populateModelSelect(select, providerId) {
  const provider = state.providers.find((p) => p.id === providerId);
  select.innerHTML = `<option value="">Any model</option>${(provider?.models || [])
    .map((m) => `<option value="${esc(m.id)}">${esc(m.label)}</option>`)
    .join("")}`;
}

/* ---------- client helpers ---------- */

function clientCached(id) {
  return state.clients.find((c) => c.id === id);
}

function creditTotals(client) {
  const purchases = (client.purchases || []).reduce((a, p) => a + (Number(p.credits) || 0), 0);
  const used = (client.usage || []).reduce((a, u) => a + (Number(u.credits) || 0), 0);
  return { purchases, used, left: purchases - used };
}

/* ---------- navigation ---------- */

function showView(name) {
  state.view = name;
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${name}`));
  document.querySelectorAll(".side-link").forEach((l) => {
    const on = l.dataset.view === name;
    l.classList.toggle("is-active", on);
    if (on) l.setAttribute("aria-current", "page");
    else l.removeAttribute("aria-current");
  });
  closeDrawer();
}

async function openClient(id) {
  state.currentClientId = id;
  showView("client");
  await renderClient(id);
}

/* ---------- rendering ---------- */

function renderClients() {
  const body = $("#clients-body");
  body.innerHTML = "";
  state.clients.forEach((c) => {
    const left = Number(c.remaining) || 0;
    const row = document.createElement("tr");
    row.className = "row-click";
    row.dataset.id = c.id;
    row.innerHTML = `
      <td><strong>${esc(c.name)}</strong></td>
      <td class="mono">${esc(c.website)}</td>
      <td class="mono">${Number(c.keys) || 0}</td>
      <td class="mono">${Number(c.purchased) || 0}</td>
      <td class="mono">${Number(c.used) || 0}</td>
      <td class="mono${left <= 0 ? " status-pill pill-removed" : ""}">${left}</td>`;
    row.addEventListener("click", () => openClient(c.id));
    body.appendChild(row);
  });
  $("#clients-empty").hidden = state.clients.length > 0;
  state.currentClientId = null;
}

function renderOverview() {
  const totals = state.clients.reduce((acc, client) => {
    acc.keys += Number(client.keys) || 0;
    acc.purchased += Number(client.purchased) || 0;
    acc.used += Number(client.used) || 0;
    return acc;
  }, { keys: 0, purchased: 0, used: 0 });
  const activeRuns = state.runs.filter((run) => run.status === "queued" || run.status === "running").length;
  const remaining = totals.purchased - totals.used;
  $("#overview-metrics").innerHTML = [
    metricCard("Clients", state.clients.length, "websites under management"),
    metricCard("Credit balance", remaining, `${totals.used} used of ${totals.purchased}`),
    metricCard("Active keys", totals.keys, "encrypted at rest"),
    metricCard("Open runs", activeRuns, activeRuns ? "queued or in progress" : "nothing waiting"),
  ].join("");

  const attention = [];
  state.clients.forEach((client) => {
    const left = Number(client.remaining) || 0;
    if (left <= 10) attention.push({ tone: "warn", title: `${client.name} is low on credits`, detail: `${left} credits remaining`, view: "client", id: client.id });
    if (!(Number(client.keys) || 0)) attention.push({ tone: "neutral", title: `${client.name} has no active keys`, detail: client.website, view: "client", id: client.id });
  });
  state.runs.filter((run) => run.status === "queued").forEach((run) => {
    attention.push({ tone: "neutral", title: "Agent run is waiting", detail: run.task || run.id, view: "runs" });
  });
  $("#attention-count").textContent = attention.length;
  $("#attention-list").innerHTML = attention.length
    ? attention.slice(0, 6).map((item) => `<button class="attention-item" data-attention-view="${item.view}" data-client-id="${esc(item.id || "")}"><span class="attention-dot ${item.tone}"></span><span><strong>${esc(item.title)}</strong><small>${esc(item.detail)}</small></span><b aria-hidden="true">&rarr;</b></button>`).join("")
    : `<div class="empty-state"><span class="empty-mark">&#10003;</span><strong>Everything is in order.</strong><p>Low balances, missing keys, and queued runs will appear here.</p></div>`;

  const recent = state.runs.slice(0, 5);
  $("#overview-activity").innerHTML = recent.length
    ? recent.map((run) => `<div class="activity-item"><span class="status-pill pill-${esc(run.status)}">${esc(run.status)}</span><span><strong>${esc(run.task || "Untitled run")}</strong><small>${esc(run.clientName || clientCached(run.clientId)?.name || run.clientId)}</small></span><time>${formatCompactDate(run.startedAt || run.createdAt)}</time></div>`).join("")
    : `<div class="empty-state compact"><strong>No agent runs yet.</strong><p>Queued work will show up here.</p></div>`;
}

function metricCard(label, value, note) {
  return `<div class="metric-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;
}

function formatCompactDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

async function renderClient(id) {
  const client = await api(`/api/clients/${encodeURIComponent(id)}`);
  const t = creditTotals(client);
  $("#client-title").textContent = client.name;
  $("#client-sub").textContent = `${client.website} · ${client.id}`;
  $("#client-balance").innerHTML = [
    balanceCell("Left", t.left, t.left <= 10),
    balanceCell("Bought", t.purchases),
    balanceCell("Used", t.used),
    balanceCell("Keys", (client.keys || []).length),
  ].join("");
  $("#spending-limit-input").value = client.spendingLimit ?? "";
  $("#site-sync-url").value = client.syncUrl ?? "";
  $("#site-sync-secret").value = "";
  $("#site-sync-status").textContent = client.syncSecretConfigured
    ? (client.syncUrl ? "configured — ready to push keys" : "secret set, but no sync URL yet")
    : "not configured";
  $("#billing-from").value = "";
  $("#billing-to").value = "";
  $("#billing-summary-result").innerHTML = "";

  // keys
  const kb = $("#keys-body");
  kb.innerHTML = "";
  let connectedCount = 0;
  (client.keys || []).forEach((k) => {
    const removed = k.status === "removed";
    if (k.status === "connected") connectedCount++;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${esc(k.id)}</td>
      <td>${esc(providerLabel(k.provider))}</td>
      <td>${esc(k.model || "Any")}</td>
      <td>${esc(k.keyLabel || "")}</td>
      <td class="mono">${esc(k.keyMask || "")}</td>
      <td><span class="status-pill pill-${KEY_STATUS_PILL[k.status] || "queued"}" title="${k.lastError ? esc(k.lastError) : ""}">${esc(KEY_STATUS_LABEL[k.status] || k.status)}</span></td>
      <td>${removed ? "" : `<button class="btn btn-ghost btn-sm" data-verify-key="${esc(k.id)}">Verify</button> <button class="btn btn-ghost btn-sm" data-rotate-key="${esc(k.id)}">Rotate</button> ${client.syncUrl ? `<button class="btn btn-ghost btn-sm" data-push-key="${esc(k.id)}">Push to site</button>` : ""} <button class="btn btn-ghost btn-sm btn-danger" data-remove-key="${esc(k.id)}">Remove</button>`}</td>`;
    const rm = tr.querySelector("[data-remove-key]");
    if (rm) rm.addEventListener("click", async () => {
      await api(`/api/clients/${encodeURIComponent(id)}/keys/${esc(k.id)}`, { method: "DELETE" });
      renderClient(id);
    });
    const vf = tr.querySelector("[data-verify-key]");
    if (vf) vf.addEventListener("click", async () => {
      vf.disabled = true;
      vf.textContent = "Checking…";
      try {
        await api(`/api/clients/${encodeURIComponent(id)}/keys/${esc(k.id)}/verify`, { method: "POST" });
        await renderClient(id);
      } catch (err) {
        showToast(err.message);
        vf.disabled = false;
        vf.textContent = "Verify";
      }
    });
    const rot = tr.querySelector("[data-rotate-key]");
    if (rot) rot.addEventListener("click", async () => {
      const value = window.prompt(`New ${providerLabel(k.provider)} key value for ${k.keyLabel || k.id}. The old value is discarded immediately.`);
      if (!value) return;
      try {
        await api(`/api/clients/${encodeURIComponent(id)}/keys/${esc(k.id)}/rotate`, { method: "POST", body: { keyValue: value } });
        showToast("Key rotated. Verifying…", "success");
        await api(`/api/clients/${encodeURIComponent(id)}/keys/${esc(k.id)}/verify`, { method: "POST" }).catch(() => {});
        await renderClient(id);
      } catch (err) {
        showToast(err.message);
      }
    });
    const push = tr.querySelector("[data-push-key]");
    if (push) push.addEventListener("click", async () => {
      if (!window.confirm(`Push this ${providerLabel(k.provider)} key to ${client.name}'s site now? It will overwrite whatever key is currently stored there for this provider.`)) return;
      const enable = window.confirm(`Also enable ${providerLabel(k.provider)} live on the site immediately?\n\nOK = push and enable now.\nCancel = push the key but leave it exactly as enabled/disabled as it currently is there.`);
      push.disabled = true;
      push.textContent = "Pushing…";
      try {
        await api(`/api/clients/${encodeURIComponent(id)}/keys/${esc(k.id)}/push`, { method: "POST", body: enable ? { enabled: true } : {} });
        showToast(`Pushed to ${client.name}'s site${enable ? " and enabled." : "."}`, "success");
      } catch (err) {
        showToast(err.message);
      } finally {
        push.disabled = false;
        push.textContent = "Push to site";
      }
    });
    kb.appendChild(tr);
  });

  const note = $("#connected-keys-note");
  note.textContent = `${connectedCount} of ${(client.keys || []).length} connected — live runs need 3+`;
  note.classList.toggle("warn", connectedCount < 3);
  $("#client-run-live-hint").textContent = connectedCount >= 3
    ? `${connectedCount} connected keys ready — failover chain uses all of them.`
    : `Only ${connectedCount} of 3 required keys are connected. Verify more before running live.`;

  // purchases
  const pb = $("#purchases-body");
  pb.innerHTML = "";
  (client.purchases || []).slice().reverse().forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${esc(p.id)}</td>
      <td class="mono">${esc(p.credits)}</td>
      <td class="mono">${p.amount != null ? `${esc(p.amount)} ${esc(p.currency || "")}` : ""}</td>
      <td class="mono">${esc(p.ref || "")}</td>
      <td class="mono">${esc(p.date)}</td>`;
    pb.appendChild(tr);
  });

  // usage
  const ub = $("#usage-body");
  ub.innerHTML = "";
  (client.usage || []).slice().reverse().forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${esc(u.id)}</td>
      <td class="mono">${esc(u.credits)}</td>
      <td>${esc(u.action || "")}</td>
      <td>${esc(u.note || "")}</td>
      <td class="mono">${esc(u.date)}</td>`;
    ub.appendChild(tr);
  });

  // runs for this client
  const crb = $("#client-runs-body");
  crb.innerHTML = "";
  state.runs.filter((r) => r.clientId === id).forEach((r) => {
    crb.appendChild(runRow(r));
  });
}

function balanceCell(k, v, alert) {
  return `<div class="balance-cell${alert ? " alert" : ""}"><div class="k">${k}</div><div class="v">${v}</div></div>`;
}

function renderRuns() {
  const list = $("#runs-list");
  list.innerHTML = "";
  const visibleRuns = state.runs.filter((run) => {
    if (state.runFilter === "active") return run.status === "queued" || run.status === "running";
    if (state.runFilter === "completed") return run.status === "completed";
    return true;
  });
  visibleRuns.forEach((run) => list.appendChild(runCard(run)));
  $("#runs-empty").hidden = visibleRuns.length > 0;
  $("#runs-sub").textContent = `${state.runs.length} run${state.runs.length === 1 ? "" : "s"} on record`;
  const counts = state.runs.reduce((acc, run) => {
    acc[run.status] = (acc[run.status] || 0) + 1;
    return acc;
  }, {});
  $("#run-status-grid").innerHTML = [
    runStatusCell("Queued", counts.queued || 0, "Waiting to start", "queued"),
    runStatusCell("Running", counts.running || 0, "In progress", "running"),
    runStatusCell("Completed", counts.completed || 0, "Ready to reconcile", "completed"),
    runStatusCell("Needs review", (counts.failed || 0) + (counts.cancelled || 0), "Failed or cancelled", "failed"),
  ].join("");
}

function renderPricing() {
  const body = $("#pricing-body");
  body.innerHTML = "";
  state.providers.forEach((provider) => {
    (provider.models || []).forEach((model) => {
      const rate = state.pricing[`${provider.id}::${model.id}`];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${esc(provider.label)}</td>
        <td class="mono">${esc(model.id)}</td>
        <td><input class="pricing-input" type="number" min="0" step="any" placeholder="0.00" data-field="inputPer1M" value="${rate ? esc(rate.inputPer1M) : ""}"></td>
        <td><input class="pricing-input" type="number" min="0" step="any" placeholder="0.00" data-field="outputPer1M" value="${rate ? esc(rate.outputPer1M) : ""}"></td>
        <td class="mono">${rate ? esc(formatCompactDate(rate.updatedAt)) : "—"}</td>
        <td><button class="btn btn-ghost btn-sm" data-save-pricing>Save</button>${rate ? ` <button class="btn btn-ghost btn-sm btn-danger" data-clear-pricing>Clear</button>` : ""}</td>`;
      const inputEl = tr.querySelector('[data-field="inputPer1M"]');
      const outputEl = tr.querySelector('[data-field="outputPer1M"]');
      tr.querySelector("[data-save-pricing]").addEventListener("click", async () => {
        const inputPer1M = Number(inputEl.value);
        const outputPer1M = Number(outputEl.value);
        if (!Number.isFinite(inputPer1M) || inputPer1M < 0 || !Number.isFinite(outputPer1M) || outputPer1M < 0) {
          showToast("Enter a non-negative rate for both input and output.");
          return;
        }
        try {
          await api(`/api/pricing/${encodeURIComponent(provider.id)}/${encodeURIComponent(model.id)}`, {
            method: "PUT",
            body: { inputPer1M, outputPer1M },
          });
          await loadPricing();
          renderPricing();
          showToast(`${model.label} rate saved.`, "success");
        } catch (err) {
          showToast(err.message);
        }
      });
      const clearBtn = tr.querySelector("[data-clear-pricing]");
      if (clearBtn) clearBtn.addEventListener("click", async () => {
        await api(`/api/pricing/${encodeURIComponent(provider.id)}/${encodeURIComponent(model.id)}`, { method: "DELETE" });
        await loadPricing();
        renderPricing();
      });
      body.appendChild(tr);
    });
  });
}

function renderBillingSummary(summary) {
  const rangeLabel = summary.range.from || summary.range.to
    ? `${esc(summary.range.from || "start")} to ${esc(summary.range.to || "now")}`
    : "All-time";
  const rows = (items, kind) => items.length
    ? items.map((r) => `<tr>
        <td class="mono">${esc(String(r.date).slice(0, 10))}</td>
        <td>${esc(kind === "purchase" ? "Credit purchase" : (r.action || r.note || "Agent usage"))}</td>
        <td class="mono">${kind === "purchase" ? "+" : "-"}${esc(Math.abs(Number(r.credits) || 0))}</td>
        <td class="mono">${kind === "purchase" ? (r.amount != null ? `${esc(r.amount)} ${esc(r.currency || "")}` : "") : `$${esc((Number(r.credits) || 0).toFixed(2))}`}</td>
        <td>${esc(r.ref || r.note || "")}</td>
      </tr>`).join("")
    : `<tr><td colspan="5" class="muted">None in this period.</td></tr>`;
  return `
    <div class="billing-summary">
      <p class="muted">Period: ${rangeLabel}</p>
      <div class="billing-totals">
        ${balanceCell("Purchased", summary.totals.purchased)}
        ${balanceCell("Used", summary.totals.used)}
        ${balanceCell("Net", summary.totals.net)}
      </div>
      <h4>Credit purchases</h4>
      <div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Description</th><th>Credits</th><th>Amount</th><th>Ref</th></tr></thead><tbody>${rows(summary.purchases, "purchase")}</tbody></table></div>
      <h4>Usage</h4>
      <div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Description</th><th>Credits</th><th>Cost</th><th>Note</th></tr></thead><tbody>${rows(summary.usage, "usage")}</tbody></table></div>
    </div>`;
}

function runStatusCell(label, value, note, tone) {
  return `<div class="run-status-cell"><span class="attention-dot ${tone}"></span><div><small>${label}</small><strong>${value}</strong><p>${note}</p></div></div>`;
}

function runCard(run) {
  const client = clientCached(run.clientId);
  const name = client ? client.name : run.clientName || run.clientId;
  const website = run.clientWebsite || client?.website || "";
  const card = document.createElement("article");
  card.className = "run-card";
  const tokenNote = run.usage?.totalTokens != null ? `${run.usage.totalTokens} tokens (${run.usage.inputTokens ?? "?"} in / ${run.usage.outputTokens ?? "?"} out)` : null;
  const attemptCount = run.attempts?.length || 0;
  const succeededAttempt = run.attempts?.find((a) => a.status === "succeeded");
  const providerNote = succeededAttempt
    ? `${providerLabel(succeededAttempt.provider)}${attemptCount > 1 ? ` (fallback ${run.attempts.indexOf(succeededAttempt) + 1}/${attemptCount})` : ""}`
    : run.status === "failed" && attemptCount > 0
      ? `${attemptCount} key${attemptCount === 1 ? "" : "s"} tried, all failed`
      : null;
  card.innerHTML = `
    <div class="run-card-status"><span class="status-pill pill-${esc(run.status)}">${esc(run.status)}</span><span class="run-id">${esc(run.id)}</span></div>
    <div class="run-card-main"><h3>${esc(run.task || "Untitled run")}</h3><p>${esc(name)}${website ? ` · ${esc(website)}` : ""}</p>${run.result ? `<p class="run-result">${esc(run.result.slice(0, 400))}${run.result.length > 400 ? "…" : ""}</p>` : ""}</div>
    <div class="run-card-meta"><span><small>Started</small>${esc(formatCompactDate(run.startedAt || run.createdAt) || "—")}</span>${providerNote ? `<span><small>Provider</small>${esc(providerNote)}</span>` : ""}${tokenNote ? `<span><small>Usage</small>${esc(tokenNote)}</span>` : ""}<span><small>Credits</small>${run.status === "completed" ? esc(run.creditsBooked ?? "—") : "—"}</span></div>
    <div class="run-card-actions"></div>`;
  const actions = card.querySelector(".run-card-actions");
  if (run.status === "queued" || run.status === "running") {
    const complete = document.createElement("button");
    complete.className = "btn btn-sm";
    complete.textContent = run.status === "running" ? "Retry completion" : "Complete run";
    complete.addEventListener("click", () => completeRun(run.id));
    const cancel = document.createElement("button");
    cancel.className = "btn btn-ghost btn-sm btn-danger";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", async () => {
      try {
        await api(`/api/agents/runs/${esc(run.id)}/cancel`, { method: "POST" });
        await refreshRunState();
        showToast("Agent run cancelled.", "success");
      } catch (err) {
        showToast(err.message);
      }
    });
    actions.append(complete, cancel);
  } else if (run.status === "completed" && !run.usageBooked) {
    const book = document.createElement("button");
    book.className = "btn btn-sm";
    book.textContent = "Book usage";
    book.addEventListener("click", () => completeRun(run.id));
    actions.append(book);
  } else {
    actions.innerHTML = `<span class="run-finished">${run.finishedAt ? `Finished ${esc(formatCompactDate(run.finishedAt))}` : "No action needed"}</span>`;
  }
  return card;
}

function runRow(r, withClient = false) {
  const client = clientCached(r.clientId);
  const name = client ? client.name : r.clientName || r.clientId;
  const sub = r.clientWebsite || client?.website || "";
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="mono">${esc(r.id)}</td>
    ${withClient ? `<td>${esc(name)}${sub ? `<div class="muted" style="font-size:12px">${esc(sub)}</div>` : ""}</td>` : ""}
    <td>${esc(r.task || "")}</td>
    <td><span class="status-pill pill-${esc(r.status)}">${esc(r.status)}</span></td>
    <td class="mono">${r.status === "completed" ? esc(r.creditsBooked ?? "") : ""}</td>
    <td class="mono">${esc(r.startedAt || r.createdAt || "")}</td>`;
  const actions = document.createElement("td");
  if (r.status === "queued" || r.status === "running") {
    const stp = document.createElement("button");
    stp.className = "btn btn-ghost btn-sm";
    stp.textContent = r.status === "running" ? "Retry completion" : "Complete";
    stp.addEventListener("click", () => completeRun(r.id));
    const cancel = document.createElement("button");
    cancel.className = "btn btn-ghost btn-sm btn-danger";
    cancel.textContent = "Cancel";
    cancel.addEventListener("click", async () => {
      await api(`/api/agents/runs/${esc(r.id)}/cancel`, { method: "POST" });
      refreshRunState();
    });
    actions.appendChild(stp);
    actions.appendChild(cancel);
  } else if (r.status === "completed" && !r.usageBooked) {
    const book = document.createElement("button");
    book.className = "btn btn-ghost btn-sm";
    book.textContent = "Book usage";
    book.addEventListener("click", () => completeRun(r.id));
    actions.appendChild(book);
  }
  tr.appendChild(actions);
  return tr;
}

async function completeRun(runId) {
  const creditsStr = window.prompt("Credits to book for this run (from the agent's own run summary)?", "10");
  if (creditsStr === null) return;
  const credits = Number(creditsStr);
  if (!Number.isFinite(credits) || credits < 0) {
    showToast("Enter a non-negative number of credits.");
    return;
  }
  try {
    await api(`/api/agents/runs/${esc(runId)}/complete`, { method: "POST", body: { credits } });
  } catch (err) {
    showToast(err.message);
    return;
  }
  await refreshRunState();
}

/* ---------- shared refresh ---------- */

async function refreshRunState() {
  await Promise.all([loadClients(), loadRuns()]);
  renderOverview();
  if (state.view === "runs") renderRuns();
  if (state.view === "client" && state.currentClientId) renderClient(state.currentClientId);
}

/* ---------- mobile drawer ---------- */

function openDrawer() {
  const sidebar = $("#sidebar");
  sidebar.classList.add("is-open");
  $("#sidebar-backdrop").classList.add("is-open");
  const toggle = $("#sidebar-toggle");
  toggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("no-scroll");
}

function closeDrawer() {
  const sidebar = $("#sidebar");
  sidebar.classList.remove("is-open");
  $("#sidebar-backdrop").classList.remove("is-open");
  const toggle = $("#sidebar-toggle");
  toggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("no-scroll");
}

function wireFormToggle(button, form, openLabel, closeLabel) {
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    const willOpen = form.hidden;
    form.hidden = !willOpen;
    button.setAttribute("aria-expanded", String(willOpen));
    button.textContent = willOpen ? closeLabel : openLabel;
    if (willOpen) form.querySelector("input, select, textarea")?.focus();
  });
}

/* ---------- boot ---------- */

async function boot() {
  // session
  let me;
  try {
    me = await api("/api/me");
  } catch {
    return;
  }

  // drawer wiring
  $("#sidebar-toggle").addEventListener("click", () => {
    const open = $("#sidebar").classList.contains("is-open");
    if (open) closeDrawer();
    else openDrawer();
  });
  $("#sidebar-backdrop").addEventListener("click", closeDrawer);

  // runner status
  state.runner = me.runner || (me.runnerConfigured ? "configured" : null);
  const dot = $("#runner-dot");
  const txt = $("#runner-text");
  if (state.runner) {
    dot.classList.remove("off");
    txt.textContent = state.runner !== "configured" ? `${state.runner} runner connected` : "runner connected";
    $("#runner-hint").textContent = "Queued runs will be sent to the configured agent runner.";
  } else {
    dot.classList.add("off");
    txt.textContent = "runner not configured";
    $("#runner-hint").textContent = "No OPSKEEP_AGENT_RUNNER configured: queued runs wait here for manual completion.";
  }
  const panelDot = $("#runner-panel-dot");
  const panelTitle = $("#runner-panel-title");
  if (state.runner) {
    panelDot.classList.remove("off");
    panelTitle.textContent = "Runner connected";
  } else {
    panelDot.classList.add("off");
    panelTitle.textContent = "Manual completion mode";
  }
  $("#store-file").textContent = me.storeFile || "";

  try {
    const providersData = await loadProviders();
    await Promise.all([loadClients(), loadRuns(), loadPricing()]);
    $("#load-error").hidden = true;
    $("#vault-warning").hidden = providersData.vaultConfigured !== false;
  } catch (err) {
    $("#load-error-detail").textContent = err.message || "Check the server and try again.";
    $("#load-error").hidden = false;
    return;
  }

  populateProviderSelect($("#key-provider"));
  $("#key-provider").addEventListener("change", (e) => populateModelSelect($("#key-model"), e.target.value));
  populateModelSelect($("#key-model"), "");

  // client select options
  const sel = $("#run-client-select");
  sel.innerHTML = state.clients
    .map((c) => `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.website)})</option>`)
    .join("");

  async function refreshGlobalRunLiveHint() {
    const hint = $("#global-run-live-hint");
    if (!sel.value) { hint.textContent = 'Needs at least 3 keys verified "connected" for this client.'; return; }
    try {
      const client = await api(`/api/clients/${encodeURIComponent(sel.value)}`);
      const connectedCount = (client.keys || []).filter((k) => k.status === "connected").length;
      hint.textContent = connectedCount >= 3
        ? `${connectedCount} connected keys ready — failover chain uses all of them.`
        : `Only ${connectedCount} of 3 required keys are connected. Verify more before running live.`;
    } catch {
      /* leave as-is */
    }
  }
  sel.addEventListener("change", refreshGlobalRunLiveHint);
  if (sel.value) refreshGlobalRunLiveHint();

  renderClients();
  renderRuns();
  renderOverview();
  $("#overview-date").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  // sidebar nav
  document.querySelectorAll(".side-link").forEach((link) => {
    link.addEventListener("click", () => {
      showView(link.dataset.view);
      if (link.dataset.view === "overview") renderOverview();
      if (link.dataset.view === "runs") renderRuns();
      if (link.dataset.view === "pricing") renderPricing();
    });
  });

  // settings
  $("#settings-username").value = me.username || "";
  $("#settings-store-file").value = me.storeFile || "";
  $("#change-password-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    if (form.newPassword.value !== form.confirmPassword.value) {
      showToast("New password and confirmation don't match.");
      return;
    }
    if (form.newPassword.value.length < 8) {
      showToast("New password must be at least 8 characters.");
      return;
    }
    try {
      await api("/api/settings/password", {
        method: "POST",
        body: { currentPassword: form.currentPassword.value, newPassword: form.newPassword.value },
      });
      form.reset();
      showToast("Password updated.", "success");
    } catch (err) {
      showToast(err.message);
    }
  });

  document.querySelectorAll("[data-jump-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.jumpView)));
  document.querySelectorAll("[data-run-filter]").forEach((button) => button.addEventListener("click", () => {
    state.runFilter = button.dataset.runFilter;
    document.querySelectorAll("[data-run-filter]").forEach((item) => item.classList.toggle("is-active", item === button));
    renderRuns();
  }));
  $("#attention-list").addEventListener("click", (event) => {
    const item = event.target.closest("[data-attention-view]");
    if (!item) return;
    if (item.dataset.attentionView === "client") openClient(item.dataset.clientId);
    else showView(item.dataset.attentionView);
  });
  $("#retry-load").addEventListener("click", () => window.location.reload());

  // sign out
  $("#logout-btn").addEventListener("click", async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login.html";
  });

  // new client
  const ncf = $("#new-client-form");
  wireFormToggle($("#new-client-toggle"), ncf, "New client", "Close form");
  ncf.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = await api("/api/clients", {
        method: "POST",
        body: { name: ncf.name.value, website: ncf.website.value, notes: ncf.notes.value, spendingLimit: ncf.spendingLimit.value === "" ? undefined : Number(ncf.spendingLimit.value) },
      });
      ncf.reset();
      ncf.hidden = true;
      $("#new-client-toggle").textContent = "New client";
      $("#new-client-toggle").setAttribute("aria-expanded", "false");
      await loadClients();
      renderClients();
      sel.innerHTML = state.clients
        .map((c) => `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.website)})</option>`)
        .join("");
      showToast("Client registered.", "success");
      openClient(data.id);
    } catch (err) {
      showToast(err.message);
    }
  });

  // back to clients
  $("#client-back").addEventListener("click", () => { renderClients(); showView("clients"); });

  // spending limit
  $("#spending-limit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = $("#spending-limit-input").value;
    try {
      await api(`/api/clients/${encodeURIComponent(state.currentClientId)}`, {
        method: "PATCH",
        body: { spendingLimit: raw === "" ? null : Number(raw) },
      });
      showToast("Spending limit updated.", "success");
      await loadClients();
      renderClient(state.currentClientId);
    } catch (err) {
      showToast(err.message);
    }
  });

  // site sync
  $("#site-sync-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = $("#site-sync-url").value.trim();
    const secret = $("#site-sync-secret").value;
    try {
      await api(`/api/clients/${encodeURIComponent(state.currentClientId)}`, {
        method: "PATCH",
        body: { syncUrl: url || null, ...(secret ? { syncSecret: secret } : {}) },
      });
      showToast("Site sync settings saved.", "success");
      await renderClient(state.currentClientId);
    } catch (err) {
      showToast(err.message);
    }
  });

  // billing summary
  function billingQuery() {
    const from = $("#billing-from").value;
    const to = $("#billing-to").value;
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params;
  }
  $("#billing-generate").addEventListener("click", async () => {
    const container = $("#billing-summary-result");
    container.innerHTML = `<p class="muted">Loading…</p>`;
    try {
      const summary = await api(`/api/clients/${encodeURIComponent(state.currentClientId)}/billing-summary?${billingQuery()}`);
      container.innerHTML = renderBillingSummary(summary);
    } catch (err) {
      container.innerHTML = "";
      showToast(err.message);
    }
  });
  $("#billing-download-csv").addEventListener("click", () => {
    const params = billingQuery();
    params.set("format", "csv");
    window.open(`/api/clients/${encodeURIComponent(state.currentClientId)}/billing-summary?${params}`, "_blank");
  });
  $("#billing-download-pdf").addEventListener("click", () => {
    const params = billingQuery();
    params.set("format", "pdf");
    window.open(`/api/clients/${encodeURIComponent(state.currentClientId)}/billing-summary?${params}`, "_blank");
  });

  // key / purchase / usage forms (delegated in renderClient's own listeners are per-render;
  // forms live outside tbody so wire them once here)
  const akf = $("#add-key-form");
  wireFormToggle($("#add-key-toggle"), akf, "Add a key", "Close form");
  akf.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const key = await api(`/api/clients/${encodeURIComponent(state.currentClientId)}/keys`, {
        method: "POST",
        body: { provider: akf.provider.value, keyValue: akf.keyValue.value, model: akf.model.value, keyLabel: akf.keyLabel.value },
      });
      akf.reset();
      akf.hidden = true;
      $("#add-key-toggle").textContent = "Add a key";
      $("#add-key-toggle").setAttribute("aria-expanded", "false");
      await loadClients();
      showToast("Key saved. Verifying with the provider…", "success");
      await renderClient(state.currentClientId);
      try {
        await api(`/api/clients/${encodeURIComponent(state.currentClientId)}/keys/${esc(key.id)}/verify`, { method: "POST" });
      } catch { /* verify surfaces its own status in the table */ }
      await renderClient(state.currentClientId);
    } catch (err) {
      showToast(err.message);
    }
  });

  const apf = $("#add-purchase-form");
  wireFormToggle($("#add-purchase-toggle"), apf, "Record a top-up", "Close form");
  apf.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api(`/api/clients/${encodeURIComponent(state.currentClientId)}/purchases`, {
        method: "POST",
        body: {
          credits: Number(apf.credits.value),
          amount: apf.amount.value === "" ? null : Number(apf.amount.value),
          currency: apf.currency.value || "USD",
          ref: apf.ref.value,
        },
      });
      apf.reset();
      apf.hidden = true;
      $("#add-purchase-toggle").textContent = "Record a top-up";
      $("#add-purchase-toggle").setAttribute("aria-expanded", "false");
      await loadClients();
      showToast("Credits added.", "success");
      renderClient(state.currentClientId);
    } catch (err) {
      showToast(err.message);
    }
  });

  const auf = $("#add-usage-form");
  wireFormToggle($("#add-usage-toggle"), auf, "Record usage", "Close form");
  auf.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api(`/api/clients/${encodeURIComponent(state.currentClientId)}/usage`, {
        method: "POST",
        body: { credits: Number(auf.credits.value), action: auf.action.value, note: auf.note.value },
      });
      auf.reset();
      auf.hidden = true;
      $("#add-usage-toggle").textContent = "Record usage";
      $("#add-usage-toggle").setAttribute("aria-expanded", "false");
      await loadClients();
      showToast("Usage booked.", "success");
      renderClient(state.currentClientId);
    } catch (err) {
      showToast(err.message);
    }
  });

  // queue run from client detail
  const qrf = $("#queue-run-form");
  qrf.addEventListener("submit", async (e) => {
    e.preventDefault();
    const live = qrf.live.checked;
    try {
      await api("/api/agents/runs", {
        method: "POST",
        body: { clientRef: state.currentClientId, task: qrf.task.value, live },
      });
      qrf.reset();
      await refreshRunState();
      showToast(live ? "Agent run started (auto-failover)." : "Agent run queued.", "success");
    } catch (err) {
      showToast(err.message);
    }
  });

  // queue run from runs view
  const qg = $("#queue-run-global");
  qg.addEventListener("submit", async (e) => {
    e.preventDefault();
    const live = qg.live.checked;
    try {
      await api("/api/agents/runs", {
        method: "POST",
        body: { clientRef: sel.value, task: qg.task.value, live },
      });
      qg.reset();
      await refreshGlobalRunLiveHint();
      await refreshRunState();
      showToast(live ? "Agent run started (auto-failover)." : "Agent run queued.", "success");
    } catch (err) {
      showToast(err.message);
    }
  });

  // keep run list fresh while the dashboard is open
  state.refreshTimers.push(setInterval(async () => {
    try { await refreshRunState(); } catch { /* transient */ }
  }, 15000));
}

boot();
