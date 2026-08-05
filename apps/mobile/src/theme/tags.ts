export type TagTone = {
  backgroundColor: string;
  color: string;
};

const defaultTone: TagTone = {
  backgroundColor: "#F1F5F9",
  color: "#475569",
};

// Centralized tag colors keep chips consistent across list and detail screens.
const tagTones: Record<string, TagTone> = {
  "B2B SaaS": { backgroundColor: "#EEF2FF", color: "#4338CA" },
  "Both exchanged cards": { backgroundColor: "#EAF3FC", color: "#0A66C2" },
  Design: { backgroundColor: "#FDF2F8", color: "#BE185D" },
  Engineering: { backgroundColor: "#ECFEFF", color: "#0E7490" },
  Founder: { backgroundColor: "#FFF7ED", color: "#C2410C" },
  Fundraising: { backgroundColor: "#FAE8FF", color: "#A21CAF" },
  Integration: { backgroundColor: "#ECFDF5", color: "#047857" },
  Investor: { backgroundColor: "#F5F3FF", color: "#6D28D9" },
  Marketing: { backgroundColor: "#F0FDFA", color: "#0F766E" },
  "Potential customer": { backgroundColor: "#EFF6FF", color: "#1D4ED8" },
  Product: { backgroundColor: "#E0F2FE", color: "#0369A1" },
  "Received their card": { backgroundColor: "#EAF3FC", color: "#0A66C2" },
  "Sales tools": { backgroundColor: "#FEF3C7", color: "#B45309" },
  "Shared my card": { backgroundColor: "#EAF3FC", color: "#0A66C2" },
  "Warm intro": { backgroundColor: "#FFE4E6", color: "#BE123C" },
  Workshop: { backgroundColor: "#DCFCE7", color: "#15803D" },
};

/** Card-exchange tags get an icon treatment in addition to the shared chip tone. */
export function isCardExchangeTag(tag: string): boolean {
  return tag === "Shared my card" || tag === "Received their card" || tag === "Both exchanged cards";
}

export function getTagTone(tag: string): TagTone {
  return tagTones[tag] ?? defaultTone;
}
