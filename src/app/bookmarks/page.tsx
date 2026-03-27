"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Trash2 } from "lucide-react";
import { getAllBookmarks, clearAllBookmarks } from "@/lib/bookmarks";
import type { Question } from "@/lib/types";

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

  const subjectKeys = Object.keys(grouped).sort();

  return (
    <main className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bookmark className="size-5 text-yellow-500 fill-yellow-500" />
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
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-7 w-16 rounded-md" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : subjectKeys.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No bookmarked questions yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap the bookmark icon on any question to save it here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {subjectKeys.map((subject) => {
              const chapters = grouped[subject];
              const chapterKeys = Object.keys(chapters).sort();
              return (
                <div key={subject}>
                  <h2 className="text-lg font-semibold mb-3">{subject}</h2>
                  <div className="space-y-4">
                    {chapterKeys.map((chapter) => {
                      const bookmarks = chapters[chapter];
                      const slug = bookmarks[0].slug;
                      const subjectLower = subject.toLowerCase();
                      return (
                        <Card key={chapter}>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium">
                                {chapter}
                              </h3>
                              <Link href={`/${subjectLower}/${slug}`}>
                                <Button variant="outline" size="xs" className="text-xs">
                                  Practice
                                </Button>
                              </Link>
                            </div>
                            <div className="space-y-1.5">
                              {bookmarks.map((bm, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-sm text-muted-foreground"
                                >
                                  <Bookmark className="size-3 text-yellow-500 fill-yellow-500 shrink-0" />
                                  <span>
                                    Q{bm.number} ({bm.year})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
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
