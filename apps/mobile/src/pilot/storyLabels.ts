// Keep the dock readable without shrinking type or truncating business names.
export function shortCtaLabel(label: string): string {
  const value = label.trim();
  if (value && value.split(/\s+/).length <= 2 && value.length <= 18)
    return value;
  if (/gift/i.test(value)) return "Plan gifts";
  if (/sample|tast/i.test(value)) return "Try samples";
  if (/visit|tour|walkthrough/i.test(value)) return "Book visit";
  if (/quote|pricing|estimate/i.test(value)) return "Get quote";
  if (/collection|options|catalogue/i.test(value)) return "View options";
  if (/book|reserve/i.test(value)) return "Book now";
  if (/order|buy/i.test(value)) return "Order now";
  if (/meet|connect|conversation|touch/i.test(value)) return "Connect";
  return "Enquire";
}
