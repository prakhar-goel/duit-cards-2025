export type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  company?: string;
  onboardingCompleted?: boolean;
  profile?: Record<string, any>;
};
export type Panel = {
  id?: string;
  panelType: "hook" | "relevance" | "offer" | "outcome" | "proof" | "cta";
  body: string;
  position: number;
  provenance?: "owner" | "ai_suggested" | "approved_ai";
  approved: boolean;
};
export type BusinessMedia = {
  url: string;
  type: "image" | "video";
  title: string;
  caption: string;
  ctaLabel?: string;
  ctaPrompt?: string;
  ctaColor?: string;
};
export type Card = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  bio?: string;
  theme?: { color?: string; logoUrl?: string };
  imageUrl?: string | null;
  coverUrl?: string | null;
  businessCardBackUrl?: string | null;
  businessMedia?: BusinessMedia[];
  businessCardUrl?: string | null;
  company?: string;
  role?: string;
  ctaUrl?: string | null;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  links?: { label: string; url: string }[];
  ctaType: string;
  ctaLabel: string;
  isPublished: boolean;
  panels?: Panel[];
  publicUrl?: string;
  demo?: boolean;
};
export type Person = {
  id: string;
  name: string;
  role: string;
  company: string;
  email?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  source?: string;
  isDemo?: boolean;
  cardId?: string;
  cardSlug?: string;
  notes?: string;
  city?: string;
  bio?: string;
  countryCode?: string;
  website?: string;
  eventName?: string;
  encounterCount?: number;
  lastEncounterAt?: string;
  businessCardUrl?: string | null;
  businessCardBackUrl?: string | null;
  needs?: string[];
  offers?: string[];
};
export type Encounter = {
  id: string;
  personId: string;
  occurredAt: string;
  location?: string;
  city?: string;
  countryCode?: string;
  eventName?: string;
  meetingType: string;
  exchangeType: string;
  originalNote: string;
  recap?: string;
  relevance?: string;
  proposedFollowUp?: string;
  name?: string;
  company?: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
  eventId?: string;
  coordinates?: { latitude: number; longitude: number };
};
export type Commitment = {
  id: string;
  personId: string;
  encounterId?: string;
  text: string;
  dueAt?: string;
  status: string;
  name?: string;
  company?: string;
};
export type Lead = {
  id: string;
  cardId?: string;
  name?: string;
  email?: string;
  phone?: string;
  intent?: string;
  createdAt?: string;
  status?: string;
  source?: string;
  cardTitle?: string;
};
export type NeedOffer = {
  id: string;
  kind: "need" | "offer";
  text: string;
  active: boolean;
  createdAt?: string;
};
export type FeedItem = {
  id?: string;
  type: string;
  reason: string;
  evidence: string;
  person?: Person;
  commitment?: Commitment;
  lead?: Lead;
  score?: number;
  intent?: "grow" | "improve";
  focus?: string;
};
export type Capabilities = {
  ai?: {
    configured?: boolean;
    enabled?: boolean;
    provider?: string;
    capabilities?: Record<string, boolean>;
    reason?: string;
  };
  publicBaseUrl?: string;
  [key: string]: any;
};
export type Session = { user: User; accessToken: string; refreshToken: string };
export type Snapshot = {
  user: User | null;
  people: Person[];
  cards: Card[];
  encounters: Encounter[];
  commitments: Commitment[];
  leads: Lead[];
  needs: NeedOffer[];
  feed: FeedItem[];
  updatedAt?: string;
};
export type CaptureDraft = {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  photoUrl?: string;
  businessCardUrl?: string;
  originalNote: string;
  recap?: string;
  proposedFollowUp?: string;
  location: string;
  city?: string;
  countryCode?: string;
  eventName: string;
  occurredAt: string;
  meetingType: string;
  exchangeType: string;
  commitment: string;
  dueAt?: string;
  personId?: string;
  latitude?: number;
  longitude?: number;
  eventId?: string;
  coordinates?: { latitude: number; longitude: number };
};
export type QueuedCapture = {
  id: string;
  ownerId: string;
  server: string;
  draft: CaptureDraft;
  createdAt: string;
  error?: string;
  personId?: string;
};
export type Tab = "Today" | "People" | "Capture" | "Meetings" | "My Card";
export const emptySnapshot: Snapshot = {
  user: null,
  people: [],
  cards: [],
  encounters: [],
  commitments: [],
  leads: [],
  needs: [],
  feed: [],
};
