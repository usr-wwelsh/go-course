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

// Certificate identity: a random ID assigned the first time the certificate
// view is opened after finishing every chapter, plus the learner's name and
// the date it was first issued. All local — there's no registry to check it
// against, just enough for the learner to have a stable, unique credential.
const CERT_ID_KEY = "go-course:cert-id";
const CERT_NAME_KEY = "go-course:cert-name";
const CERT_DATE_KEY = "go-course:cert-date";

export function getOrCreateCertId(): string {
  try {
    let id = localStorage.getItem(CERT_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CERT_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function getCertIssuedDate(): string {
  try {
    let date = localStorage.getItem(CERT_DATE_KEY);
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
      localStorage.setItem(CERT_DATE_KEY, date);
    }
    return date;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function getCertName(): string {
  try {
    return localStorage.getItem(CERT_NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setCertName(name: string): void {
  try {
    localStorage.setItem(CERT_NAME_KEY, name);
  } catch {
    // ignore
  }
}
