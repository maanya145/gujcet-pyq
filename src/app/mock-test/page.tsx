"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MockTestSession } from "@/components/mock-test-session";
import type { Subject, SubjectIndex, ChapterData, MockQuestion } from "@/lib/types";
import { ArrowLeft, Loader2, ClipboardList, Clock, Atom, FlaskConical, Calculator } from "lucide-react";

type LoadingState = "idle" | "loading" | "ready" | "error";

const subjects: Subject[] = ["physics", "chemistry", "maths"];

const subjectConfig: Record<Subject, { label: string; icon: typeof Atom; color: string }> = {
  physics: { label: "Physics", icon: Atom, color: "text-blue-600 dark:text-blue-400" },
  chemistry: { label: "Chemistry", icon: FlaskConical, color: "text-green-600 dark:text-green-400" },
  maths: { label: "Maths", icon: Calculator, color: "text-purple-600 dark:text-purple-400" },
};

function selectQuestionsProportional(
  allChapterQuestions: { chapter: string; questions: MockQuestion[] }[],
  count: number
): MockQuestion[] {
  const totalAvailable = allChapterQuestions.reduce((sum, ch) => sum + ch.questions.length, 0);
  if (totalAvailable <= count) {
    // Return all questions shuffled
    const all = allChapterQuestions.flatMap((ch) => ch.questions);
    return all.sort(() => Math.random() - 0.5);
  }

  const selected: MockQuestion[] = [];

  // Proportional selection per chapter
  const chapterAllocations = allChapterQuestions.map((ch) => {
    const proportion = ch.questions.length / totalAvailable;
    const allocation = Math.floor(proportion * count);
    return { ...ch, allocation };
  });

  // Distribute leftover to largest chapters
  const allocated = chapterAllocations.reduce((sum, ch) => sum + ch.allocation, 0);
  let leftover = count - allocated;
  const sorted = [...chapterAllocations].sort((a, b) => b.questions.length - a.questions.length);
  for (let i = 0; leftover > 0 && i < sorted.length; i++) {
    sorted[i].allocation++;
    leftover--;
  }

  for (const ch of chapterAllocations) {
    const shuffled = [...ch.questions].sort(() => Math.random() - 0.5);
    const pick = Math.min(ch.allocation, shuffled.length);
    selected.push(...shuffled.slice(0, pick));
  }

  return selected.sort(() => Math.random() - 0.5);
}

