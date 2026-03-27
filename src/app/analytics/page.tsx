"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllHistory, type SessionResult } from "@/lib/storage";
import {
  Target,
  Clock,
  Hash,
  TrendingUp,
  AlertTriangle,
  Atom,
  FlaskConical,
  Calculator,
} from "lucide-react";

const subjectConfig: Record<
  string,
  { label: string; icon: typeof Atom; color: string; accent: string; bg: string }
> = {
  physics: {
    label: "Physics",
    icon: Atom,
    color: "text-blue-600",
    accent: "border-blue-600",
    bg: "bg-blue-600",
  },
  chemistry: {
    label: "Chemistry",
    icon: FlaskConical,
    color: "text-green-600",
    accent: "border-green-600",
    bg: "bg-green-600",
  },
  maths: {
    label: "Maths",
    icon: Calculator,
    color: "text-purple-600",
    accent: "border-purple-600",
    bg: "bg-purple-600",
  },
};

function formatChapterName(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimeShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

interface FlatSession {
  subject: string;
  chapter: string;
  result: SessionResult;
}

export default function AnalyticsPage() {
  const [allHistory, setAllHistory] = useState<
    { subject: string; chapter: string; results: SessionResult[] }[]
  >([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAllHistory(getAllHistory());
    setLoaded(true);
  }, []);

  // Flatten all sessions
  const flatSessions = useMemo<FlatSession[]>(() => {
    const sessions: FlatSession[] = [];
    for (const entry of allHistory) {
      for (const result of entry.results) {
        sessions.push({
          subject: entry.subject,
          chapter: entry.chapter,
          result,
        });
      }
    }
    return sessions;
  }, [allHistory]);

  // Overall stats
  const overall = useMemo(() => {
    const totalQuestions = flatSessions.reduce((s, f) => s + f.result.total, 0);
    const totalTime = flatSessions.reduce((s, f) => s + f.result.timeSpent, 0);
    const totalSessions = flatSessions.length;

    // Weighted accuracy: sum(correct) / sum(correct + incorrect) across graded results
    let totalCorrect = 0;
    let totalGraded = 0;
    for (const f of flatSessions) {
      totalCorrect += f.result.correct;
      totalGraded += f.result.correct + f.result.incorrect;
    }
    const overallAccuracy = totalGraded > 0 ? (totalCorrect / totalGraded) * 100 : 0;

    return { totalQuestions, totalTime, totalSessions, overallAccuracy };
  }, [flatSessions]);

  // Subject breakdown
  const subjectStats = useMemo(() => {
    const subjects = ["physics", "chemistry", "maths"];
    return subjects.map((subject) => {
      const entries = allHistory.filter((e) => e.subject === subject);
      const sessions = flatSessions.filter((f) => f.subject === subject);
      const totalQuestions = sessions.reduce((s, f) => s + f.result.total, 0);
      const chaptersAttempted = entries.length;

      let totalCorrect = 0;
      let totalGraded = 0;
      for (const f of sessions) {
        totalCorrect += f.result.correct;
        totalGraded += f.result.correct + f.result.incorrect;
      }
      const avgAccuracy = totalGraded > 0 ? (totalCorrect / totalGraded) * 100 : 0;

      return { subject, totalQuestions, chaptersAttempted, avgAccuracy, totalSessions: sessions.length };
    });
  }, [allHistory, flatSessions]);

  // Weakest chapters (top 5)
  const weakestChapters = useMemo(() => {
    const chapterStats = allHistory.map((entry) => {
      let totalCorrect = 0;
      let totalGraded = 0;
      for (const r of entry.results) {
        totalCorrect += r.correct;
        totalGraded += r.correct + r.incorrect;
      }
      const avgAccuracy = totalGraded > 0 ? (totalCorrect / totalGraded) * 100 : 0;
      return {
        subject: entry.subject,
        chapter: entry.chapter,
        avgAccuracy,
        attempts: entry.results.length,
      };
    });
    return chapterStats
      .filter((c) => c.attempts >= 1)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
      .slice(0, 5);
  }, [allHistory]);

  // Recent activity (last 10 sessions by date)
  const recentActivity = useMemo(() => {
    return [...flatSessions]
      .sort((a, b) => new Date(b.result.date).getTime() - new Date(a.result.date).getTime())
      .slice(0, 10);
  }, [flatSessions]);

  // Accuracy over time (last 20 sessions)
  const accuracyTimeline = useMemo(() => {
    return [...flatSessions]
      .sort((a, b) => new Date(a.result.date).getTime() - new Date(b.result.date).getTime())
      .slice(-20);
  }, [flatSessions]);

  if (!loaded) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Skeleton className="h-8 w-56 mb-8" />
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border p-6">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-6 space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (flatSessions.length === 0) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="py-16 text-center">
              <Target className="mx-auto mb-4 size-12 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold">No Analytics Yet</h2>
              <p className="mt-2 text-muted-foreground">
                Start practicing to see your analytics here.
              </p>
              <Link href="/">
                <Button className="mt-6">Start Practicing</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
          Performance Analytics
        </h1>

        {/* Overall Stats */}
        <div className="mb-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Hash className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{overall.totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">Questions Practiced</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{formatTime(overall.totalTime)}</p>
                  <p className="text-xs text-muted-foreground">Time Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{overall.overallAccuracy.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Overall Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{overall.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Sessions Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Breakdown */}
        <h2 className="mb-4 text-lg font-semibold">Subject Breakdown</h2>
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {subjectStats.map((stat) => {
            const config = subjectConfig[stat.subject];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <Card key={stat.subject} className={`border-l-4 ${config.accent}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-5 ${config.color}`} />
                    <CardTitle className="text-base">{config.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Accuracy</span>
                      <span className="font-medium">
                        {stat.totalSessions > 0 ? `${stat.avgAccuracy.toFixed(1)}%` : "N/A"}
                      </span>
                    </div>
                    {stat.totalSessions > 0 && (
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${config.bg}`}
                          style={{ width: `${Math.min(stat.avgAccuracy, 100)}%` }}
                        />
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-medium">{stat.totalQuestions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Chapters</span>
                      <span className="font-medium">{stat.chaptersAttempted}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Accuracy Over Time Chart */}
        {accuracyTimeline.length > 1 && (
          <>
            <h2 className="mb-4 text-lg font-semibold">Accuracy Over Time</h2>
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="relative">
                  {/* Y-axis labels */}
                  <div className="flex flex-col justify-between text-xs text-muted-foreground absolute left-0 top-0 bottom-6 w-8">
                    <span>100%</span>
                    <span>50%</span>
                    <span>0%</span>
                  </div>
                  {/* Chart area */}
                  <div className="ml-10">
                    {/* Grid lines */}
                    <div className="relative h-48 border-b border-l border-muted">
                      {/* Horizontal guide lines */}
                      <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 right-0 border-t border-dashed border-muted-foreground/20" />
                        <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-muted-foreground/20" />
                      </div>
                      {/* Bars */}
                      <div className="absolute inset-0 flex items-end justify-around gap-1 px-1">
                        {accuracyTimeline.map((session, i) => {
                          const accuracy = session.result.accuracy;
                          const colorClass =
                            accuracy >= 70
                              ? "bg-green-500"
                              : accuracy >= 50
                                ? "bg-amber-500"
                                : "bg-red-500";
                          return (
                            <div
                              key={i}
                              className="group relative flex flex-1 flex-col items-center"
                              style={{ height: "100%" }}
                            >
                              <div className="flex h-full w-full items-end justify-center">
                                <div
                                  className={`w-full max-w-[24px] rounded-t ${colorClass} transition-all hover:opacity-80`}
                                  style={{ height: `${Math.max(accuracy, 2)}%` }}
                                  title={`${accuracy.toFixed(0)}% - ${formatChapterName(session.chapter)}`}
                                />
                              </div>
                              {/* Tooltip on hover */}
                              <div className="pointer-events-none absolute bottom-full mb-2 hidden rounded bg-popover px-2 py-1 text-xs shadow-md group-hover:block whitespace-nowrap border z-10">
                                <p className="font-medium">{accuracy.toFixed(0)}%</p>
                                <p className="text-muted-foreground">
                                  {formatChapterName(session.chapter)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* X-axis labels */}
                    <div className="flex justify-around mt-1">
                      {accuracyTimeline.map((session, i) => {
                        // Show labels only for first, middle, and last
                        const show =
                          i === 0 ||
                          i === accuracyTimeline.length - 1 ||
                          i === Math.floor(accuracyTimeline.length / 2);
                        if (!show) return <div key={i} className="flex-1" />;
                        const d = new Date(session.result.date);
                        return (
                          <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground">
                            {d.getDate()}/{d.getMonth() + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="size-2.5 rounded-full bg-green-500" />
                    <span>&ge;70%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2.5 rounded-full bg-amber-500" />
                    <span>50-70%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2.5 rounded-full bg-red-500" />
                    <span>&lt;50%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Weakest Chapters */}
        {weakestChapters.length > 0 && (
          <>
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Weakest Chapters
            </h2>
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {weakestChapters.map((ch, i) => {
                    const config = subjectConfig[ch.subject];
                    const accuracyColor =
                      ch.avgAccuracy >= 70
                        ? "text-green-600 dark:text-green-400"
                        : ch.avgAccuracy >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400";
                    return (
                      <Link
                        key={`${ch.subject}-${ch.chapter}`}
                        href={`/${ch.subject}/${ch.chapter}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {formatChapterName(ch.chapter)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] px-1.5">
                                  {config?.label ?? ch.subject}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {ch.attempts} {ch.attempts === 1 ? "attempt" : "attempts"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${accuracyColor} shrink-0 ml-2`}>
                            {ch.avgAccuracy.toFixed(1)}%
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Recent Activity */}
        <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
        <Card className="mb-8">
          <CardContent className="pt-6">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Subject</th>
                    <th className="pb-2 font-medium">Chapter</th>
                    <th className="pb-2 font-medium text-right">Score</th>
                    <th className="pb-2 font-medium text-right">Accuracy</th>
                    <th className="pb-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((session, i) => {
                    const config = subjectConfig[session.subject];
                    const d = new Date(session.result.date);
                    const dateStr = d.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const accuracyColor =
                      session.result.accuracy >= 70
                        ? "text-green-600 dark:text-green-400"
                        : session.result.accuracy >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-red-600 dark:text-red-400";
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5">
                          <Link
                            href={`/${session.subject}/${session.chapter}`}
                            className="hover:underline"
                          >
                            {dateStr}
                          </Link>
                        </td>
                        <td className="py-2.5">
                          <span className={config?.color}>
                            {config?.label ?? session.subject}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <Link
                            href={`/${session.subject}/${session.chapter}`}
                            className="hover:underline"
                          >
                            {formatChapterName(session.chapter)}
                          </Link>
                        </td>
                        <td className="py-2.5 text-right">
                          {session.result.correct}/{session.result.total}
                        </td>
                        <td className={`py-2.5 text-right font-medium ${accuracyColor}`}>
                          {session.result.accuracy.toFixed(0)}%
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          {formatTimeShort(session.result.timeSpent)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {recentActivity.map((session, i) => {
                const config = subjectConfig[session.subject];
                const d = new Date(session.result.date);
                const dateStr = d.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                });
                const accuracyColor =
                  session.result.accuracy >= 70
                    ? "text-green-600 dark:text-green-400"
                    : session.result.accuracy >= 50
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400";
                return (
                  <Link
                    key={i}
                    href={`/${session.subject}/${session.chapter}`}
                    className="block"
                  >
                    <div className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{dateStr}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {config?.label ?? session.subject}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm truncate">
                        {formatChapterName(session.chapter)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs">
                        <span>
                          {session.result.correct}/{session.result.total}
                        </span>
                        <span className={`font-medium ${accuracyColor}`}>
                          {session.result.accuracy.toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground">
                          {formatTimeShort(session.result.timeSpent)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
