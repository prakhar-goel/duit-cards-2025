export const normalisePhone = (phone: string) =>
  phone.trim().replace(/[\s().-]/g, "");
export function introductionMessage({
  recipient,
  sender,
  business,
  place,
  note,
  url,
}: {
  recipient: string;
  sender: string;
  business: string;
  place: string;
  note: string;
  url: string;
}) {
  return [
    `Hi ${recipient.trim() || "there"}, my name is ${sender.trim() || "…"}.`,
    place.trim() ? `We met at ${place.trim()}.` : "",
    note.trim() ? `We discussed ${note.trim().replace(/[.!?]+$/, "")}.` : "",
    business.trim() ? `A little about my work: ${business.trim()}` : "",
    `Here’s my card: ${url}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function shareDisabledReason(
  name: string,
  phone: string,
  message: string,
) {
  if (name.trim().length < 2) return "Enter their name to share your card.";
  if (!/^\+[1-9]\d{7,14}$/.test(normalisePhone(phone)))
    return "Add a valid WhatsApp number with country code, for example +91 98765 43210.";
  if (!message.trim()) return "Write a message or use the suggested message.";
  return "";
}
