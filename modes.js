export const MODES = {
  cigarette: {
    id: "cigarette",
    label: "Cigarette",
    singularNoun: "cigarette",
    pluralNoun: "cigarettes",
    shortNoun: "cig",
    shortPlural: "cigs",
    emoji: "🚬",
    actionSub: "tap when you smoke one",
    defaults: { dailyLimit: 10, costPerCig: 0.5, currency: "$", baselinePerDay: 20 },
  },
  joint: {
    id: "joint",
    label: "Joint",
    singularNoun: "joint",
    pluralNoun: "joints",
    shortNoun: "joint",
    shortPlural: "joints",
    emoji: "🌿",
    actionSub: "tap when you spark one",
    defaults: { dailyLimit: 2, costPerCig: 5.0, currency: "$", baselinePerDay: 4 },
  },
};

export const DEFAULT_MODE = "cigarette";

export function getMode(id) {
  return MODES[id] || MODES[DEFAULT_MODE];
}
