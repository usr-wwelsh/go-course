// Per-chapter exercise autosave. Best-effort: localStorage can be unavailable
// (private browsing, quota) or throw — in that case the editor still works,
// it just won't survive a refresh.

const PREFIX = "go-course:code:";

export function loadSavedCode(slug: string): string | null {
  try {
    return localStorage.getItem(PREFIX + slug);
  } catch {
    return null;
  }
}

export function saveCode(slug: string, code: string): void {
  try {
    localStorage.setItem(PREFIX + slug, code);
  } catch {
    // ignore
  }
}

export function clearSavedCode(slug: string): void {
  try {
    localStorage.removeItem(PREFIX + slug);
  } catch {
    // ignore
  }
}

// Per-chapter completion: set once every test case (visible and hidden) has
// passed. Never unset by the app — a chapter that was ever solved stays
// marked solved even if the editor's saved code later regresses.
const COMPLETE_PREFIX = "go-course:complete:";

export function markComplete(slug: string): void {
  try {
    localStorage.setItem(COMPLETE_PREFIX + slug, "1");
  } catch {
    // ignore
  }
}

export function isComplete(slug: string): boolean {
  try {
    return localStorage.getItem(COMPLETE_PREFIX + slug) === "1";
  } catch {
    return false;
  }
}
