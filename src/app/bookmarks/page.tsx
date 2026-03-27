"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Latex } from "@/components/latex";
import { Bookmark, Trash2, X, ChevronRight } from "lucide-react";
import { getAllBookmarks, clearAllBookmarks, toggleBookmark } from "@/lib/bookmarks";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";

const subjectConfig: Record<string, { color: string }> = {
  physics: { color: "text-blue-600 dark:text-blue-400" },
  chemistry: { color: "text-green-600 dark:text-green-400" },
  maths: { color: "text-purple-600 dark:text-purple-400" },
};

interface ParsedBookmark {
  subject: string;
  chapter: string;
  year: number;
  number: number;
}

interface LoadedBookmark {
  subject: string;
  chapter: string; // display name from index (proper casing)
  slug: string; // file slug for Practice link
  year: number;
  number: number;
  question: Question;
}

type GroupedBookmarks = Record<string, Record<string, LoadedBookmark[]>>;

interface ChapterIndexEntry {
  chapter: string; // proper cased name e.g. "The p-Block Elements"
  slug: string; // file slug e.g. "the_p-block_elements"
}

function parseBookmarkKey(key: string): ParsedBookmark | null {
  const parts = key.split(":");
  if (parts.length < 4) return null;
  const subject = parts[0];
  const number = parseInt(parts[parts.length - 1], 10);
  const year = parseInt(parts[parts.length - 2], 10);
  const chapter = parts.slice(1, parts.length - 2).join(":");
  if (isNaN(year) || isNaN(number)) return null;
  return { subject, chapter, year, number };
}

