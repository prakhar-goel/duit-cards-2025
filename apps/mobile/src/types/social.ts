/**
 * Shared domain and navigation types for the relationship-management prototype.
 *
 * Keep screen components dependent on these shapes rather than on raw backend
 * payloads. When an API is introduced, map API responses into these app-level
 * types inside the data/repository layer.
 */
export type RootTabParamList = {
  Home: undefined;
  Meetings: undefined;
  Share: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeList: undefined;
  ConnectionDetail: { connectionId: string };
};

export type BusinessCard = {
  id: string;
  title: string;
  subtitle: string;
  accentColor: string;
  imageUrl: string;
};

export type MeetingType = "Conference" | "Coffee" | "Office" | "Dinner" | "Call";

export type ConnectionCategory = "Founder" | "Investor" | "Product" | "Engineering" | "Sales" | "Marketing";

export type DateBucket = "Today" | "Yesterday" | "This week" | "Older";

export type BusinessCardTheme = {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
};

/**
 * A saved business-card exchange with the relationship context needed by the UI.
 *
 * The important product distinction is that this is not a social post. It is a
 * record of an in-person meeting: where/when it happened, how cards were
 * exchanged, why the person may matter, and what follow-up should happen next.
 */
export type Connection = {
  id: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  photoUrl: string;
  businessCardImageUrl: string;
  businessCardTheme: BusinessCardTheme;
  dateLabel: string;
  dateBucket: DateBucket;
  /** Month header used by the home feed's SectionList grouping. */
  monthYear: string;
  /** Search-only copy for natural date queries such as "Feb 2025" or "2 months back". */
  dateSearchText: string;
  timeAgo: string;
  city: string;
  location: string;
  conferenceName?: string;
  exchangeType: "Shared my card" | "Received their card" | "Both exchanged cards";
  category: ConnectionCategory;
  meetingType: MeetingType;
  oneLiner: string;
  relevanceShort: string;
  summary: string;
  relevance: string;
  nextStep: string;
  tags: string[];
  contact: {
    email: string;
    phone: string;
  };
};

export type Meeting = {
  id: string;
  date: string;
  name: string;
  company: string;
  initials: string;
  photoUrl: string;
  location: string;
  summary: string;
  nextStep: string;
  type: MeetingType;
};
