import type { BusinessCard, BusinessCardTheme, Connection, ConnectionCategory, Meeting, MeetingType } from "../types/social";

/**
 * Mock data for the Phase 1 frontend prototype.
 *
 * UI code should not import this file directly. Use socialRepository instead,
 * so this file can be deleted or replaced once real backend APIs are available.
 */
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

// Hand-written examples keep the first screenful polished and product-specific.
const baseConnections: Connection[] = [
  {
    id: "aisha-rahman",
    name: "Aisha Rahman",
    role: "Product Lead",
    company: "Flow Labs",
    initials: "AR",
    photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
    businessCardImageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#0F172A", accentColor: "#38BDF8", textColor: "#FFFFFF" },
    dateLabel: "Today, 10:30 AM",
    dateBucket: "Today",
    monthYear: "May 2026",
    dateSearchText: "today this week may 2026 26 may 2026",
    timeAgo: "2h ago",
    city: "Jakarta",
    location: "Jakarta Design Week",
    conferenceName: "Jakarta Design Week",
    exchangeType: "Both exchanged cards",
    category: "Product",
    meetingType: "Conference",
    oneLiner: "Builds product workflows for teams that meet customers at events.",
    relevanceShort: "Can pilot event follow-up workflows.",
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
    businessCardImageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#FFF7ED", accentColor: "#EA580C", textColor: "#1F2937" },
    dateLabel: "Yesterday, 4:15 PM",
    dateBucket: "Yesterday",
    monthYear: "May 2026",
    dateSearchText: "yesterday this week may 2026 25 may 2026",
    timeAgo: "Yesterday",
    city: "Jakarta",
    location: "Sudirman coffee bar",
    exchangeType: "Shared my card",
    category: "Founder",
    meetingType: "Coffee",
    oneLiner: "Runs a design studio and can introduce design-led founders.",
    relevanceShort: "",
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
    businessCardImageUrl: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#ECFEFF", accentColor: "#0891B2", textColor: "#164E63" },
    dateLabel: "Monday, 6:00 PM",
    dateBucket: "This week",
    monthYear: "May 2026",
    dateSearchText: "monday this week may 2026 23 may 2026",
    timeAgo: "3d ago",
    city: "Jakarta",
    location: "ByteForge office",
    exchangeType: "Received their card",
    category: "Engineering",
    meetingType: "Office",
    oneLiner: "Leads engineering for field tools and can advise integrations.",
    relevanceShort: "Useful technical integration advisor.",
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
    businessCardImageUrl: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#312E81", accentColor: "#A78BFA", textColor: "#FFFFFF" },
    dateLabel: "Last Friday, 8:30 PM",
    dateBucket: "This week",
    monthYear: "May 2026",
    dateSearchText: "last friday this week may 2026 22 may 2026",
    timeAgo: "6d ago",
    city: "Singapore",
    location: "Founders dinner",
    conferenceName: "SEA Founders Dinner",
    exchangeType: "Both exchanged cards",
    category: "Investor",
    meetingType: "Dinner",
    oneLiner: "Invests in B2B workflow tools and can pressure-test the wedge.",
    relevanceShort: "Investor fit for B2B workflow wedge.",
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
  {
    id: "neha-batra",
    name: "Neha Batra",
    role: "Regional Sales Director",
    company: "Meraki Foods",
    initials: "NB",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop",
    businessCardImageUrl: "https://images.unsplash.com/photo-1557683311-eac922347aa1?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#FDF2F8", accentColor: "#DB2777", textColor: "#831843" },
    dateLabel: "2 months ago",
    dateBucket: "Older",
    monthYear: "March 2026",
    dateSearchText: "2 months ago 2 months back march 2026 mar 2026",
    timeAgo: "2mo ago",
    city: "Gurgaon",
    location: "CyberHub Gurgaon",
    conferenceName: "Gurgaon Retail Meetup",
    exchangeType: "Received their card",
    category: "Sales",
    meetingType: "Conference",
    oneLiner: "Runs regional enterprise sales for a food brand.",
    relevanceShort: "",
    summary:
      "Met briefly at a retail meetup. Conversation was friendly but there was no clear business overlap yet.",
    relevance:
      "Low immediate relevance unless Duit Cards expands into field sales teams for retail and distribution.",
    nextStep: "Keep as low priority. Revisit only if exploring retail sales workflows.",
    tags: ["Sales tools"],
    contact: {
      email: "neha@merakifoods.example",
      phone: "+91 98765 43210",
    },
  },
  {
    id: "ravi-menon",
    name: "Ravi Menon",
    role: "Head of Partnerships",
    company: "PayNova",
    initials: "RM",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop",
    businessCardImageUrl: "https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#EFF6FF", accentColor: "#2563EB", textColor: "#1E3A8A" },
    dateLabel: "3 weeks ago",
    dateBucket: "Older",
    monthYear: "May 2026",
    dateSearchText: "3 weeks ago may 2026 first week of may",
    timeAgo: "3w ago",
    city: "Bengaluru",
    location: "Fintech Week India",
    conferenceName: "Fintech Week India",
    exchangeType: "Both exchanged cards",
    category: "Sales",
    meetingType: "Conference",
    oneLiner: "Builds partnership channels for fintech distribution.",
    relevanceShort: "Could open channel-partner conversations.",
    summary:
      "Met near the partner showcase area and spoke about how fintech teams qualify event leads.",
    relevance:
      "Useful for validating whether Duit Cards can help partnership teams capture and prioritize event contacts.",
    nextStep: "Send a one-screen mock of a partnership lead timeline and ask for feedback.",
    tags: ["Sales tools", "Potential customer"],
    contact: {
      email: "ravi@paynova.example",
      phone: "+91 99887 77665",
    },
  },
  {
    id: "sofia-nguyen",
    name: "Sofia Nguyen",
    role: "Community Director",
    company: "ASEAN SME Hub",
    initials: "SN",
    photoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop",
    businessCardImageUrl: "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#064E3B", accentColor: "#34D399", textColor: "#ECFDF5" },
    dateLabel: "Last month",
    dateBucket: "Older",
    monthYear: "April 2026",
    dateSearchText: "last month april 2026 apr 2026",
    timeAgo: "1mo ago",
    city: "Singapore",
    location: "Marina Bay Sands Expo",
    conferenceName: "SME Growth Summit",
    exchangeType: "Shared my card",
    category: "Marketing",
    meetingType: "Conference",
    oneLiner: "Runs founder communities and curated business introductions.",
    relevanceShort: "Can test community-led card sharing.",
    summary:
      "Met after a panel on SME digitization. She mentioned founders struggle to remember why contacts were relevant.",
    relevance:
      "Relevant if Duit Cards targets community organizers who facilitate many introductions and follow-ups.",
    nextStep: "Offer a small pilot for one community mixer with shared card links and notes.",
    tags: ["Warm intro", "Founder"],
    contact: {
      email: "sofia@aseansmehub.example",
      phone: "+65 8123 7788",
    },
  },
  {
    id: "arjun-kapoor",
    name: "Arjun Kapoor",
    role: "Angel Investor",
    company: "Operator Collective",
    initials: "AK",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop",
    businessCardImageUrl: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&auto=format&fit=crop",
    businessCardTheme: { backgroundColor: "#111827", accentColor: "#F59E0B", textColor: "#FFFFFF" },
    dateLabel: "2 months ago",
    dateBucket: "Older",
    monthYear: "March 2026",
    dateSearchText: "2 months ago 2 months back march 2026 mar 2026",
    timeAgo: "2mo ago",
    city: "Gurgaon",
    location: "Leela Ambience Gurgaon",
    conferenceName: "North India Startup Mixer",
    exchangeType: "Received their card",
    category: "Investor",
    meetingType: "Dinner",
    oneLiner: "Angel investor focused on operator-led B2B products.",
    relevanceShort: "Potential feedback on investor narrative.",
    summary:
      "Met during a startup mixer dinner. He asked about distribution and whether founders would use a personal CRM daily.",
    relevance:
      "Useful for fundraising feedback, but only if the product story is tighter around in-person meetings.",
    nextStep: "Send a short update once the app has a sharper business-card exchange demo.",
    tags: ["Investor", "Fundraising"],
    contact: {
      email: "arjun@operatorcollective.example",
      phone: "+91 98111 22334",
    },
  },
];

