import {
  distinctDaysLogged,
  streakUnderLimit,
  costSaved,
  cigsAvoided,
  hasZeroDayAfter3Tracked,
} from "./stats.js";

export const BADGES = [
  {
    id: "first_log",
    emoji: "🪞",
    name: "Honest Mirror",
    blurb:
      "You logged your first cigarette. Awareness beats denial — every quit story starts with looking honestly at the habit.",
    predicate: (s) => s.log.length >= 1,
  },
  {
    id: "tracker_week",
    emoji: "🦉",
    name: "Wise Owl",
    blurb:
      "Tracked your habit on 7 different days. You can't change what you don't measure — keep watching the patterns.",
    predicate: (s) => distinctDaysLogged(s.log) >= 7,
  },
  {
    id: "under_limit_3",
    emoji: "🐢",
    name: "Steady Tortoise",
    blurb:
      "Three days in a row at or under your daily limit. Slow and steady — that's how habits actually break.",
    predicate: (s) => streakUnderLimit(s.log, s.settings.dailyLimit) >= 3,
  },
  {
    id: "under_limit_7",
    emoji: "🦊",
    name: "Cunning Fox",
    blurb:
      "A full week under your limit. You've been outsmarting cravings for seven days straight.",
    predicate: (s) => streakUnderLimit(s.log, s.settings.dailyLimit) >= 7,
  },
  {
    id: "cost_saver_10",
    emoji: "🐷",
    name: "Penny Pincher",
    blurb:
      "Saved your first 10 by cutting back. That's money in your pocket instead of going up in smoke.",
    predicate: (s) => costSaved(s) >= 10,
  },
  {
    id: "cost_saver_100",
    emoji: "🐉",
    name: "Frugal Dragon",
    blurb:
      "100 saved versus your old baseline. The hoard grows — what would you rather spend it on?",
    predicate: (s) => costSaved(s) >= 100,
  },
  {
    id: "avoided_50",
    emoji: "🫁",
    name: "Eagle Lung",
    blurb:
      "50 cigarettes your lungs never had to deal with. Every skipped one is a real win.",
    predicate: (s) => cigsAvoided(s) >= 50,
  },
  {
    id: "zero_day",
    emoji: "🦄",
    name: "Mythical Zero",
    blurb:
      "A whole day without a single cigarette. Rare, magical, and proof that you can do it again tomorrow.",
    predicate: (s) => hasZeroDayAfter3Tracked(s),
  },
];

export function evaluate(state) {
  const earned = new Set(state.badges.earned);
  const newly = [];
  for (const b of BADGES) {
    if (!earned.has(b.id) && b.predicate(state)) newly.push(b);
  }
  return newly;
}

export function getById(id) {
  return BADGES.find((b) => b.id === id);
}
