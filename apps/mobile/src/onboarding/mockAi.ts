import type { OnboardingForm } from "./state";

export type AiFollowUpOption = { id: string; emoji: string; label: string };

/**
 * Mock “AI” routing: copy and options change from prior answers.
 * Replace this module with an API call that returns the same shape.
 */
export function getAiFollowUpContent(form: OnboardingForm): {
  headline: string;
  subtitle: string;
  options: AiFollowUpOption[];
} {
  const name = form.fullName.trim().split(/\s+/)[0] || "there";
  const hasSite = form.website.trim().length > 0;
  const intents = new Set(form.networkingIntents);

  const siteLine = hasSite
    ? "We will use your site to suggest title, company, and talking points."
    : "Tell us how you show up so we can tune your card and reminders.";

  if (intents.has("pitch_product")) {
    return {
      headline: `${name}, sharpen your pitch`,
      subtitle: `${siteLine} What should people remember first?`,
      options: [
        { id: "pitch_problem", emoji: "🎯", label: "The problem you solve" },
        { id: "pitch_proof", emoji: "📈", label: "Proof and traction" },
        { id: "pitch_offer", emoji: "🧩", label: "Your product or service offer" },
      ],
    };
  }

  if (intents.has("communicate_brand")) {
    return {
      headline: `${name}, your brand in the room`,
      subtitle: `${siteLine} How should you come across?`,
      options: [
        { id: "brand_warm", emoji: "🤝", label: "Warm and approachable" },
        { id: "brand_bold", emoji: "⚡", label: "Bold and memorable" },
        { id: "brand_expert", emoji: "🎓", label: "Precise and expert" },
      ],
    };
  }

  if (intents.has("investment")) {
    return {
      headline: `${name}, fundraising context`,
      subtitle: `${siteLine} What do you want investors to see first?`,
      options: [
        { id: "inv_story", emoji: "📣", label: "The story and why now" },
        { id: "inv_metrics", emoji: "📊", label: "Metrics and momentum" },
        { id: "inv_team", emoji: "👥", label: "Team and execution" },
      ],
    };
  }

  return {
    headline: `${name}, quick tune`,
    subtitle: siteLine,
    options: [
      { id: "net_intros", emoji: "✉️", label: "Warm introductions" },
      { id: "net_learn", emoji: "💡", label: "Learn from peers" },
      { id: "net_opps", emoji: "🚪", label: "New opportunities" },
    ],
  };
}

export function getPlanBullets(form: OnboardingForm): string[] {
  const role = form.roleTitle.trim();
  const co = form.company.trim();
  const bullets: string[] = [];

  if (role) {
    bullets.push(`Lead with what you do${co ? ` at ${co}` : ""}`);
  }
  if (form.website.trim()) {
    bullets.push("Enrich your profile from your website when you connect data sources");
  }
  if (form.networkingIntents.includes("pitch_product")) {
    bullets.push("Shape your card around a clear pitch narrative");
  }
  if (form.networkingIntents.includes("communicate_brand")) {
    bullets.push("Keep tone and visuals consistent with your brand");
  }
  if (form.networkingIntents.includes("partnerships")) {
    bullets.push("Surface partnership-ready context on your card");
  }
  if (form.networkingIntents.includes("hire")) {
    bullets.push("Make hiring signals easy for the right people to spot");
  }
  if (form.networkingIntents.includes("learn_peers")) {
    bullets.push("Prioritize learning prompts after each new contact");
  }
  if (form.networkingIntents.includes("investment")) {
    bullets.push("Prepare investor-ready snippets from your story");
  }

  bullets.push("Turn new contacts into follow-ups you will not miss");

  return bullets.slice(0, 6);
}
