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
