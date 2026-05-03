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
  streakUnderGoal,
} from "./stats.js";
import { BADGES, evaluate, getById } from "./badges.js";
import { drawBarChart } from "./chart.js";

const state = load();
let currentRange = "week";

const $ = (sel) => document.querySelector(sel);

const els = {
  todayCount: $("#today-count"),
  todayGoal: $("#today-goal"),
  goalBar: $("#goal-bar"),
  logBtn: $("#log-btn"),
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
  settingsBtn: $("#settings-btn"),
  settingsDialog: $("#settings-dialog"),
  settingsClose: $("#settings-close"),
  settingsForm: $("#settings-form"),
  fGoal: $("#f-goal"),
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
  const goal = state.settings.dailyGoal;
  els.todayCount.textContent = today;
  els.todayGoal.textContent = goal;
  const pct = Math.min(100, (today / Math.max(1, goal)) * 100);
  els.goalBar.style.width = `${pct}%`;
  els.goalBar.classList.toggle("over", today > goal);

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
  drawBarChart(els.chart, buckets, { goal, labels });

  els.costSaved.textContent = fmtCurrency(costSaved(state));
  els.cigsAvoided.textContent = cigsAvoided(state);
  els.streak.textContent = streakUnderGoal(state.log, goal);

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
    el.title = `${b.name} — ${b.blurb}`;
    el.setAttribute("aria-label", `${b.name}: ${b.blurb}`);
    el.innerHTML = `<span class="badge-emoji">${b.emoji}</span><span class="badge-name">${b.name}</span>`;
    els.badges.appendChild(el);
  }
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

els.logBtn.addEventListener("click", () => {
  addEntry(state);
  if (navigator.vibrate) navigator.vibrate(20);
  els.logBtn.classList.remove("pulse");
  void els.logBtn.offsetWidth;
  els.logBtn.classList.add("pulse");
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

els.settingsBtn.addEventListener("click", () => {
  els.fGoal.value = state.settings.dailyGoal;
  els.fCost.value = state.settings.costPerCig;
  els.fCurrency.value = state.settings.currency;
  els.fBaseline.value = state.settings.baselinePerDay;
  els.settingsDialog.showModal();
});

els.settingsClose.addEventListener("click", () => els.settingsDialog.close());

els.settingsForm.addEventListener("submit", (e) => {
  e.preventDefault();
  updateSettings(state, {
    dailyGoal: Math.max(0, parseInt(els.fGoal.value, 10) || 0),
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
