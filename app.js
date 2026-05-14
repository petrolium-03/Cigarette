import {
  load,
  save,
  addEntry,
  removeLast,
  updateSettings,
  markBadgesSeen,
  loadActiveMode,
  saveActiveMode,
  resetMode,
  factoryReset,
  addPack,
  removeLastPack,
} from "./state.js";
import {
  countForDay,
  countForRange,
  bucketsByDay,
  costSaved,
  cigsAvoided,
  streakUnderLimit,
  effectiveCostPerCig,
  totalSpentOnPacks,
  packCount,
} from "./stats.js";
import { BADGES, evaluate, blurbText } from "./badges.js";
import { drawBarChart } from "./chart.js";
import { getMode } from "./modes.js";

let activeModeId = loadActiveMode();
let mode = getMode(activeModeId);
let state = load(activeModeId);
let currentRange = "week";

const $ = (sel) => document.querySelector(sel);

const els = {
  todayCount: $("#today-count"),
  todayLimit: $("#today-limit"),
  todaySub: $("#today-sub"),
  limitBar: $("#limit-bar"),
  logBtn: $("#log-btn"),
  cigGroup: $(".cig"),
  actionSub: $("#action-sub"),
  undoBtn: $("#undo-btn"),
  undoLabel: $("#undo-label"),
  rangeTabs: document.querySelectorAll(".range-tab"),
  rangeTitle: $("#range-title"),
  rangeTotal: $("#range-total"),
  rangeAvg: $("#range-avg"),
  chart: $("#chart"),
  costSaved: $("#cost-saved"),
  cigsAvoided: $("#cigs-avoided"),
  impactAvoidedLabel: $("#impact-avoided-label"),
  streak: $("#streak"),
  badges: $("#badges"),
  toast: $("#toast"),
  badgeDialog: $("#badge-dialog"),
  badgeClose: $("#badge-close"),
  badgeDEmoji: $("#badge-d-emoji"),
  badgeDName: $("#badge-d-name"),
  badgeDBlurb: $("#badge-d-blurb"),
  badgeDStatus: $("#badge-d-status"),
  settingsBtn: $("#settings-btn"),
  settingsDialog: $("#settings-dialog"),
  settingsClose: $("#settings-close"),
  settingsForm: $("#settings-form"),
  settingsH: $("#settings-h"),
  lblLimit: $("#lbl-limit"),
  lblBaseline: $("#lbl-baseline"),
  fLimit: $("#f-limit"),
  fBaseline: $("#f-baseline"),
  resetBtn: $("#reset-btn"),
  factoryResetBtn: $("#factory-reset-btn"),
  menuBtn: $("#menu-btn"),
  sidebar: $("#sidebar"),
  sidebarBackdrop: $("#sidebar-backdrop"),
  sidebarClose: $("#sidebar-close"),
  sbStatsH: $("#sb-stats-h"),
  sbToday: $("#sb-today"),
  sbAvoided: $("#sb-avoided"),
  sbAvoidedLabel: $("#sb-avoided-label"),
  sbSaved: $("#sb-saved"),
  sbStreak: $("#sb-streak"),
  sbItems: document.querySelectorAll(".sb-item"),
  modeOpts: document.querySelectorAll(".mode-opt"),
  packBtn: $("#pack-btn"),
  packBtnLabel: $("#pack-btn-label"),
  packDialog: $("#pack-dialog"),
  packForm: $("#pack-form"),
  packCancel: $("#pack-cancel"),
  packH: $("#pack-h"),
  packCountLbl: $("#pack-count-lbl"),
  packCostLbl: $("#pack-cost-lbl"),
  packFCount: $("#pack-f-count"),
  packFCost: $("#pack-f-cost"),
  packSummary: $("#pack-summary"),
  packSpent: $("#pack-spent"),
  packCountOut: $("#pack-count"),
  packUnit: $("#pack-unit"),
  packRate: $("#pack-rate"),
  packRateNoun: $("#pack-rate-noun"),
  packUndo: $("#pack-undo"),
};

