const STORAGE_KEY = "cigtracker.v1";

const DEFAULT_STATE = {
  log: [],
  settings: {
    dailyGoal: 10,
    costPerCig: 0.5,
    currency: "$",
    baselinePerDay: 20,
  },
  badges: {
    earned: [],
    lastSeenAt: 0,
  },
  createdAt: 0,
};

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = { ...structuredClone(DEFAULT_STATE), createdAt: Date.now() };
      save(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      badges: { ...DEFAULT_STATE.badges, ...(parsed.badges || {}) },
      log: Array.isArray(parsed.log) ? parsed.log.slice().sort((a, b) => a - b) : [],
    };
  } catch {
    return { ...structuredClone(DEFAULT_STATE), createdAt: Date.now() };
  }
}

export function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
