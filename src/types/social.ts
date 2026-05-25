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

export type ConnectionCategory = "Founder" | "Investor" | "Product" | "Engineering" | "Sales";

export type Connection = {
  id: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  photoUrl: string;
  meetingImageUrl: string;
  dateLabel: string;
  timeAgo: string;
  location: string;
  exchangeType: "Shared my card" | "Received their card" | "Both exchanged cards";
  category: ConnectionCategory;
  meetingType: MeetingType;
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
