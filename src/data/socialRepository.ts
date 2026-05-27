import { connections, meetings, myCards } from "./connections";
import type { BusinessCard, Connection, ConnectionCategory, Meeting } from "../types/social";

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

export function getConnectionById(connectionId: string): Connection | undefined {
  return connections.find((connection) => connection.id === connectionId);
}

export function getMeetings(): Meeting[] {
  return meetings;
}

export function getConnectionFilterOptions(items: Connection[] = connections): ConnectionFilterOptions {
  return {
    categories: uniqueSorted(items.map((connection) => connection.category)),
    cities: uniqueSorted(items.map((connection) => connection.city)),
    conferences: uniqueSorted(
      items.flatMap((connection) => (connection.conferenceName ? [connection.conferenceName] : []))
    ),
  };
}
