import { MODES, DEFAULT_MODE, getMode } from "./modes.js";

const KEY_PREFIX = "cigtracker.v1";
const MODE_KEY = "cigtracker.mode";
const LEGACY_KEY = "cigtracker.v1";

function modeKey(modeId) {
  return `${KEY_PREFIX}.${modeId}`;
}

function defaultStateFor(modeId) {
  const meta = getMode(modeId);
  return {
    log: [],
    packs: [],
    settings: { ...meta.defaults },
    badges: { earned: [], lastSeenAt: 0 },
    createdAt: 0,
    _mode: modeId,
  };
}

function migrateLegacy() {
  // One-time: old single-key v1 data becomes the cigarette mode's data.
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;
  const newKey = modeKey("cigarette");
  if (localStorage.getItem(newKey) !== null) return;
  // Skip migrating if the legacy value happens to look like the new key
  // (it's the same string here, but keep the guard for safety).
  if (newKey === LEGACY_KEY) return;
  localStorage.setItem(newKey, legacy);
}

function migrateState(parsed, modeId) {
  const meta = getMode(modeId);
  const settings = { ...meta.defaults, ...(parsed.settings || {}) };
  if (parsed.settings && "dailyGoal" in parsed.settings && !("dailyLimit" in parsed.settings)) {
    settings.dailyLimit = parsed.settings.dailyGoal;
  }
  const earned = (parsed.badges?.earned || []).map((id) => {
    if (id === "first_puff") return "first_log";
    if (id === "under_goal_3") return "under_limit_3";
    if (id === "under_goal_7") return "under_limit_7";
    return id;
  });
  return {
    ...defaultStateFor(modeId),
    ...parsed,
    settings,
    badges: { ...defaultStateFor(modeId).badges, ...(parsed.badges || {}), earned },
    log: Array.isArray(parsed.log) ? parsed.log.slice().sort((a, b) => a - b) : [],
    packs: Array.isArray(parsed.packs) ? parsed.packs.slice().sort((a, b) => a.ts - b.ts) : [],
    _mode: modeId,
  };
}

export function loadActiveMode() {
  const stored = localStorage.getItem(MODE_KEY);
  if (stored && MODES[stored]) return stored;
  return DEFAULT_MODE;
}

export function saveActiveMode(modeId) {
  if (!MODES[modeId]) return;
  localStorage.setItem(MODE_KEY, modeId);
}

export function load(modeId) {
  migrateLegacy();
  const key = modeKey(modeId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const seeded = { ...defaultStateFor(modeId), createdAt: Date.now() };
      save(seeded);
      return seeded;
    }
    return migrateState(JSON.parse(raw), modeId);
  } catch {
    return { ...defaultStateFor(modeId), createdAt: Date.now() };
  }
}

export function save(state) {
  const { _mode, ...persisted } = state;
  localStorage.setItem(modeKey(_mode), JSON.stringify(persisted));
}

export function addEntry(state, ts = Date.now()) {
  state.log.push(ts);
  state.log.sort((a, b) => a - b);
  save(state);
  return ts;
}

export function removeLast(state) {
  const removed = state.log.pop();
  save(state);
  return removed;
}

export function updateSettings(state, patch) {
  state.settings = { ...state.settings, ...patch };
  save(state);
}

export function markBadgesSeen(state, ids) {
  const set = new Set(state.badges.earned);
  for (const id of ids) set.add(id);
  state.badges.earned = [...set];
  state.badges.lastSeenAt = Date.now();
  save(state);
}

export function addPack(state, { count, cost, ts = Date.now() }) {
  if (!Array.isArray(state.packs)) state.packs = [];
  state.packs.push({ ts, count, cost });
  state.packs.sort((a, b) => a.ts - b.ts);
  save(state);
}

export function resetMode(modeId) {
  localStorage.removeItem(modeKey(modeId));
}
