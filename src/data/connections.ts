import type { BusinessCard, Connection, Meeting } from "../types/social";

export const myCards: BusinessCard[] = [
  {
    id: "designer",
    title: "Designer",
    subtitle: "Product design and UX strategy",
    accentColor: "#3B82F6",
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&auto=format&fit=crop",
  },
  {
    id: "engineer",
    title: "Engineer",
    subtitle: "Mobile, web, and full-stack builds",
    accentColor: "#0F766E",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop",
  },
  {
    id: "founder",
    title: "Founder",
    subtitle: "Duit Cards relationship CRM",
    accentColor: "#7C3AED",
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&auto=format&fit=crop",
  },
];

export const connections: Connection[] = [
  {
    id: "aisha-rahman",
    name: "Aisha Rahman",
    role: "Product Lead",
    company: "Flow Labs",
    initials: "AR",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
    meetingImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&auto=format&fit=crop",
    dateLabel: "Today, 10:30 AM",
    timeAgo: "2h ago",
    location: "Jakarta Design Week",
    exchangeType: "Both exchanged cards",
    category: "Product",
    meetingType: "Conference",
    summary:
      "Met after her product talk. She is evaluating tools that help teams remember event conversations and follow up with context.",
    relevance:
      "She owns product workflows for a team that attends many events, so Duit Cards can solve a real handoff and follow-up problem for her.",
    nextStep: "Send a concise workshop proposal and include one mock flow for event-to-follow-up capture.",
    tags: ["Product", "Potential customer", "Workshop"],
    contact: {
      email: "aisha@flowlabs.com",
      phone: "+62 812 1033 1190",
    },
  },
  {
    id: "mira-santoso",
    name: "Mira Santoso",
    role: "Founder",
    company: "Sora Studio",
    initials: "MS",
    photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop",
    meetingImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&auto=format&fit=crop",
    dateLabel: "Yesterday, 4:15 PM",
    timeAgo: "Yesterday",
    location: "Sudirman coffee bar",
    exchangeType: "Shared my card",
    category: "Founder",
    meetingType: "Coffee",
    summary:
      "Discussed founder networking, warm introductions, and how context gets lost after in-person meetings.",
    relevance:
      "She can be both an early adopter and a warm-intro channel into design-led founders who meet many clients.",
    nextStep: "Send her a 30-second demo focused on remembering who introduced whom and why.",
    tags: ["Founder", "Warm intro", "Design"],
    contact: {
      email: "mira@sorastudio.id",
      phone: "+62 822 7003 992",
    },
  },
  {
    id: "daniel-kurnia",
    name: "Daniel Kurnia",
    role: "Engineering Manager",
    company: "ByteForge",
    initials: "DK",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
    meetingImageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&auto=format&fit=crop",
    dateLabel: "Monday, 6:00 PM",
    timeAgo: "3d ago",
    location: "ByteForge office",
    exchangeType: "Received their card",
    category: "Engineering",
    meetingType: "Office",
    summary:
      "Talked about field sales teams, mobile capture, and keeping CRM entries lightweight enough for daily use.",
    relevance:
      "His team could advise on technical integration needs, and ByteForge may need a lightweight contact capture layer.",
    nextStep: "Ask for a technical feedback call and share a simple API handoff sketch.",
    tags: ["Engineering", "Integration", "Sales tools"],
    contact: {
      email: "daniel@byteforge.ai",
      phone: "+62 811 9832 021",
    },
  },
  {
    id: "marcus-webb",
    name: "Marcus Webb",
    role: "Principal",
    company: "Harbor Ventures",
    initials: "MW",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop",
    meetingImageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=900&auto=format&fit=crop",
    dateLabel: "Last Friday, 8:30 PM",
    timeAgo: "6d ago",
    location: "Founders dinner",
    exchangeType: "Both exchanged cards",
    category: "Investor",
    meetingType: "Dinner",
    summary:
      "Spoke briefly about personal CRM tools, retention loops, and why business cards still matter in Asia.",
    relevance:
      "He invests in B2B workflow products and can pressure-test Duit Cards as a venture-scale relationship layer.",
    nextStep: "Send a tight memo: problem, wedge, why now, and current prototype screenshots.",
    tags: ["Investor", "B2B SaaS", "Fundraising"],
    contact: {
      email: "marcus@harbor.vc",
      phone: "+1 415 555 0182",
    },
  },
];

export const meetings: Meeting[] = connections.map((connection) => ({
  id: connection.id,
  date: connection.dateLabel,
  name: connection.name,
  company: connection.company,
  initials: connection.initials,
  photoUrl: connection.photoUrl,
  location: connection.location,
  summary: connection.summary,
  nextStep: connection.nextStep,
  type: connection.meetingType,
}));