function fmtCurrency(n) {
  return `${state.settings.currency}${n.toFixed(2)}`;
}

function relTime(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(ts).toLocaleString();
}

function applyMode() {
  // Sets the mode-dependent attribute (drives icon swap + thumb position)
  // and updates all noun-bearing labels in one place.
  document.documentElement.dataset.mode = activeModeId;
  els.logBtn.setAttribute("aria-label", `Stub out a ${mode.singularNoun}`);
  els.actionSub.textContent = mode.actionSub;
  els.impactAvoidedLabel.textContent = `${mode.shortPlural} your lungs skipped`;
  els.sbStatsH.textContent = `${mode.label} stats`;
  els.sbAvoidedLabel.textContent = `${capitalize(mode.shortPlural)} your lungs skipped`;
  els.settingsH.textContent = `${mode.label} settings`;
  els.lblLimit.textContent = `Daily limit (${mode.pluralNoun})`;
  els.lblBaseline.textContent = `Baseline ${mode.shortPlural}/day (your "before")`;
  els.packBtnLabel.textContent = mode.purchaseLabel;
  els.packH.textContent = mode.purchaseTitle;
  els.packCountLbl.textContent = mode.purchaseCountLabel;
  els.packCostLbl.textContent = mode.purchaseCostLabel;
  els.packRateNoun.textContent = mode.shortNoun;
  els.modeOpts.forEach((opt) => {
    const isActive = opt.dataset.mode === activeModeId;
    opt.setAttribute("aria-checked", String(isActive));
  });
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function render() {
  const today = countForDay(state.log);
  const limit = state.settings.dailyLimit;
  els.todayCount.textContent = today;
  els.todayLimit.textContent = limit;

  const remaining = Math.max(0, limit - today);
  if (today === 0) {
    els.todaySub.textContent = `Daily limit ${limit} — clean so far today`;
  } else if (today <= limit) {
    els.todaySub.textContent = `${remaining} under your daily limit of ${limit}`;
  } else {
    els.todaySub.textContent = `${today - limit} over your daily limit of ${limit}`;
  }

  const pct = Math.min(100, (today / Math.max(1, limit)) * 100);
  els.limitBar.style.width = `${pct}%`;
  els.limitBar.classList.toggle("over", today > limit);

  const last = state.log[state.log.length - 1];
  els.undoBtn.disabled = !last;
  els.undoLabel.textContent = last ? `Undo last (${relTime(last)})` : "Nothing to undo";

  const days = currentRange === "day" ? 1 : currentRange === "week" ? 7 : 30;
  const total = countForRange(state.log, days);
  const avg = (total / days).toFixed(1);
  els.rangeTitle.textContent =
    currentRange === "day" ? "Today" : currentRange === "week" ? "Last 7 days" : "Last 30 days";
  els.rangeTotal.textContent = total;
  els.rangeAvg.textContent = avg;

  const buckets = bucketsByDay(state.log, days);
  const labels = days <= 7 ? labelDays(days) : null;
  drawBarChart(els.chart, buckets, { goal: limit, labels });

  els.costSaved.textContent = fmtCurrency(costSaved(state));
  els.cigsAvoided.textContent = cigsAvoided(state);
  els.streak.textContent = streakUnderLimit(state.log, limit);

  renderSidebarStats(today, limit);
  renderPackSummary();
  renderBadges();
}

function renderPackSummary() {
  const n = packCount(state);
  if (n === 0) {
    els.packSummary.hidden = true;
    return;
  }
  els.packSummary.hidden = false;
  els.packSpent.textContent = fmtCurrency(totalSpentOnPacks(state));
  els.packCountOut.textContent = n;
  els.packUnit.textContent = n === 1 ? mode.purchaseUnit : mode.purchaseUnitPlural;
  els.packRate.textContent = fmtCurrency(effectiveCostPerCig(state));
}

function renderSidebarStats(today, limit) {
  els.sbToday.textContent = today;
  els.sbAvoided.textContent = cigsAvoided(state);
  els.sbSaved.textContent = fmtCurrency(costSaved(state));
  els.sbStreak.textContent = `${streakUnderLimit(state.log, limit)} d`;
}

function labelDays(n) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2));
  }
  return out;
}

