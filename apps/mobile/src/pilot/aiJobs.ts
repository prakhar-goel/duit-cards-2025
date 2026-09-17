export type AiJob = {
  id: string;
  status: string;
  result?: any;
  error?: string | null;
};

export class AiJobPendingError extends Error {
  constructor(public readonly jobId: string) {
    super(
      "This request is still processing. Check this same request again; no new AI request is needed.",
    );
    this.name = "AiJobPendingError";
  }
}

/** Poll an existing job; this function never creates or retries a paid request. */
export async function waitForAiJob(
  initial: AiJob,
  options: {
    load: (id: string) => Promise<AiJob>;
    assertWorkspace: () => void;
    timeoutMs: number;
    now?: () => number;
    pause?: (ms: number) => Promise<void>;
  },
): Promise<AiJob> {
  const now = options.now ?? Date.now;
  const pause =
    options.pause ??
    ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const deadline = now() + options.timeoutMs;
  let job = initial;
  for (;;) {
    options.assertWorkspace();
    if (job.status === "completed" || job.status === "succeeded") return job;
    if (["failed", "cancelled", "needs_review"].includes(job.status)) {
      throw new Error(
        job.error || "The AI task did not finish. Your original is unchanged.",
      );
    }
    if (!["queued", "running"].includes(job.status)) {
      throw new Error(
        "This AI request has an unknown state. Your original is unchanged.",
      );
    }
    const remaining = deadline - now();
    if (remaining <= 0) throw new AiJobPendingError(job.id);
    await pause(Math.min(2000, remaining));
    options.assertWorkspace();
    job = await options.load(job.id);
  }
}
