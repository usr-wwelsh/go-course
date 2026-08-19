import { EditorView } from "codemirror";
import { createEditor } from "./editor";
import { runCode, warmUp, type RunResponse } from "./runner";
import { renderMarkdown } from "./markdown";
import { loadSavedCode, saveCode, clearSavedCode, markComplete, isComplete } from "./storage";

interface ChapterMeta {
  slug: string;
  title: string;
}

interface ExerciseManifest {
  funcName: string;
  cases: unknown[];
}

const lessonEl = document.getElementById("lesson")!;
const tocEl = document.getElementById("toc")!;
const exerciseSection = document.getElementById("exercise-section") as HTMLElement;
const editorContainer = document.getElementById("editor")!;
const runBtn = document.getElementById("run-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const runStatus = document.getElementById("run-status")!;
const resultsEl = document.getElementById("results")!;
const pasteModal = document.getElementById("paste-modal") as HTMLElement;
const pasteModalDismiss = document.getElementById("paste-modal-dismiss") as HTMLButtonElement;

let editorView: EditorView | null = null;
let currentSlug = "";
let currentStarter = "";
let currentFuncName = "";
let currentCases: unknown[] = [];
let runtimeReady = false;
let chapters: ChapterMeta[] = [];
let pasteDetected = false;

pasteModalDismiss.addEventListener("click", () => {
  pasteModal.hidden = true;
});

function debounce<Args extends unknown[]>(fn: (...args: Args) => void, ms: number) {
  let timer = 0;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), ms);
  };
}

const debouncedSave = debounce((slug: string, code: string) => saveCode(slug, code), 400);

function updateRunButtonState() {
  runBtn.disabled = !runtimeReady || !editorView;
}

function beginWarmUp() {
  runStatus.textContent = "Loading Go runtime…";
  updateRunButtonState();
  warmUp()
    .then(() => {
      runtimeReady = true;
      runStatus.textContent = "";
      updateRunButtonState();
    })
    .catch((err) => {
      runStatus.textContent = `Failed to load the Go runtime: ${err}`;
    });
}

async function loadManifest(): Promise<ChapterMeta[]> {
  const res = await fetch("/content/manifest.json");
  return res.json();
}

async function fetchOptional(path: string): Promise<string | null> {
  const res = await fetch(path);
  return res.ok ? res.text() : null;
}

function renderToc(activeSlug: string) {
  const frag = document.createDocumentFragment();

  const about = document.createElement("a");
  about.className = "toc-about";
  about.href = "#index";
  about.textContent = "About this course";
  if (activeSlug === "index") about.setAttribute("aria-current", "true");
  frag.appendChild(about);

  const ol = document.createElement("ol");
  for (const ch of chapters) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${ch.slug}`;
    if (ch.slug === activeSlug) a.setAttribute("aria-current", "true");

    const label = document.createElement("span");
    label.className = "toc-label";
    label.textContent = ch.title;
    a.appendChild(label);

    if (isComplete(ch.slug)) {
      const check = document.createElement("span");
      check.className = "check";
      check.setAttribute("aria-label", "completed");
      check.textContent = "✓";
      a.appendChild(check);
    }

    li.appendChild(a);
    ol.appendChild(li);
  }
  frag.appendChild(ol);
  tocEl.replaceChildren(frag);
}

function mountExercise(slug: string, starter: string, manifest: ExerciseManifest) {
  exerciseSection.hidden = false;
  currentSlug = slug;
  currentStarter = starter;
  currentFuncName = manifest.funcName;
  currentCases = manifest.cases;

  const initialDoc = loadSavedCode(slug) ?? starter;

  if (editorView) editorView.destroy();
  editorContainer.replaceChildren();
  pasteDetected = false;
  editorView = createEditor(
    editorContainer,
    initialDoc,
    (code) => debouncedSave(slug, code),
    () => { pasteDetected = true; },
  );
  updateRunButtonState();
}

function hideExercise() {
  exerciseSection.hidden = true;
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
  updateRunButtonState();
}

async function loadChapter(slug: string) {
  renderToc(slug);
  resultsEl.replaceChildren();
  runStatus.textContent = "";

  if (slug === "index") {
    const md = await fetchOptional("/content/index.md");
    lessonEl.innerHTML = md ? renderMarkdown(md) : "<p>Not found.</p>";
    hideExercise();
    return;
  }

  const lessonMd = await fetchOptional(`/content/${slug}/lesson.md`);
  lessonEl.innerHTML = lessonMd ? renderMarkdown(lessonMd) : "<p>Chapter not found.</p>";

  const [starter, testsJson] = await Promise.all([
    fetchOptional(`/content/${slug}/starter.go`),
    fetchOptional(`/content/${slug}/tests.json`),
  ]);

  if (starter && testsJson) {
    mountExercise(slug, starter, JSON.parse(testsJson));
  } else {
    hideExercise();
  }
}

function renderResults(response: RunResponse) {
  resultsEl.replaceChildren();

  if (response.error) {
    const li = document.createElement("li");
    li.className = "fail";
    li.innerHTML = `<span class="status">ERROR</span><span class="detail"></span>`;
    li.querySelector(".detail")!.textContent = response.error;
    resultsEl.appendChild(li);
    return;
  }

  for (const r of response.results ?? []) {
    const li = document.createElement("li");
    li.className = r.passed ? "pass" : "fail";
    const label = r.hidden ? "hidden case" : r.name;
    const detail = !r.passed && !r.hidden && r.got !== undefined ? `got ${r.got}, want ${r.want}` : "";
    li.innerHTML = `<span class="status">${r.passed ? "PASS" : "FAIL"}</span><span class="detail"></span>`;
    li.querySelector(".detail")!.textContent = detail ? `${label} — ${detail}` : label;
    resultsEl.appendChild(li);
  }
}

runBtn.addEventListener("click", async () => {
  if (!editorView) return;
  runBtn.disabled = true;
  runStatus.textContent = "Running…";
  resultsEl.replaceChildren();
  const flaggedPaste = pasteDetected;
  pasteDetected = false;
  try {
    const code = editorView.state.doc.toString();
    const response = await runCode(code, currentFuncName, currentCases);
    renderResults(response);

    const allPassed = !response.error && !!response.results?.length && response.results.every((r) => r.passed);
    if (allPassed && !isComplete(currentSlug)) {
      markComplete(currentSlug);
      renderToc(currentSlug);
    }
  } finally {
    runStatus.textContent = "";
    updateRunButtonState();
  }
  if (flaggedPaste) pasteModal.hidden = false;
});

resetBtn.addEventListener("click", () => {
  if (!editorView || !currentSlug) return;
  clearSavedCode(currentSlug);
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: currentStarter },
  });
  resultsEl.replaceChildren();
  runStatus.textContent = "";
});

async function route() {
  const slug = location.hash.slice(1) || "index";
  await loadChapter(slug);
}

(async () => {
  beginWarmUp();
  chapters = await loadManifest();
  window.addEventListener("hashchange", () => route());
  await route();
})();
