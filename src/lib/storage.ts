// localStorage persistence for GUJCET PYQ Practice Platform
//
// Key schema:
// gujcet:session:{subject}:{chapter} -> SessionState
// gujcet:history:{subject}:{chapter} -> SessionResult[]
// gujcet:settings -> { theme: string }

export interface SessionState {
  answeredMap: Record<number, { selected: string; correct: boolean | null }>;
  currentIndex: number;
  yearFilter: number | null;
  hideNullAnswers: boolean;
  shuffled: boolean;
  shuffledOrder: number[] | null;
  timerSeconds: number;
  timestamp: number;
}

export interface SessionResult {
  date: string; // ISO string
  correct: number;
  incorrect: number;
  ungraded: number;
  total: number;
  accuracy: number;
  timeSpent: number; // seconds
}

const MAX_HISTORY = 20;

function isClient(): boolean {
  return typeof window !== "undefined";
}

function sessionKey(subject: string, chapter: string): string {
  return `gujcet:session:${subject}:${chapter}`;
}

function historyKey(subject: string, chapter: string): string {
  return `gujcet:history:${subject}:${chapter}`;
}

export function saveSession(
  subject: string,
  chapter: string,
  state: SessionState
): void {
  if (!isClient()) return;
  try {
    localStorage.setItem(sessionKey(subject, chapter), JSON.stringify(state));
  } catch {
    // Private browsing or quota exceeded — silently ignore
  }
}

export function loadSession(
  subject: string,
  chapter: string
): SessionState | null {
  if (!isClient()) return null;
  try {
    const raw = localStorage.getItem(sessionKey(subject, chapter));
    if (!raw) return null;
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

export function clearSession(subject: string, chapter: string): void {
  if (!isClient()) return;
  try {
    localStorage.removeItem(sessionKey(subject, chapter));
  } catch {
    // ignore
  }
}

export function saveResult(
  subject: string,
  chapter: string,
  result: SessionResult
): void {
  if (!isClient()) return;
  try {
    const key = historyKey(subject, chapter);
    const existing = getHistory(subject, chapter);
    existing.push(result);
    // Keep only the last MAX_HISTORY results
    const trimmed = existing.slice(-MAX_HISTORY);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function getHistory(
  subject: string,
  chapter: string
): SessionResult[] {
  if (!isClient()) return [];
  try {
    const raw = localStorage.getItem(historyKey(subject, chapter));
    if (!raw) return [];
    return JSON.parse(raw) as SessionResult[];
  } catch {
    return [];
  }
}

export function getLastResult(
  subject: string,
  chapter: string
): SessionResult | null {
  const history = getHistory(subject, chapter);
  if (history.length === 0) return null;
  return history[history.length - 1];
}
