export interface TestResult {
  name: string;
  passed: boolean;
  got?: string;
  want?: string;
  hidden: boolean;
}

export interface RunResponse {
  error?: string;
  results?: TestResult[];
}

// Only bounds a single exercise run, not the one-time WASM boot (see
// warmUp()) — cold-compiling the ~40MB interpreter can legitimately take
// longer than a reasonable "your code looped forever" threshold.
const RUN_TIMEOUT_MS = 4000;

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (r: RunResponse) => void; timer: number }>();

let warmUpPromise: Promise<void> | null = null;
let resolveWarmUp: (() => void) | null = null;
let rejectWarmUp: ((err: Error) => void) | null = null;

function handleMessage(e: MessageEvent) {
  const data = e.data;

  if (data.type === "ready") {
    resolveWarmUp?.();
    return;
  }
  if (data.type === "boot-error") {
    rejectWarmUp?.(new Error(data.error));
    return;
  }

  const { id, ok, response, error } = data;
  const entry = pending.get(id);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(id);
  entry.resolve(ok ? (response as RunResponse) : { error: String(error) });
}

function spawnWorker(): Worker {
  // Classic worker, not { type: "module" } — worker.ts uses importScripts()
  // to load wasm_exec.js, which module workers disallow.
  const w = new Worker("./worker.js");
  w.onmessage = handleMessage;
  return w;
}

function resetWorker() {
  worker?.terminate();
  worker = null;
  warmUpPromise = null;
}

/** Spawns the worker (if needed) and resolves once the WASM runtime has booted. */
export function warmUp(): Promise<void> {
  if (!worker) worker = spawnWorker();
  if (!warmUpPromise) {
    warmUpPromise = new Promise<void>((resolve, reject) => {
      resolveWarmUp = resolve;
      rejectWarmUp = reject;
    });
  }
  return warmUpPromise;
}

export async function runCode(
  studentCode: string,
  funcName: string,
  cases: unknown,
): Promise<RunResponse> {
  await warmUp();
  const w = worker!;
  const id = nextId++;

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      resetWorker();
      resolve({ error: `Timed out after ${RUN_TIMEOUT_MS / 1000}s — likely an infinite loop.` });
    }, RUN_TIMEOUT_MS);

    pending.set(id, { resolve, timer });
    w.postMessage({ id, studentCode, funcName, cases });
  });
}