function renderBadges() {
  els.badges.innerHTML = "";
  for (const b of BADGES) {
    const earned = state.badges.earned.includes(b.id);
    const el = document.createElement("button");
    el.type = "button";
    el.className = `badge ${earned ? "earned" : "locked"}`;
    el.setAttribute("aria-label", `${b.name} — ${earned ? "unlocked" : "locked"}`);
    el.innerHTML = `<span class="badge-emoji">${b.emoji}</span><span class="badge-name">${b.name}</span>`;
    el.addEventListener("click", () => showBadge(b, earned));
    els.badges.appendChild(el);
  }
}

function showBadge(badge, earned) {
  els.badgeDEmoji.textContent = badge.emoji;
  els.badgeDName.textContent = badge.name;
  els.badgeDBlurb.textContent = blurbText(badge, mode);
  els.badgeDStatus.textContent = earned ? "Unlocked" : "Locked";
  els.badgeDialog.classList.toggle("unlocked", earned);
  els.badgeDialog.classList.toggle("locked", !earned);
  els.badgeDialog.showModal();
}

function toast(msg, emoji = "🎉") {
  els.toast.innerHTML = `<span class="toast-emoji">${emoji}</span><span>${msg}</span>`;
  els.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove("show"), 3000);
}

function checkBadges() {
  const newly = evaluate(state);
  if (!newly.length) return;
  markBadgesSeen(state, newly.map((b) => b.id));
  // Flip the just-unlocked badges from grey to colour right away so
  // the toast and the badge state are visually consistent.
  renderBadges();
  if (newly.length === 1) {
    const b = newly[0];
    toast(`${b.name} unlocked! ${blurbText(b, mode)}`, b.emoji);
  } else {
    toast(`${newly.length} milestones unlocked!`, "🎉");
  }
}

function triggerStubAnimation() {
  els.logBtn.classList.remove("stubbing");
  void els.logBtn.offsetWidth;
  els.logBtn.classList.add("stubbing");
}

function switchMode(newModeId) {
  if (newModeId === activeModeId || !getMode(newModeId)) return;
  activeModeId = newModeId;
  mode = getMode(newModeId);
  saveActiveMode(newModeId);
  state = load(newModeId);
  applyMode();
  render();
  checkBadges();
  toast(`Switched to ${mode.label} mode`, mode.emoji);
}

els.logBtn.addEventListener("animationend", (e) => {
  if (e.animationName === "stub-out") {
    els.logBtn.classList.remove("stubbing");
  }
});

els.logBtn.addEventListener("click", () => {
  addEntry(state);
  if (navigator.vibrate) navigator.vibrate(20);
  triggerStubAnimation();
  render();
  checkBadges();
});

els.undoBtn.addEventListener("click", () => {
  if (!state.log.length) return;
  removeLast(state);
  render();
});

els.rangeTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    currentRange = tab.dataset.range;
    els.rangeTabs.forEach((t) => t.classList.toggle("active", t === tab));
    render();
  });
});

els.badgeClose.addEventListener("click", () => els.badgeDialog.close());
els.badgeDialog.addEventListener("click", (e) => {
  const r = els.badgeDialog.getBoundingClientRect();
  if (
    e.clientX < r.left || e.clientX > r.right ||
    e.clientY < r.top  || e.clientY > r.bottom
  ) {
    els.badgeDialog.close();
  }
});

