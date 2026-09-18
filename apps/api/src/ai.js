const intentLabels = {
  pitch_product: "present your offer clearly",
  communicate_brand: "make your brand memorable",
  partnerships: "find partnership conversations",
  hire: "meet potential hires",
  learn_peers: "learn from peers",
  investment: "start investor conversations",
};

export function onboardingAi({ step, answers = {} }) {
  const name = answers.fullName?.trim().split(/\s+/)[0] || "there";
  const company = answers.company?.trim() || "your company";
  const intent = answers.networkingIntents?.[0];
  const goal = intentLabels[intent] || "make each introduction actionable";

  if (step === "followup") {
    return {
      headline: `What should ${name}'s card make easier?`,
      subtitle: `Choose the outcome that matters most for ${company}.`,
      options: [
        { id: "remember", emoji: "🧠", label: "Be remembered after the event" },
        { id: "qualified-leads", emoji: "✨", label: "Turn interest into qualified leads" },
        { id: "follow-up", emoji: "↗️", label: "Make the next follow-up obvious" },
      ],
    };
  }
  return { bullets: [`Shape your card to ${goal}`, "Approve only claims you can stand behind", "Capture context before it fades"] };
}

export function draftPitch(input) {
  const company = input.company?.trim() || input.ownerName?.trim() || "Your company";
  const audience = input.audience?.trim() || "the people you meet";
  const problem = input.problem?.trim() || "valuable introductions lose context after the first conversation";
  const offer = input.offer?.trim() || "helps teams turn introductions into clear next steps";
  const proof = input.proof?.trim() || "Built from the owner's approved experience and evidence.";
  const action = input.desiredAction?.trim() || "Start a conversation";
  return [
    ["hook", `How many promising introductions disappear before they become useful?`],
    ["relevance", `${audience} face a simple problem: ${problem}`],
    ["offer", `${company} ${offer}`],
    ["outcome", "Leave each conversation with a clearer reason to remember, respond, and act."],
    ["proof", proof],
    ["cta", action],
  ].map(([panelType, body], position) => ({ panelType, body, position, provenance: "ai_suggested", approved: false }));
}

export function encounterInsight(note = "", personName = "This person") {
  const clean = note.trim();
  return {
    recap: clean || `Met ${personName}; add a note to preserve the context.`,
    relevance: clean ? `Relevant because the conversation mentioned: ${clean.slice(0, 180)}` : "Add context to explain why this relationship matters.",
    proposedFollowUp: clean ? `Follow up with ${personName} about the point discussed and confirm the next step.` : `Send ${personName} a short follow-up while the meeting is fresh.`,
  };
}
