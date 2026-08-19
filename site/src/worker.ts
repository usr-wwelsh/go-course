// Runs entirely inside a classic Web Worker: loads the yaegi-based WASM
// runner and evaluates student code against test cases. Boot (loading the
// ~40MB WASM module) is reported separately from run results so the main
// thread doesn't mistake a slow cold start for a runaway student program —
// see runner.ts's warmUp() vs runCode().

declare function importScripts(...urls: string[]): void;

declare class Go {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}

declare global {
  function runExercise(studentCode: string, funcName: string, casesJson: string): string;
  var __onWasmReady: (() => void) | undefined;
}

async function instantiate(go: Go): Promise<WebAssembly.WebAssemblyInstantiatedSource> {
  try {
    return await WebAssembly.instantiateStreaming(fetch("/runner.wasm"), go.importObject);
  } catch {
    const bytes = await (await fetch("/runner.wasm")).arrayBuffer();
    return WebAssembly.instantiate(bytes, go.importObject);
  }
}

function boot(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    importScripts("/wasm_exec.js");
    self.__onWasmReady = resolve;
    const go = new Go();
    instantiate(go)
      .then((result) => {
        go.run(result.instance);
      })
      .catch(reject);
  });
}

boot()
  .then(() => self.postMessage({ type: "ready" }))
  .catch((err) => self.postMessage({ type: "boot-error", error: String(err) }));

self.onmessage = (e: MessageEvent) => {
  const { id, studentCode, funcName, cases } = e.data;
  try {
    const raw = runExercise(studentCode, funcName, JSON.stringify(cases));
    self.postMessage({ id, ok: true, response: JSON.parse(raw) });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String(err) });
  }
};
