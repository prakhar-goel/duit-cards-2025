import { connections, meetings, myCards } from "./connections";
import type { BusinessCard, Connection, ConnectionCategory, Meeting } from "../types/social";

/**
 * Data-access boundary for the social/relationship area.
 *
 * Screens should call this module instead of importing mock arrays directly.
 * When the backend is ready, replace these functions with API calls or hooks
 * while keeping the app-facing return types stable.
 */
export type ConnectionFilterOptions = {
  categories: ConnectionCategory[];
  cities: string[];
  conferences: string[];
};

function uniqueSorted<T extends string>(items: T[]) {
  return Array.from(new Set(items)).sort((a, b) => a.localeCompare(b));
}

export function getMyCards(): BusinessCard[] {
  return myCards;
}

export function getConnections(): Connection[] {
  return connections;
}

/** Lookup used by detail screens so routing only needs to pass a stable id. */
export function getConnectionById(connectionId: string): Connection | undefined {
  return connections.find((connection) => connection.id === connectionId);
}

export function getMeetings(): Meeting[] {
  return meetings;
}

/**
 * Derive filter values from the loaded data instead of hardcoding UI options.
 * This keeps filters correct when mock data is expanded or API data arrives.
 */
export function getConnectionFilterOptions(items: Connection[] = connections): ConnectionFilterOptions {
  return {
    categories: uniqueSorted(items.map((connection) => connection.category)),
    cities: uniqueSorted(items.map((connection) => connection.city)),
    conferences: uniqueSorted(
      items.flatMap((connection) => (connection.conferenceName ? [connection.conferenceName] : []))
    ),
  };
}