export default function MockTestPage() {
  const [questionsPerSubject, setQuestionsPerSubject] = useState(40);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(120);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState<MockQuestion[] | null>(null);

  const totalQuestions = questionsPerSubject * 3;

  const loadAndStartTest = useCallback(async () => {
    setLoadingState("loading");
    setErrorMsg("");

    try {
      const allQuestions: Record<Subject, { chapter: string; questions: MockQuestion[] }[]> = {
        physics: [],
        chemistry: [],
        maths: [],
      };

      // Load all subject indexes first
      const indexes: Record<Subject, SubjectIndex> = {} as Record<Subject, SubjectIndex>;
      for (const subj of subjects) {
        const res = await fetch(`/data/${subj}/_index.json`);
        if (!res.ok) throw new Error(`Failed to load ${subj} index`);
        indexes[subj] = await res.json();
      }

      // Load all chapter files
      const fetchPromises: Promise<void>[] = [];
      for (const subj of subjects) {
        for (const ch of indexes[subj].chapters) {
          fetchPromises.push(
            fetch(`/data/${subj}/${ch.file}`)
              .then((res) => {
                if (!res.ok) throw new Error(`Failed to load ${subj}/${ch.file}`);
                return res.json();
              })
              .then((data: ChapterData) => {
                const mockQuestions: MockQuestion[] = data.questions.map((q) => ({
                  ...q,
                  subject: subj,
                  chapter: data.chapter,
                }));
                allQuestions[subj].push({
                  chapter: data.chapter,
                  questions: mockQuestions,
                });
              })
          );
        }
      }

      await Promise.all(fetchPromises);

      // Select questions proportionally per subject
      const selected: MockQuestion[] = [];

      for (const subj of subjects) {
        const subjQuestions = selectQuestionsProportional(
          allQuestions[subj],
          questionsPerSubject
        );
        selected.push(...subjQuestions);
      }

      // Group by subject for display order: physics, chemistry, maths
      const ordered: MockQuestion[] = [];
      for (const subj of subjects) {
        ordered.push(...selected.filter((q) => q.subject === subj));
      }

      setSelectedQuestions(ordered);
      setLoadingState("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to load questions");
      setLoadingState("error");
    }
  }, [questionsPerSubject]);

  const handleRetake = useCallback(() => {
    setSelectedQuestions(null);
    setLoadingState("idle");
  }, []);

  // Show mock test if ready
  if (loadingState === "ready" && selectedQuestions) {
    return (
      <main className="min-h-screen">
        <div className="border-b">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <span className="text-sm text-muted-foreground">
              Mock Test &middot; {selectedQuestions.length} questions &middot; {timeLimitMinutes} min
            </span>
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-6">
          <MockTestSession
            questions={selectedQuestions}
            timeLimitMinutes={timeLimitMinutes}
            onRetake={handleRetake}
          />
        </div>
      </main>
    );
  }

  // Setup screen
  return (
    <main className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Mock Test</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulate the real GUJCET exam experience
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mx-auto max-w-md space-y-6">
          {/* Info card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="size-5" />
                Test Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Questions per subject */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Questions per subject
                </label>
                <div className="flex flex-wrap gap-2">
                  {[10, 20, 30, 40, 50].map((n) => (
                    <Button
                      key={n}
                      size="sm"
                      variant={questionsPerSubject === n ? "default" : "outline"}
                      onClick={() => setQuestionsPerSubject(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {totalQuestions} questions ({questionsPerSubject} Physics + {questionsPerSubject} Chemistry + {questionsPerSubject} Maths)
                </p>
              </div>

              {/* Time limit */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="size-4" />
                  Time limit (minutes)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[30, 60, 90, 120, 150, 180].map((m) => (
                    <Button
                      key={m}
                      size="sm"
                      variant={timeLimitMinutes === m ? "default" : "outline"}
                      onClick={() => setTimeLimitMinutes(m)}
                    >
                      {m} min
                    </Button>
                  ))}
                </div>
              </div>

              {/* Subject info */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Subjects</p>
                <div className="flex gap-2">
                  {subjects.map((subj) => {
                    const cfg = subjectConfig[subj];
                    const Icon = cfg.icon;
                    return (
                      <Badge key={subj} variant="secondary" className="gap-1">
                        <Icon className={`size-3 ${cfg.color}`} />
                        {cfg.label}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Questions are randomly selected from all chapters, proportionally distributed.
                </p>
              </div>

              {/* GUJCET format note */}
              <div className="rounded-lg border border-dashed p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Real GUJCET format:</strong> 40 questions per subject (120 total), 120 minutes.
                  The default settings match this format.
                </p>
              </div>

              {/* Error */}
              {loadingState === "error" && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3">
                  <p className="text-sm text-red-600">{errorMsg}</p>
                </div>
              )}

              {/* Start button */}
              <Button
                className="w-full"
                size="lg"
                onClick={loadAndStartTest}
                disabled={loadingState === "loading"}
              >
                {loadingState === "loading" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading questions...
                  </>
                ) : (
                  "Start Mock Test"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* How it works */}
          <Card>
            <CardContent className="py-4 space-y-2">
              <h3 className="font-medium text-sm">How it works</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>1. Questions are randomly selected from all chapters</li>
                <li>2. Answers are NOT revealed until you submit the test</li>
                <li>3. A countdown timer runs throughout the test</li>
                <li>4. The test auto-submits when time runs out</li>
                <li>5. After submission, view your score and review all answers</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
