const STORAGE_KEY = "cigtracker.v1";

const DEFAULT_STATE = {
  log: [],
  settings: {
    dailyLimit: 10,
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

function migrate(parsed) {
  const settings = { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) };
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
    ...structuredClone(DEFAULT_STATE),
    ...parsed,
    settings,
    badges: { ...DEFAULT_STATE.badges, ...(parsed.badges || {}), earned },
    log: Array.isArray(parsed.log) ? parsed.log.slice().sort((a, b) => a - b) : [],
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = { ...structuredClone(DEFAULT_STATE), createdAt: Date.now() };
      save(seeded);
      return seeded;
    }
    return migrate(JSON.parse(raw));
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
