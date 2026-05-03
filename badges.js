import {
  distinctDaysLogged,
  streakUnderGoal,
  costSaved,
  cigsAvoided,
  hasZeroDayAfter3Tracked,
} from "./stats.js";

export const BADGES = [
  {
    id: "first_puff",
    emoji: "🦥",
    name: "Smoldering Sloth",
    blurb: "Logged your very first cigarette.",
    predicate: (s) => s.log.length >= 1,
  },
  {
    id: "tracker_week",
    emoji: "🐿️",
    name: "Diligent Squirrel",
    blurb: "Logged on 7 different days.",
    predicate: (s) => distinctDaysLogged(s.log) >= 7,
  },
  {
    id: "under_goal_3",
    emoji: "🐼",
    name: "Patient Panda",
    blurb: "3 days in a row at or under your goal.",
    predicate: (s) => streakUnderGoal(s.log, s.settings.dailyGoal) >= 3,
  },
  {
    id: "under_goal_7",
    emoji: "🦊",
    name: "Foxy Restraint",
    blurb: "7 days straight under your goal.",
    predicate: (s) => streakUnderGoal(s.log, s.settings.dailyGoal) >= 7,
  },
  {
    id: "cost_saver_10",
    emoji: "🐷",
    name: "Penny Pincher Pig",
    blurb: "Saved your first 10 vs baseline.",
    predicate: (s) => costSaved(s) >= 10,
  },
  {
    id: "cost_saver_100",
    emoji: "🐉",
    name: "Frugal Dragon",
    blurb: "Hoarded 100 in savings.",
    predicate: (s) => costSaved(s) >= 100,
  },
  {
    id: "avoided_50",
    emoji: "🦅",
    name: "Soaring Eagle Lung",
    blurb: "50 cigarettes not smoked vs baseline.",
    predicate: (s) => cigsAvoided(s) >= 50,
  },
  {
    id: "zero_day",
    emoji: "🦄",
    name: "Mythical Zero",
    blurb: "A whole day with zero logs.",
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