els.settingsBtn.addEventListener("click", () => {
  els.fLimit.value = state.settings.dailyLimit;
  els.fBaseline.value = state.settings.baselinePerDay;
  els.settingsDialog.showModal();
});

els.settingsClose.addEventListener("click", () => els.settingsDialog.close());

els.settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  updateSettings(state, {
    dailyLimit: Math.max(0, parseInt(els.fLimit.value, 10) || 0),
    baselinePerDay: Math.max(0, parseInt(els.fBaseline.value, 10) || 0),
  });
  els.settingsDialog.close();
  render();
  checkBadges();
});

els.resetBtn.addEventListener("click", () => {
  if (!confirm(`Erase all ${mode.label.toLowerCase()} mode data? This cannot be undone.`)) return;
  resetMode(activeModeId);
  state = load(activeModeId);
  els.settingsDialog.close();
  render();
});

els.factoryResetBtn.addEventListener("click", () => {
  if (
    !confirm(
      "Wipe ALL data — both Cigarette and Joint modes, all packs, all badges, and your mode preference? This cannot be undone."
    )
  ) {
    return;
  }
  factoryReset();
  location.reload();
});

function openSidebar() {
  els.sidebar.classList.add("open");
  els.sidebarBackdrop.classList.add("open");
  els.sidebar.setAttribute("aria-hidden", "false");
  els.menuBtn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  els.sidebar.classList.remove("open");
  els.sidebarBackdrop.classList.remove("open");
  els.sidebar.setAttribute("aria-hidden", "true");
  els.menuBtn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

els.menuBtn.addEventListener("click", openSidebar);
els.sidebarClose.addEventListener("click", closeSidebar);
els.sidebarBackdrop.addEventListener("click", closeSidebar);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.sidebar.classList.contains("open")) closeSidebar();
});

const PLACEHOLDER_LABELS = {
  leaderboard: "Leaderboard",
  achievements: "Achievements",
  settings: "Settings",
};
els.sbItems.forEach((b) => {
  b.addEventListener("click", () => {
    const label = PLACEHOLDER_LABELS[b.dataset.action] || "This";
    closeSidebar();
    toast(`${label} — coming soon`, "🚧");
  });
});

els.modeOpts.forEach((opt) => {
  opt.addEventListener("click", () => {
    switchMode(opt.dataset.mode);
  });
});

els.packBtn.addEventListener("click", () => {
  const last = state.packs?.[state.packs.length - 1];
  els.packFCount.value = last?.count ?? mode.defaultPurchaseCount;
  els.packFCost.value = last?.cost?.toFixed(2) ?? "";
  els.packDialog.showModal();
  // Focus the cost field since count usually stays the same.
  setTimeout(() => els.packFCost.focus(), 0);
});

els.packCancel.addEventListener("click", () => els.packDialog.close());

els.packForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const count = parseInt(els.packFCount.value, 10);
  const cost = parseFloat(els.packFCost.value);
  if (!(count > 0) || !(cost >= 0) || Number.isNaN(cost)) return;
  addPack(state, { count, cost });
  els.packDialog.close();
  toast(
    `${mode.purchaseTitle} saved · ${fmtCurrency(cost / count)}/${mode.shortNoun}`,
    "📦"
  );
  render();
  checkBadges();
});

els.packDialog.addEventListener("click", (e) => {
  const r = els.packDialog.getBoundingClientRect();
  if (
    e.clientX < r.left || e.clientX > r.right ||
    e.clientY < r.top  || e.clientY > r.bottom
  ) {
    els.packDialog.close();
  }
});

els.packUndo.addEventListener("click", () => {
  const removed = removeLastPack(state);
  if (!removed) return;
  render();
  toast(
    `Removed ${mode.purchaseUnit} (${fmtCurrency(removed.cost)}, ${removed.count} ${mode.pluralNoun})`,
    "↶"
  );
});

setInterval(() => {
  if (state.log.length) render();
}, 30_000);

applyMode();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
