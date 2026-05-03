const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(ts) {
  return startOfDay(ts);
}

export function countForDay(log, ts = Date.now()) {
  const start = startOfDay(ts);
  const end = start + DAY_MS;
  let n = 0;
  for (const t of log) if (t >= start && t < end) n++;
  return n;
}

export function countForRange(log, days, now = Date.now()) {
  const start = startOfDay(now) - (days - 1) * DAY_MS;
  let n = 0;
  for (const t of log) if (t >= start) n++;
  return n;
}

export function bucketsByDay(log, days, now = Date.now()) {
  const today = startOfDay(now);
  const buckets = new Array(days).fill(0);
  for (const t of log) {
    const idx = Math.floor((startOfDay(t) - today) / DAY_MS) + (days - 1);
    if (idx >= 0 && idx < days) buckets[idx]++;
  }
  return buckets;
}

export function distinctDaysLogged(log) {
  const set = new Set();
  for (const t of log) set.add(startOfDay(t));
  return set.size;
}

export function daysTracked(state, now = Date.now()) {
  if (!state.createdAt) return 1;
  const diff = Math.floor((startOfDay(now) - startOfDay(state.createdAt)) / DAY_MS) + 1;
  return Math.max(1, diff);
}

export function streakUnderLimit(log, dailyLimit, now = Date.now()) {
  if (!log.length) return 0;
  const earliest = startOfDay(log[0]);
  let streak = 0;
  let cursor = startOfDay(now);
  while (cursor >= earliest) {
    if (countForDay(log, cursor) <= dailyLimit) {
      streak++;
      cursor -= DAY_MS;
    } else break;
    if (streak > 365) break;
  }
  return streak;
}

export function cigsAvoided(state, now = Date.now()) {
  const baseline = state.settings.baselinePerDay * daysTracked(state, now);
  return Math.max(0, baseline - state.log.length);
}

export function costSaved(state, now = Date.now()) {
  return cigsAvoided(state, now) * state.settings.costPerCig;
}

export function hasZeroDayAfter3Tracked(state, now = Date.now()) {
  if (daysTracked(state, now) < 3) return false;
  const today = startOfDay(now);
  for (let i = 0; i < daysTracked(state, now); i++) {
    const d = today - i * DAY_MS;
    if (d < startOfDay(state.createdAt || now)) break;
    if (countForDay(state.log, d) === 0) return true;
  }
  return false;
}
