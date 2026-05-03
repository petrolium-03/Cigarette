import {
  load,
  save,
  addEntry,
  removeLast,
  updateSettings,
  markBadgesSeen,
} from "./state.js";
import {
  countForDay,
  countForRange,
  bucketsByDay,
  costSaved,
  cigsAvoided,
  streakUnderLimit,
} from "./stats.js";
import { BADGES, evaluate } from "./badges.js";
import { drawBarChart } from "./chart.js";

const state = load();
let currentRange = "week";

const $ = (sel) => document.querySelector(sel);

const els = {
  todayCount: $("#today-count"),
  todayLimit: $("#today-limit"),
  todaySub: $("#today-sub"),
  limitBar: $("#limit-bar"),
  logBtn: $("#log-btn"),
  cigGroup: $(".cig"),
  undoBtn: $("#undo-btn"),
  undoLabel: $("#undo-label"),
  rangeTabs: document.querySelectorAll(".range-tab"),
  rangeTitle: $("#range-title"),
  rangeTotal: $("#range-total"),
  rangeAvg: $("#range-avg"),
  chart: $("#chart"),
  costSaved: $("#cost-saved"),
  cigsAvoided: $("#cigs-avoided"),
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
  fLimit: $("#f-limit"),
  fCost: $("#f-cost"),
  fCurrency: $("#f-currency"),
  fBaseline: $("#f-baseline"),
  resetBtn: $("#reset-btn"),
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

  renderBadges();
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
  els.badgeDBlurb.textContent = badge.blurb;
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
  newly.forEach((b, i) => {
    setTimeout(() => toast(`${b.name} unlocked! ${b.blurb}`, b.emoji), i * 600);
  });
}

function triggerStubAnimation() {
  els.logBtn.classList.remove("stubbing");
  // Force a reflow so the animation restarts cleanly on rapid taps.
  // Reading offsetWidth is the reliable cross-browser way.
  void els.logBtn.offsetWidth;
  els.logBtn.classList.add("stubbing");
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
  // Click on backdrop closes
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
  els.fCost.value = state.settings.costPerCig;
  els.fCurrency.value = state.settings.currency;
  els.fBaseline.value = state.settings.baselinePerDay;
  els.settingsDialog.showModal();
});

els.settingsClose.addEventListener("click", () => els.settingsDialog.close());

els.settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  updateSettings(state, {
    dailyLimit: Math.max(0, parseInt(els.fLimit.value, 10) || 0),
    costPerCig: Math.max(0, parseFloat(els.fCost.value) || 0),
    currency: els.fCurrency.value.trim().slice(0, 3) || "$",
    baselinePerDay: Math.max(0, parseInt(els.fBaseline.value, 10) || 0),
  });
  els.settingsDialog.close();
  render();
  checkBadges();
});

els.resetBtn.addEventListener("click", () => {
  if (!confirm("Erase all logs and settings? This cannot be undone.")) return;
  localStorage.removeItem("cigtracker.v1");
  location.reload();
});

setInterval(() => {
  if (state.log.length) render();
}, 30_000);

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
