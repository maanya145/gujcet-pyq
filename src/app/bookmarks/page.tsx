"use client";

import { useState, useEffect } from "react";
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

interface LoadedBookmark extends ParsedBookmark {
  question: Question;
}

function parseBookmarkKey(key: string): ParsedBookmark | null {
  const parts = key.split(":");
  if (parts.length < 4) return null;
  // subject:chapter:year:number — chapter name may contain colons, so join middle parts
  const subject = parts[0];
  const number = parseInt(parts[parts.length - 1], 10);
  const year = parseInt(parts[parts.length - 2], 10);
  const chapter = parts.slice(1, parts.length - 2).join(":");
  if (isNaN(year) || isNaN(number)) return null;
  return { subject, chapter, year, number };
}

function chapterToSlug(chapter: string): string {
  return chapter
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

type GroupedBookmarks = Record<string, Record<string, LoadedBookmark[]>>;

export default function BookmarksPage() {
  const [grouped, setGrouped] = useState<GroupedBookmarks>({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadBookmarks = async () => {
    setLoading(true);
    const keys = getAllBookmarks();
    setTotalCount(keys.length);

    if (keys.length === 0) {
      setGrouped({});
      setLoading(false);
      return;
    }

    // Parse and group by subject+chapter
    const parsedBookmarks = keys
      .map((k) => ({ key: k, parsed: parseBookmarkKey(k) }))
      .filter((x): x is { key: string; parsed: ParsedBookmark } => x.parsed !== null);

    // Determine unique subject+chapter combos to fetch
    const chaptersToFetch = new Map<string, Set<string>>();
    for (const { parsed } of parsedBookmarks) {
      const slug = chapterToSlug(parsed.chapter);
      const fetchKey = `${parsed.subject}/${slug}`;
      if (!chaptersToFetch.has(fetchKey)) {
        chaptersToFetch.set(fetchKey, new Set());
      }
    }

    // Fetch all needed chapter JSONs
    const chapterDataCache = new Map<string, Question[]>();
    const fetchPromises = Array.from(chaptersToFetch.keys()).map(async (fetchKey) => {
      try {
        const res = await fetch(`/data/${fetchKey}.json`);
        if (res.ok) {
          const data = await res.json();
          chapterDataCache.set(fetchKey, data.questions || []);
        }
      } catch {
        // Skip chapters that fail to load
      }
    });
    await Promise.all(fetchPromises);

    // Match bookmarks to loaded questions
    const result: GroupedBookmarks = {};
    for (const { parsed } of parsedBookmarks) {
      const slug = chapterToSlug(parsed.chapter);
      const fetchKey = `${parsed.subject}/${slug}`;
      const questions = chapterDataCache.get(fetchKey);
      if (!questions) continue;

      const question = questions.find(
        (q) => q.year === parsed.year && q.number === parsed.number
      );
      if (!question) continue;

      const subjectLabel = parsed.subject.charAt(0).toUpperCase() + parsed.subject.slice(1);
      if (!result[subjectLabel]) result[subjectLabel] = {};
      if (!result[subjectLabel][parsed.chapter]) result[subjectLabel][parsed.chapter] = [];
      result[subjectLabel][parsed.chapter].push({ ...parsed, question });
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
    loadBookmarks();
  }, []);

  const handleClearAll = () => {
    if (window.confirm("Remove all bookmarks? This cannot be undone.")) {
      clearAllBookmarks();
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
                      const slug = chapterToSlug(chapter);
                      const subjectLower = subject.toLowerCase();
                      return (
                        <Card key={chapter}>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium capitalize">
                                {chapter.replace(/_/g, " ")}
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
