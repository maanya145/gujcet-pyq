"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Latex } from "@/components/latex";
import { SessionSummary } from "@/components/session-summary";
import type { MockQuestion, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Grid3X3,
  Clock,
  AlertTriangle,
  Send,
} from "lucide-react";

interface MockTestSessionProps {
  questions: MockQuestion[];
  timeLimitMinutes: number;
  onRetake: () => void;
}

const subjectLabels: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Maths",
};

const subjectBadgeColors: Record<Subject, string> = {
  physics: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  chemistry: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  maths: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
};

export function MockTestSession({
  questions,
  timeLimitMinutes,
  onRetake,
}: MockTestSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, { selected: string; correct: boolean | null }>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  const totalSeconds = timeLimitMinutes * 60;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);
  const timeUp = remainingSeconds <= 0;

  const total = questions.length;
  const current = questions[currentIndex];
  const answeredCount = Object.keys(answeredMap).length;

  // Timer
  useEffect(() => {
    if (submitted) return;
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [submitted]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeUp && !submitted) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  // Auto-scroll grid button
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentIndex]);

  const formatCountdown = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const goTo = useCallback(
    (i: number) => setCurrentIndex(Math.max(0, Math.min(i, total - 1))),
    [total]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  const handleAnswer = useCallback(
    (key: string) => {
      if (submitted) return;
      const q = questions[currentIndex];
      const isCorrect = q.answer === null ? null : key === q.answer;
      setAnsweredMap((prev) => ({
        ...prev,
        [currentIndex]: { selected: key, correct: isCorrect },
      }));
    },
    [currentIndex, questions, submitted]
  );

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setShowConfirm(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (submitted) return;

    const keyToOption: Record<string, string> = {
      a: "A", b: "B", c: "C", d: "D",
      "1": "A", "2": "B", "3": "C", "4": "D",
    };

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      const option = keyToOption[e.key.toLowerCase()];
      if (option) handleAnswer(option);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitted, prev, next, handleAnswer]);

  const getGridButtonStyle = (i: number) => {
    if (i === currentIndex) return "ring-2 ring-primary bg-primary text-primary-foreground";
    if (answeredMap[i]) return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
    return "bg-muted text-muted-foreground hover:bg-muted/80";
  };

  const getOptionStyle = (key: string) => {
    const entry = answeredMap[currentIndex];
    if (entry && entry.selected === key) {
      return "border-primary bg-primary/10";
    }
    return "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer";
  };

  const getCircleStyle = (key: string) => {
    const entry = answeredMap[currentIndex];
    if (entry && entry.selected === key) {
      return "border-primary bg-primary text-primary-foreground";
    }
    return "border-muted-foreground/30";
  };

  // Subject section info
  const subjectSections = useMemo(() => {
    const sections: { subject: Subject; start: number; end: number }[] = [];
    let currentSubj: Subject | null = null;
    let start = 0;
    questions.forEach((q, i) => {
      if (q.subject !== currentSubj) {
        if (currentSubj !== null) {
          sections.push({ subject: currentSubj, start, end: i - 1 });
        }
        currentSubj = q.subject;
        start = i;
      }
    });
    if (currentSubj !== null) {
      sections.push({ subject: currentSubj, start, end: questions.length - 1 });
    }
    return sections;
  }, [questions]);

  const currentSection = subjectSections.find(
    (s) => currentIndex >= s.start && currentIndex <= s.end
  );

  if (submitted) {
    return (
      <SessionSummary
        questions={questions}
        answeredMap={answeredMap}
        timeSpent={Math.min(elapsedSeconds, totalSeconds)}
        title="Mock Test Results"
        onRetake={onRetake}
      />
    );
  }

  const optionKeys = ["A", "B", "C", "D"] as const;

  return (
    <div className="space-y-4">
      {/* Top bar: timer + progress + submit */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-2 font-mono text-xl font-bold tabular-nums",
              remainingSeconds <= 300 ? "text-red-500" : "text-foreground",
              remainingSeconds <= 60 && "animate-pulse"
            )}
          >
            <Clock className="size-5" />
            {formatCountdown(remainingSeconds)}
          </div>
          {remainingSeconds <= 300 && remainingSeconds > 0 && (
            <Badge variant="destructive" className="text-xs">
              {remainingSeconds <= 60 ? "Last minute!" : "Less than 5 min"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {answeredCount}/{total} answered
          </span>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowConfirm(true)}
          >
            <Send className="size-4" />
            Submit Test
          </Button>
        </div>
      </div>

      {/* Subject section indicator */}
      <div className="flex items-center gap-2">
        {subjectSections.map((sec) => (
          <button
            key={sec.subject}
            onClick={() => goTo(sec.start)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              currentSection?.subject === sec.subject
                ? subjectBadgeColors[sec.subject]
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {subjectLabels[sec.subject]} ({sec.end - sec.start + 1})
          </button>
        ))}
      </div>

      {/* Question card - NO answer reveal */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {currentIndex + 1}/{total}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {current.year}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs", subjectBadgeColors[current.subject])}
              >
                {subjectLabels[current.subject]}
              </Badge>
            </div>
            {current.answer === null && (
              <Badge variant="outline" className="text-xs text-amber-600">
                No answer key
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-base leading-relaxed">
            <Latex text={current.question} />
          </div>

          <div className="grid gap-2">
            {optionKeys.map((key) => (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                  getOptionStyle(key)
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    getCircleStyle(key)
                  )}
                >
                  {key}
                </span>
                <span className="pt-0.5 text-sm leading-relaxed">
                  <Latex text={current.options[key]} />
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="outline" onClick={() => goTo(0)} disabled={currentIndex === 0}>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button size="icon-sm" variant="outline" onClick={prev} disabled={currentIndex === 0}>
            <ChevronLeft className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {total}
            </span>
            {total > 20 && (
              <button
                onClick={() => setShowGrid((v) => !v)}
                className="inline-flex items-center justify-center size-9 min-w-[44px] min-h-[44px] rounded-md text-muted-foreground hover:bg-muted/80 transition-colors"
                aria-label={showGrid ? "Hide question grid" : "Show question grid"}
              >
                <Grid3X3 className="size-4" />
              </button>
            )}
          </div>
          {(total <= 20 || showGrid) && (
            <div className="flex flex-wrap justify-center gap-1 overflow-x-hidden overflow-y-auto max-h-40 sm:max-h-48 w-full">
              {questions.map((_, i) => (
                <button
                  key={i}
                  ref={i === currentIndex ? activeBtnRef : undefined}
                  onClick={() => goTo(i)}
                  className={`size-8 shrink-0 rounded-md text-xs font-medium transition-colors ${getGridButtonStyle(i)}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="outline" onClick={next} disabled={currentIndex === total - 1}>
            <ChevronRight className="size-4" />
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => goTo(total - 1)} disabled={currentIndex === total - 1}>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        Use <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">&#8592;</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">&#8594;</kbd> to
        navigate &middot; Press{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">A</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">B</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">C</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">D</kbd> to select
      </p>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="size-5" />
                <h3 className="font-semibold">Submit Test?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                You have answered {answeredCount} out of {total} questions.
                {total - answeredCount > 0 && (
                  <span className="font-medium text-foreground">
                    {" "}{total - answeredCount} questions are unanswered.
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Time remaining: {formatCountdown(remainingSeconds)}
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                  Continue Test
                </Button>
                <Button variant="default" size="sm" onClick={handleSubmit}>
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
