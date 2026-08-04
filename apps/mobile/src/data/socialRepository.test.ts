import { describe, expect, it } from "vitest";
import { getConnectionById, getConnectionFilterOptions, getConnections, getMeetings, getMyCards } from "./socialRepository";

describe("socialRepository", () => {
  it("exposes enough mock contacts to stress the list UI", () => {
    expect(getConnections().length).toBeGreaterThanOrEqual(50);
  });

  it("derives meetings from the same connection source", () => {
    expect(getMeetings()).toHaveLength(getConnections().length);
  });

  it("provides lookup and filter options without screens touching mock arrays", () => {
    const firstConnection = getConnections()[0];
    const options = getConnectionFilterOptions();

    expect(getConnectionById(firstConnection.id)).toEqual(firstConnection);
    expect(getMyCards().length).toBeGreaterThan(0);
    expect(options.categories).toContain(firstConnection.category);
    expect(options.cities).toContain(firstConnection.city);
  });
});
