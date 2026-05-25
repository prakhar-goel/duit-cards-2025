export type RootTabParamList = {
  Home: undefined;
  Meetings: undefined;
  Share: undefined;
  Profile: undefined;
};

export type FeedPost = {
  id: string;
  name: string;
  title: string;
  time: string;
  content: string;
  badge: string;
  stats: string;
  initials: string;
};

export type MeetingType = "Event" | "Coffee" | "Call";

export type Meeting = {
  id: string;
  date: string;
  name: string;
  company: string;
  summary: string;
  nextStep: string;
  type: MeetingType;
};