// Deterministic generated contacts let us stress-test list performance and
// visual grouping without maintaining 50+ hand-written records.
const generatedNames = [
  ["Ananya Mehta", "AM"],
  ["Kabir Sethi", "KS"],
  ["Leah Tan", "LT"],
  ["Omar Farouk", "OF"],
  ["Isha Nair", "IN"],
  ["Tomoko Sato", "TS"],
  ["Luis Herrera", "LH"],
  ["Fatima Khan", "FK"],
  ["Wei Zhang", "WZ"],
  ["Grace Miller", "GM"],
  ["Nikhil Rao", "NR"],
  ["Elena Petrova", "EP"],
  ["Chen Wei", "CW"],
  ["Sara Haddad", "SH"],
  ["Andre Gomes", "AG"],
  ["Meera Iyer", "MI"],
  ["Noah Brooks", "NB"],
  ["Priyanka Das", "PD"],
  ["Hiro Mori", "HM"],
  ["Tara Singh", "TS"],
] as const;

const generatedRoles = [
  ["Founder", "Orbitly", "Founder"],
  ["Product Manager", "NovaPay", "Product"],
  ["Engineering Lead", "CloudNest", "Engineering"],
  ["VP Sales", "TradeSpark", "Sales"],
  ["Growth Lead", "MarketLoop", "Marketing"],
  ["Partner", "Summit Ventures", "Investor"],
] as const satisfies readonly (readonly [string, string, ConnectionCategory])[];

