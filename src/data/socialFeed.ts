import type { FeedPost, Meeting } from "../types/social";

export const feedPosts: FeedPost[] = [
  {
    id: "1",
    name: "Aisha Rahman",
    title: "Product Lead at Flow Labs",
    time: "2h",
    content:
      "Looking for tools that help teams turn event conversations into structured follow-ups. Most business card exchanges still die after the first hello.",
    badge: "Interested in your CRM workflow",
    stats: "42 reactions - 9 comments",
    initials: "AR",
  },
  {
    id: "2",
    name: "Mira Santoso",
    title: "Founder at Sora Studio",
    time: "5h",
    content:
      "Great networking is less about collecting contacts and more about remembering context. Notes, timing, and relevance matter.",
    badge: "Strong partnership fit",
    stats: "117 reactions - 21 comments",
    initials: "MS",
  },
  {
    id: "3",
    name: "Daniel Kurnia",
    title: "Engineering Manager at ByteForge",
    time: "1d",
    content:
      "We are evaluating lightweight mobile workflows for sales teams in the field. Fast capture and clean handoff are more important than a heavy CRM.",
    badge: "Potential customer",
    stats: "63 reactions - 14 comments",
    initials: "DK",
  },
];

export const meetings: Meeting[] = [
  {
    id: "m1",
    date: "Today",
    name: "Aisha Rahman",
    company: "Flow Labs",
    type: "Event",
    summary: "Met after her product talk. Discussed co-hosting a relationship design workshop.",
    nextStep: "Send a 3-line workshop proposal with one suggested date.",
  },
  {
    id: "m2",
    date: "Yesterday",
    name: "Mira Santoso",
    company: "Sora Studio",
    type: "Coffee",
    summary: "Talked about founder networking and why follow-up timing matters.",
    nextStep: "Reapproach with a short demo focused on warm-intro memory.",
  },
  {
    id: "m3",
    date: "Last week",
    name: "Daniel Kurnia",
    company: "ByteForge",
    type: "Call",
    summary: "Discussed field sales teams and mobile-first contact capture.",
    nextStep: "Share a field-team use case and ask for a 15-minute pilot call.",
  },
];
