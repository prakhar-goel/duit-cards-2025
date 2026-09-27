export type MeetingFilters = {
  terms: string[];
  from?: string;
  before?: string;
  leadOnly?: boolean;
  direction?: string;
  country?: string;
  place?: string;
  event?: string;
};
export function normalizePlace(value?: string): string;
export function countryName(code?: string): string;
export function parseMeetingQuery(query: string, now?: Date): MeetingFilters;
export function exchangeDirection(type?: string): string;
export function matchPersonMeeting(
  person: any,
  encounters: any[],
  filters: MeetingFilters,
): any;
export function filterPeople<P, E>(
  people: P[],
  encounters: E[],
  filters: MeetingFilters,
): { person: P; meeting: E | null; visible: boolean }[];
