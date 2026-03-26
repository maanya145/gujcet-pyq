const STORAGE_KEY = "gujcet:bookmarks";

export function getBookmarkKey(
  subject: string,
  chapter: string,
  year: number,
  number: number
): string {
  return `${subject}:${chapter}:${year}:${number}`;
}

function loadBookmarks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveBookmarks(bookmarks: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
  } catch {
    // localStorage full or unavailable
  }
}

export function isBookmarked(key: string): boolean {
  return loadBookmarks().has(key);
}

export function toggleBookmark(key: string): boolean {
  const bookmarks = loadBookmarks();
  if (bookmarks.has(key)) {
    bookmarks.delete(key);
    saveBookmarks(bookmarks);
    return false;
  } else {
    bookmarks.add(key);
    saveBookmarks(bookmarks);
    return true;
  }
}

export function getAllBookmarks(): string[] {
  return Array.from(loadBookmarks());
}

export function getBookmarkCount(): number {
  return loadBookmarks().size;
}

export function clearAllBookmarks(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}
