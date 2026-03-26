"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Latex } from "@/components/latex";
import type { MockQuestion, Subject } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  X,
  Minus,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Clock,
  Target,
  BarChart3,
} from "lucide-react";

interface SessionSummaryProps {
  questions: MockQuestion[];
  answeredMap: Record<number, { selected: string; correct: boolean | null }>;
  timeSpent: number; // seconds
  title: string;
  onRetake: () => void;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const subjectLabels: Record<Subject, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Maths",
};

const subjectColors: Record<Subject, string> = {
  physics: "text-blue-600 dark:text-blue-400",
  chemistry: "text-green-600 dark:text-green-400",
  maths: "text-purple-600 dark:text-purple-400",
};

export function SessionSummary({
  questions,
  answeredMap,
  timeSpent,
  title,
  onRetake,
}: SessionSummaryProps) {
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const stats = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    let ungraded = 0;

    questions.forEach((q, i) => {
      const entry = answeredMap[i];
      if (!entry) {
        unanswered++;
      } else if (entry.correct === true) {
        correct++;
      } else if (entry.correct === false) {
        incorrect++;
      } else {
        ungraded++;
      }
    });

    const gradedTotal = correct + incorrect;
    const accuracy = gradedTotal > 0 ? Math.round((correct / gradedTotal) * 100) : 0;
    const total = questions.length;
    const score = correct;

    return { correct, incorrect, unanswered, ungraded, accuracy, total, score, gradedTotal };
  }, [questions, answeredMap]);

  const subjectStats = useMemo(() => {
    const map: Record<string, { correct: number; incorrect: number; unanswered: number; ungraded: number; total: number }> = {};
    questions.forEach((q, i) => {
      const subj = q.subject;
      if (!map[subj]) map[subj] = { correct: 0, incorrect: 0, unanswered: 0, ungraded: 0, total: 0 };
      map[subj].total++;
      const entry = answeredMap[i];
      if (!entry) {
        map[subj].unanswered++;
      } else if (entry.correct === true) {
        map[subj].correct++;
      } else if (entry.correct === false) {
        map[subj].incorrect++;
      } else {
        map[subj].ungraded++;
      }
    });
    return map;
  }, [questions, answeredMap]);

  if (reviewMode) {
    const q = questions[reviewIndex];
    const entry = answeredMap[reviewIndex];
    const optionKeys = ["A", "B", "C", "D"] as const;

    const getOptionStyle = (key: string) => {
      if (q.answer === null) {
        if (entry && key === entry.selected) {
          return "border-amber-500 bg-amber-100 dark:bg-amber-950/30";
        }
        return "border-border opacity-60";
      }
      if (key === q.answer) {
        return "border-green-600 dark:border-green-500 bg-green-100 dark:bg-green-950/30";
      }
      if (entry && key === entry.selected && key !== q.answer) {
        return "border-red-600 dark:border-red-500 bg-red-100 dark:bg-red-950/30";
      }
      return "border-border opacity-60";
    };

    const getCircleStyle = (key: string) => {
      if (q.answer === null && entry && key === entry.selected) {
        return "border-amber-500 bg-amber-500 text-white";
      }
      if (key === q.answer) {
        return "border-green-600 bg-green-600 dark:border-green-500 dark:bg-green-500 text-white";
      }
      if (entry && key === entry.selected) {
        return "border-red-600 bg-red-600 dark:border-red-500 dark:bg-red-500 text-white";
      }
      return "border-muted-foreground/30";
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setReviewMode(false)}>
            <ChevronLeft className="size-4" />
            Back to Summary
          </Button>
          <span className="text-sm text-muted-foreground">
            Reviewing {reviewIndex + 1} of {questions.length}
          </span>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {reviewIndex + 1}/{questions.length}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {q.year}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs capitalize", subjectColors[q.subject])}
                >
                  {subjectLabels[q.subject]}
                </Badge>
              </div>
              {!entry ? (
                <Badge variant="outline" className="text-xs text-muted-foreground">Unanswered</Badge>
              ) : entry.correct === true ? (
                <Badge className="bg-green-600 text-xs">Correct</Badge>
              ) : entry.correct === false ? (
                <Badge className="bg-red-600 text-xs">Incorrect</Badge>
              ) : (
                <Badge className="bg-amber-500 text-xs">Ungraded</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-base leading-relaxed">
              <Latex text={q.question} />
            </div>

            <div className="grid gap-2">
              {optionKeys.map((key) => (
                <div
                  key={key}
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
                    <Latex text={q.options[key]} />
                  </span>
                </div>
              ))}
            </div>

            {q.answer === null && (
              <p className="text-xs text-amber-600">
                Answer key not available for this question
              </p>
            )}
            {entry && q.answer !== null && (
              <p className="text-xs text-muted-foreground">
                Your answer: <strong>{entry.selected}</strong> &middot; Correct answer: <strong>{q.answer}</strong>
              </p>
            )}
            {!entry && q.answer !== null && (
              <p className="text-xs text-muted-foreground">
                Not answered &middot; Correct answer: <strong>{q.answer}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
            disabled={reviewIndex === 0}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReviewIndex((i) => Math.min(questions.length - 1, i + 1))}
            disabled={reviewIndex === questions.length - 1}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* Quick nav grid */}
        <div className="flex flex-wrap justify-center gap-1 overflow-y-auto max-h-40">
          {questions.map((_, i) => {
            const e = answeredMap[i];
            let style = "bg-muted text-muted-foreground";
            if (i === reviewIndex) {
              style = "ring-2 ring-primary bg-primary text-primary-foreground";
            } else if (!e) {
              style = "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400";
            } else if (e.correct === true) {
              style = "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
            } else if (e.correct === false) {
              style = "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
            } else {
              style = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
            }
            return (
              <button
                key={i}
                onClick={() => setReviewIndex(i)}
                className={`size-8 shrink-0 rounded-md text-xs font-medium transition-colors ${style}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Summary view
  const scorePercent = stats.total > 0 ? Math.round((stats.score / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-muted-foreground">Test completed</p>
      </div>

      {/* Score cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Trophy className="size-8 text-amber-500 mb-2" />
            <p className="text-3xl font-bold">{stats.score}/{stats.total}</p>
            <p className="text-sm text-muted-foreground">Score ({scorePercent}%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Target className="size-8 text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{stats.accuracy}%</p>
            <p className="text-sm text-muted-foreground">
              Accuracy ({stats.gradedTotal} graded)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Clock className="size-8 text-green-500 mb-2" />
            <p className="text-3xl font-bold font-mono">{formatTime(timeSpent)}</p>
            <p className="text-sm text-muted-foreground">Time Spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="size-5" />
            Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Check className="size-5 text-green-600" />
              <div>
                <p className="text-lg font-bold text-green-600">{stats.correct}</p>
                <p className="text-xs text-muted-foreground">Correct</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <X className="size-5 text-red-600" />
              <div>
                <p className="text-lg font-bold text-red-600">{stats.incorrect}</p>
                <p className="text-xs text-muted-foreground">Incorrect</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Minus className="size-5 text-gray-500" />
              <div>
                <p className="text-lg font-bold text-gray-500">{stats.unanswered}</p>
                <p className="text-xs text-muted-foreground">Unanswered</p>
              </div>
            </div>
            {stats.ungraded > 0 && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <AlertTriangle className="size-5 text-amber-500" />
                <div>
                  <p className="text-lg font-bold text-amber-500">{stats.ungraded}</p>
                  <p className="text-xs text-muted-foreground">No Answer Key</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subject breakdown */}
      {Object.keys(subjectStats).length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Subject-wise Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(["physics", "chemistry", "maths"] as Subject[]).map((subj) => {
                const s = subjectStats[subj];
                if (!s) return null;
                const subjAccuracy =
                  s.correct + s.incorrect > 0
                    ? Math.round((s.correct / (s.correct + s.incorrect)) * 100)
                    : 0;
                const barWidth = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div key={subj}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-sm font-medium capitalize", subjectColors[subj])}>
                        {subjectLabels[subj]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {s.correct}/{s.total} ({subjAccuracy}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          subj === "physics"
                            ? "bg-blue-500"
                            : subj === "chemistry"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        )}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {questions.map((q, i) => {
              const entry = answeredMap[i];
              let statusIcon = <Minus className="size-4 text-gray-400" />;
              let statusBg = "";
              if (!entry) {
                statusIcon = <Minus className="size-4 text-gray-400" />;
                statusBg = "";
              } else if (entry.correct === true) {
                statusIcon = <Check className="size-4 text-green-600" />;
                statusBg = "bg-green-50 dark:bg-green-950/20";
              } else if (entry.correct === false) {
                statusIcon = <X className="size-4 text-red-600" />;
                statusBg = "bg-red-50 dark:bg-red-950/20";
              } else {
                statusIcon = <AlertTriangle className="size-4 text-amber-500" />;
                statusBg = "bg-amber-50 dark:bg-amber-950/20";
              }

              return (
                <button
                  key={i}
                  onClick={() => {
                    setReviewIndex(i);
                    setReviewMode(true);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50",
                    statusBg
                  )}
                >
                  {statusIcon}
                  <span className="font-mono text-xs text-muted-foreground w-8">
                    Q{i + 1}
                  </span>
                  <span className={cn("text-xs capitalize", subjectColors[q.subject])}>
                    {subjectLabels[q.subject]}
                  </span>
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {q.question.replace(/\$[^$]*\$/g, "[math]").slice(0, 60)}...
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry ? entry.selected : "-"} / {q.answer || "?"}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button onClick={() => { setReviewIndex(0); setReviewMode(true); }}>
          Review Answers
        </Button>
        <Button variant="outline" onClick={onRetake}>
          Take Another Test
        </Button>
      </div>
    </div>
  );
}
