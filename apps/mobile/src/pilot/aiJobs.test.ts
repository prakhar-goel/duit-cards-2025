import { describe, expect, it, vi } from "vitest";
import { AiJobPendingError, waitForAiJob } from "./aiJobs";

describe("existing AI job polling", () => {
  it("keeps waiting for an image that finishes after the old one-minute limit", async () => {
    let time = 0;
    const load = vi.fn(async (id: string) => ({
      id,
      status: time >= 180000 ? "succeeded" : "running",
      result: { images: ["reviewable-image"] },
    }));
    const result = await waitForAiJob(
      { id: "image-job", status: "queued" },
      {
        load,
        assertWorkspace: () => {},
        timeoutMs: 240000,
        now: () => time,
        pause: async (ms) => {
          time += ms;
        },
      },
    );
    expect(time).toBe(180000);
    expect(result.result.images).toEqual(["reviewable-image"]);
    expect(load.mock.calls.every(([id]) => id === "image-job")).toBe(true);
  });

  it("returns the existing request id on timeout so the UI can resume without another paid job", async () => {
    let time = 0;
    await expect(
      waitForAiJob(
        { id: "existing-paid-job", status: "running" },
        {
          load: async (id) => ({ id, status: "running" }),
          assertWorkspace: () => {},
          timeoutMs: 4000,
          now: () => time,
          pause: async (ms) => {
            time += ms;
          },
        },
      ),
    ).rejects.toMatchObject({
      name: "AiJobPendingError",
      jobId: "existing-paid-job",
    });
    expect(new AiJobPendingError("existing-paid-job").message).toContain(
      "same request",
    );
  });

  it("uses an already completed job immediately when resuming", async () => {
    const load = vi.fn();
    const completed = {
      id: "existing-paid-job",
      status: "succeeded",
      result: { summary: "Reviewed note" },
    };
    expect(
      await waitForAiJob(completed, {
        load,
        assertWorkspace: () => {},
        timeoutMs: 1000,
      }),
    ).toBe(completed);
    expect(load).not.toHaveBeenCalled();
  });

  it("stops before polling another account after a workspace switch", async () => {
    let changed = false;
    const load = vi.fn();
    await expect(
      waitForAiJob(
        { id: "maya-private-job", status: "running" },
        {
          load,
          assertWorkspace: () => {
            if (changed) throw new Error("Workspace changed");
          },
          timeoutMs: 1000,
          pause: async () => {
            changed = true;
          },
        },
      ),
    ).rejects.toThrow("Workspace changed");
    expect(load).not.toHaveBeenCalled();
  });

  it("preserves a billing-review error instead of resubmitting or treating it as success", async () => {
    const load = vi.fn();
    await expect(
      waitForAiJob(
        {
          id: "uncertain-charge",
          status: "needs_review",
          error: "Reservation retained for operator review",
        },
        {
          load,
          assertWorkspace: () => {},
          timeoutMs: 1000,
        },
      ),
    ).rejects.toThrow("Reservation retained for operator review");
    expect(load).not.toHaveBeenCalled();
  });
});