const generatedCities = [
  ["Mumbai", "Jio World Convention Centre", "India SaaS Summit"],
  ["Delhi", "India Habitat Centre", "Founder Circle Delhi"],
  ["Hyderabad", "T-Hub Hyderabad", "T-Hub Startup Mixer"],
  ["Pune", "Koregaon Park coffee meetup", undefined],
  ["Chennai", "IIT Madras Research Park", "SaaSBOOMi Chennai"],
  ["Dubai", "Dubai World Trade Centre", "GITEX Global"],
  ["London", "Shoreditch House", "London Product Meetup"],
  ["San Francisco", "Moscone Center", "TechCrunch Disrupt"],
  ["New York", "SoHo House New York", "NYC Operator Dinner"],
  ["Bangkok", "Queen Sirikit Convention Center", "Asia SME Expo"],
] as const;

const generatedDates = [
  ["May 2026", "May 18, 2026", "last week", "this month may 2026"],
  ["April 2026", "Apr 24, 2026", "1mo ago", "april 2026 last month"],
  ["March 2026", "Mar 14, 2026", "2mo ago", "march 2026 2 months back"],
  ["February 2026", "Feb 7, 2026", "3mo ago", "february feb 2026"],
  ["January 2026", "Jan 16, 2026", "4mo ago", "january jan 2026 2nd week of jan"],
  ["December 2025", "Dec 11, 2025", "5mo ago", "december dec 2025"],
  ["November 2025", "Nov 17, 2025", "6mo ago", "november nov 2025 17 nov 2025"],
  ["October 2025", "Oct 2, 2025", "7mo ago", "october oct 2025 2 oct 2025"],
] as const;

const exchangeTypes: Connection["exchangeType"][] = ["Shared my card", "Received their card", "Both exchanged cards"];
const meetingTypes: MeetingType[] = ["Conference", "Coffee", "Office", "Dinner", "Call"];
const themes: BusinessCardTheme[] = [
  { backgroundColor: "#0F172A", accentColor: "#38BDF8", textColor: "#FFFFFF" },
  { backgroundColor: "#FFF7ED", accentColor: "#EA580C", textColor: "#1F2937" },
  { backgroundColor: "#ECFEFF", accentColor: "#0891B2", textColor: "#164E63" },
  { backgroundColor: "#FDF2F8", accentColor: "#DB2777", textColor: "#831843" },
  { backgroundColor: "#111827", accentColor: "#F59E0B", textColor: "#FFFFFF" },
];

const portraitUrls = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&auto=format&fit=crop",
];

const tagByCategory: Record<ConnectionCategory, string[]> = {
  Engineering: ["Engineering", "Integration"],
  Founder: ["Founder", "Warm intro"],
  Investor: ["Investor", "Fundraising"],
  Marketing: ["Marketing", "Potential customer"],
  Product: ["Product", "Workshop"],
  Sales: ["Sales tools", "Potential customer"],
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function buildGeneratedConnection(index: number): Connection {
  const [name, initials] = generatedNames[index % generatedNames.length];
  const [role, company, category] = generatedRoles[index % generatedRoles.length];
  const [city, location, conferenceName] = generatedCities[index % generatedCities.length];
  const [monthYear, calendarDate, timeAgo, dateSearchText] = generatedDates[index % generatedDates.length];
  const meetingType = meetingTypes[index % meetingTypes.length];
  const exchangeType = exchangeTypes[index % exchangeTypes.length];
  const isConference = meetingType === "Conference";

  return {
    id: `${slugify(name)}-${index + 1}`,
    name,
    role,
    company,
    initials,
    photoUrl: portraitUrls[index % portraitUrls.length],
    businessCardImageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop",
    businessCardTheme: themes[index % themes.length],
    dateLabel: `${calendarDate}, ${9 + (index % 8)}:${index % 2 === 0 ? "15" : "45"} ${index % 3 === 0 ? "AM" : "PM"}`,
    dateBucket: "Older",
    monthYear,
    dateSearchText: `${dateSearchText} ${calendarDate} ${timeAgo}`,
    timeAgo,
    city,
    location,
    conferenceName: isConference ? conferenceName : undefined,
    exchangeType,
    category,
    meetingType,
    oneLiner: `${role} at ${company}, met around ${location} in ${city}.`,
    relevanceShort: index % 4 === 0 ? "Potential follow-up for event workflows." : "",
    summary: `Met ${name.split(" ")[0]} at ${location} in ${city}. The conversation covered how teams remember context after meeting new people in person.`,
    relevance:
      index % 5 === 0
        ? "Low immediate relevance, but useful to keep as context if this industry becomes a focus."
        : "Relevant for understanding how different professional teams exchange cards, qualify contacts, and decide who to follow up with.",
    nextStep:
      index % 3 === 0
        ? "Send a short follow-up with the Duit Cards prototype and ask for feedback."
        : "Keep warm and reconnect when there is a relevant event or product update.",
    tags: tagByCategory[category],
    contact: {
      email: `${slugify(name)}@${slugify(company)}.example`,
      phone: `+91 90000 ${String(10000 + index).slice(-5)}`,
    },
  };
}

const generatedConnections = Array.from({ length: 52 }, (_, index) => buildGeneratedConnection(index));

export const connections: Connection[] = [...baseConnections, ...generatedConnections];

// Meetings are a timeline projection of the same source data, not separate mock truth.
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