export default function BookmarksPage() {
  const [grouped, setGrouped] = useState<GroupedBookmarks>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isSignedIn } = useAuth();

  const loadBookmarks = async () => {
    setLoading(true);

    let keys: string[];
    if (isSignedIn) {
      try {
        const res = await fetch("/api/bookmarks");
        const data = await res.json();
        keys = data.bookmarks ?? [];
      } catch {
        keys = getAllBookmarks();
      }
    } else {
      keys = getAllBookmarks();
    }

    setTotalCount(keys.length);

    if (keys.length === 0) {
      setGrouped({});
      setLoading(false);
      return;
    }

    const parsedBookmarks = keys
      .map((k) => ({ key: k, parsed: parseBookmarkKey(k) }))
      .filter((x): x is { key: string; parsed: ParsedBookmark } => x.parsed !== null);

    // Load _index.json for each unique subject to get authoritative chapter name → slug map
    const uniqueSubjects = Array.from(new Set(parsedBookmarks.map((x) => x.parsed.subject)));
    // subject → (chapterName.toLowerCase() → ChapterIndexEntry)
    const subjectIndexMap = new Map<string, Map<string, ChapterIndexEntry>>();
    await Promise.all(
      uniqueSubjects.map(async (subject) => {
        try {
          const res = await fetch(`/data/${subject}/_index.json`);
          if (!res.ok) return;
          const idx = await res.json();
          const chMap = new Map<string, ChapterIndexEntry>();
          for (const ch of idx.chapters as Array<{ chapter: string; file: string }>) {
            const slug = ch.file.replace(".json", "");
            chMap.set(ch.chapter.toLowerCase(), { chapter: ch.chapter, slug });
          }
          subjectIndexMap.set(subject, chMap);
        } catch {
          // ignore
        }
      })
    );

    // Determine which chapter files to fetch
    // "All Chapters" bookmarks need every chapter file for the subject
    const fetchKeys = new Set<string>(); // "subject/slug"
    for (const { parsed } of parsedBookmarks) {
      const chMap = subjectIndexMap.get(parsed.subject);
      if (!chMap) continue;
      if (parsed.chapter.toLowerCase() === "all chapters") {
        for (const { slug } of Array.from(chMap.values())) {
          fetchKeys.add(`${parsed.subject}/${slug}`);
        }
      } else {
        const entry = chMap.get(parsed.chapter.toLowerCase());
        if (entry) fetchKeys.add(`${parsed.subject}/${entry.slug}`);
      }
    }

    // Fetch all needed chapter JSONs in parallel
    // Cache: "subject/slug" → questions
    const chapterDataCache = new Map<string, Question[]>();
    await Promise.all(
      Array.from(fetchKeys).map(async (fetchKey) => {
        try {
          const res = await fetch(`/data/${fetchKey}.json`);
          if (res.ok) {
            const data = await res.json();
            chapterDataCache.set(fetchKey, data.questions || []);
          }
        } catch {
          // skip
        }
      })
    );

    // Build lookup: subject → "year:number" → { question, chapter, slug }
    const questionLookup = new Map<
      string,
      Map<string, { question: Question; chapter: string; slug: string }>
    >();
    for (const [fetchKey, questions] of Array.from(chapterDataCache.entries())) {
      const slashIdx = fetchKey.indexOf("/");
      const subject = fetchKey.slice(0, slashIdx);
      const slug = fetchKey.slice(slashIdx + 1);
      if (!questionLookup.has(subject)) {
        questionLookup.set(subject, new Map());
      }
      const subjectMap = questionLookup.get(subject)!;
      // Resolve proper chapter name from index
      const chMap = subjectIndexMap.get(subject);
      let chapterName = slug.replace(/_/g, " "); // fallback
      if (chMap) {
        for (const entry of Array.from(chMap.values())) {
          if (entry.slug === slug) {
            chapterName = entry.chapter;
            break;
          }
        }
      }
      for (const q of questions) {
        subjectMap.set(`${q.year}:${q.number}`, { question: q, chapter: chapterName, slug });
      }
    }

    // Match bookmarks to questions and group
    const result: GroupedBookmarks = {};
    for (const { parsed } of parsedBookmarks) {
      const subjectMap = questionLookup.get(parsed.subject);
      if (!subjectMap) continue;
      const entry = subjectMap.get(`${parsed.year}:${parsed.number}`);
      if (!entry) continue;

      const subjectLabel =
        parsed.subject.charAt(0).toUpperCase() + parsed.subject.slice(1);
      if (!result[subjectLabel]) result[subjectLabel] = {};
      if (!result[subjectLabel][entry.chapter]) result[subjectLabel][entry.chapter] = [];
      result[subjectLabel][entry.chapter].push({
        subject: parsed.subject,
        chapter: entry.chapter,
        slug: entry.slug,
        year: parsed.year,
        number: parsed.number,
        question: entry.question,
      });
    }

    // Sort within each group by year then number
    for (const subject of Object.keys(result)) {
      for (const chapter of Object.keys(result[subject])) {
        result[subject][chapter].sort((a, b) => a.year - b.year || a.number - b.number);
      }
    }

    setGrouped(result);
    setLoading(false);
  };

  useEffect(() => {
    if (isSignedIn === undefined) return; // wait for Clerk to resolve
    loadBookmarks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  const handleClearAll = () => {
    if (window.confirm("Remove all bookmarks? This cannot be undone.")) {
      clearAllBookmarks();
      if (isSignedIn) {
        fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ all: true }),
        }).catch(() => {});
      }
      setGrouped({});
      setTotalCount(0);
    }
  };

  const handleRemoveBookmark = useCallback(
    (bm: LoadedBookmark) => {
      const key = `${bm.subject}:${bm.chapter}:${bm.year}:${bm.number}`;
      toggleBookmark(key); // remove from localStorage
      if (isSignedIn) {
        fetch("/api/bookmarks", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key }),
        }).catch(() => {});
      }
      setGrouped((prev) => {
        const next = { ...prev };
        const subjectLabel =
          bm.subject.charAt(0).toUpperCase() + bm.subject.slice(1);
        if (!next[subjectLabel]?.[bm.chapter]) return next;
        next[subjectLabel] = { ...next[subjectLabel] };
        next[subjectLabel][bm.chapter] = next[subjectLabel][bm.chapter].filter(
          (b) => !(b.year === bm.year && b.number === bm.number)
        );
        if (next[subjectLabel][bm.chapter].length === 0) {
          delete next[subjectLabel][bm.chapter];
        }
        if (Object.keys(next[subjectLabel]).length === 0) {
          delete next[subjectLabel];
        }
        return next;
      });
      setTotalCount((c) => c - 1);
    },
    [isSignedIn]
  );

  const subjectKeys = Object.keys(grouped).sort();

  return (
    <main className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Bookmarked Questions
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {totalCount} {totalCount === 1 ? "question" : "questions"} bookmarked
              </p>
            </div>
            {totalCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearAll}>
                <Trash2 className="size-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : subjectKeys.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bookmark className="mx-auto mb-4 size-12 text-muted-foreground/40" />
              <h2 className="text-xl font-semibold">No Bookmarked Questions</h2>
              <p className="mt-2 text-muted-foreground">
                Tap the bookmark icon on any question to save it here.
              </p>
              <Link href="/">
                <Button className="mt-6">Start Practicing</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {subjectKeys.map((subject) => {
              const chapters = grouped[subject];
              const chapterKeys = Object.keys(chapters).sort();
              const config = subjectConfig[subject.toLowerCase()];
              const subjectTotal = chapterKeys.reduce((sum, ch) => sum + chapters[ch].length, 0);
              return (
                <div key={subject}>
                  <div className="flex items-baseline gap-2 mb-3">
                    <h2 className={cn("text-lg font-semibold", config?.color)}>
                      {subject}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {subjectTotal} {subjectTotal === 1 ? "question" : "questions"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {chapterKeys.map((chapter) => {
                      const bookmarks = chapters[chapter];
                      return (
                        <div key={chapter} className="space-y-2">
                          <h3 className="text-sm font-medium text-muted-foreground">
                            {chapter} &middot; {bookmarks.length}{" "}
                            {bookmarks.length === 1 ? "question" : "questions"}
                          </h3>
                          <div className="space-y-2">
                            {bookmarks.map((bm) => (
                              <div
                                key={`${bm.year}-${bm.number}`}
                                className="group flex items-start gap-2 rounded-lg border transition-colors hover:bg-muted/50"
                              >
                                <Link
                                  href={`/${bm.subject}/${bm.slug}?q=${bm.year}-${bm.number}`}
                                  className="flex-1 flex items-start gap-3 p-3 min-w-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {bm.year}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Q{bm.number}
                                      </span>
                                      {bm.question.difficulty && (
                                        <Badge
                                          variant="outline"
                                          className={cn(
                                            "text-[10px] px-1.5 py-0 capitalize",
                                            bm.question.difficulty === "easy" && "text-green-600 border-green-300 dark:text-green-400 dark:border-green-700",
                                            bm.question.difficulty === "medium" && "text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700",
                                            bm.question.difficulty === "hard" && "text-red-600 border-red-300 dark:text-red-400 dark:border-red-700"
                                          )}
                                        >
                                          {bm.question.difficulty}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm leading-relaxed line-clamp-2">
                                      <Latex text={bm.question.question} />
                                    </p>
                                  </div>
                                  <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground shrink-0 mt-0.5 transition-colors" />
                                </Link>
                                <button
                                  onClick={() => handleRemoveBookmark(bm)}
                                  className="inline-flex items-center justify-center size-8 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors shrink-0 mr-1 mt-1"
                                  aria-label="Remove bookmark"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
