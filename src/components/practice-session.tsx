"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCard } from "@/components/question-card";
import { AIChat } from "@/components/ai-chat";
import { Timer } from "@/components/timer";
import { useSwipe } from "@/lib/use-swipe";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";
import {
  saveSession,
  loadSession,
  clearSession,
  saveResult,
  type SessionState,
} from "@/lib/storage";
import {
  getBookmarkKey,
  toggleBookmark,
  getAllBookmarks,
} from "@/lib/bookmarks";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shuffle,
  Eye,
  EyeOff,
  Check,
  X,
  Grid3X3,
  AlertTriangle,
  RotateCcw,
  Play,
  Bookmark,
  ArrowUpDown,
  Info,
} from "lucide-react";

interface PracticeSessionProps {
  questions: Question[];
  chapterName: string;
  chapterSlug: string;
  subjectName: string;
  subject: string;
  backHref?: string;
  backLabel?: string;
}

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function PracticeSession({
  questions: originalQuestions,
  chapterName,
  chapterSlug,
  subjectName,
  subject,
  backHref,
}: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, { selected: string; correct: boolean | null }>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[] | null>(null);
  const [questions, setQuestions] = useState(originalQuestions);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [hideNullAnswers, setHideNullAnswers] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [keyboardSelection, setKeyboardSelection] = useState<string | null>(null);
  const [resumePrompt, setResumePrompt] = useState<SessionState | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [bookmarkFilter, setBookmarkFilter] = useState(false);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [showChat, setShowChat] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "difficulty" | "difficulty-desc" | "newest">("default");
  const [excludedYears, setExcludedYears] = useState<Set<number>>(new Set());
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [showSortHelp, setShowSortHelp] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  const timerSecondsRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    const allKeys = new Set(getAllBookmarks());
    setBookmarkedKeys(allKeys);
  }, []);

  // Check for saved session on mount
  useEffect(() => {
    const saved = loadSession(subject, chapterSlug);
    if (saved && Date.now() - saved.timestamp < SESSION_MAX_AGE_MS) {
      // Only show resume prompt if there are answered questions
      if (Object.keys(saved.answeredMap).length > 0) {
        setResumePrompt(saved);
      } else {
        setSessionChecked(true);
      }
    } else {
      if (saved) {
        clearSession(subject, chapterSlug);
      }
      setSessionChecked(true);
    }
  }, [subject, chapterSlug]);

  const restoreSession = useCallback(
    (saved: SessionState) => {
      setAnsweredMap(saved.answeredMap);
      setCurrentIndex(saved.currentIndex);
      setYearFilter(saved.yearFilter);
      setHideNullAnswers(saved.hideNullAnswers);
      setInitialTimerSeconds(saved.timerSeconds);
      timerSecondsRef.current = saved.timerSeconds;

      if (saved.shuffled && saved.shuffledOrder) {
        const reordered = saved.shuffledOrder.map((idx) => originalQuestions[idx]);
        setQuestions(reordered);
        setShuffled(true);
        setShuffledOrder(saved.shuffledOrder);
      }

      setResumePrompt(null);
      setSessionChecked(true);
    },
    [originalQuestions]
  );

  const startFresh = useCallback(() => {
    clearSession(subject, chapterSlug);
    setResumePrompt(null);
    setSessionChecked(true);
  }, [subject, chapterSlug]);

  // Auto-save session with debounce when answeredMap or currentIndex changes
  useEffect(() => {
    if (!sessionChecked) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const state: SessionState = {
        answeredMap,
        currentIndex,
        yearFilter,
        hideNullAnswers,
        shuffled,
        shuffledOrder,
        timerSeconds: timerSecondsRef.current,
        timestamp: Date.now(),
      };
      saveSession(subject, chapterSlug, state);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answeredMap, currentIndex, yearFilter, hideNullAnswers, shuffled, shuffledOrder, sessionChecked, subject, chapterSlug]);

  const handleTimerTick = useCallback((seconds: number) => {
    timerSecondsRef.current = seconds;
  }, []);

  const years = useMemo(() => {
    const y = Array.from(new Set(originalQuestions.map((q) => q.year))).sort();
    return y;
  }, [originalQuestions]);

  const getKeyForQuestion = useCallback(
    (q: Question) => getBookmarkKey(subjectName, chapterName, q.year, q.number),
    [subjectName, chapterName]
  );

  const filteredQuestions = useMemo(() => {
    let result = questions;
    if (yearFilter !== null) {
      result = result.filter((q) => q.year === yearFilter);
    } else if (excludedYears.size > 0) {
      result = result.filter((q) => !excludedYears.has(q.year));
    }
    if (hideNullAnswers) result = result.filter((q) => q.answer !== null);
    if (difficultyFilter !== "all") result = result.filter((q) => q.difficulty === difficultyFilter);
    if (bookmarkFilter) result = result.filter((q) => bookmarkedKeys.has(getKeyForQuestion(q)));

    // Apply sorting
    if (sortBy === "difficulty") {
      const order = { easy: 0, medium: 1, hard: 2 };
      result = [...result].sort((a, b) => (order[a.difficulty ?? "medium"] ?? 1) - (order[b.difficulty ?? "medium"] ?? 1));
    } else if (sortBy === "difficulty-desc") {
      const order = { easy: 0, medium: 1, hard: 2 };
      result = [...result].sort((a, b) => (order[b.difficulty ?? "medium"] ?? 1) - (order[a.difficulty ?? "medium"] ?? 1));
    } else if (sortBy === "newest") {
      result = [...result].sort((a, b) => b.year - a.year || b.number - a.number);
    }

    return result;
  }, [questions, yearFilter, excludedYears, hideNullAnswers, difficultyFilter, bookmarkFilter, bookmarkedKeys, getKeyForQuestion, sortBy]);

  // In review mode, further filter to only wrong answers.
  // reviewIndexMap maps displayQuestions index -> filteredQuestions index
  const { displayQuestions, reviewIndexMap } = useMemo(() => {
    if (!reviewMode) {
      return { displayQuestions: filteredQuestions, reviewIndexMap: null };
    }
    const indices: number[] = [];
    const result: Question[] = [];
    for (let i = 0; i < filteredQuestions.length; i++) {
      if (answeredMap[i]?.correct === false) {
        indices.push(i);
        result.push(filteredQuestions[i]);
      }
    }
    return { displayQuestions: result, reviewIndexMap: indices };
  }, [filteredQuestions, reviewMode, answeredMap]);

  const bookmarkedCount = useMemo(() => {
    return questions.filter((q) => bookmarkedKeys.has(getKeyForQuestion(q))).length;
  }, [questions, bookmarkedKeys, getKeyForQuestion]);

  const nullAnswerCount = useMemo(() => {
    let base = questions;
    if (yearFilter !== null) base = base.filter((q) => q.year === yearFilter);
    return base.filter((q) => q.answer === null).length;
  }, [questions, yearFilter]);

  const total = displayQuestions.length;
  const current = displayQuestions[currentIndex] || displayQuestions[0];
  const answered = Object.keys(answeredMap).length;

  // Map from display index to the filteredQuestions index used in answeredMap
  const mapToFilteredIndex = useCallback(
    (displayIdx: number) => {
      if (reviewIndexMap) return reviewIndexMap[displayIdx] ?? displayIdx;
      return displayIdx;
    },
    [reviewIndexMap]
  );

  const filteredIndex = mapToFilteredIndex(currentIndex);

  const { correctCount, incorrectCount, ungradedCount, accuracy } = useMemo(() => {
    const entries = Object.values(answeredMap);
    const correct = entries.filter((e) => e.correct === true).length;
    const incorrect = entries.filter((e) => e.correct === false).length;
    const ungraded = entries.filter((e) => e.correct === null).length;
    const gradedTotal = correct + incorrect;
    const acc = gradedTotal > 0 ? Math.round((correct / gradedTotal) * 100) : 0;
    return { correctCount: correct, incorrectCount: incorrect, ungradedCount: ungraded, accuracy: acc };
  }, [answeredMap]);

  const goTo = useCallback(
    (i: number) => {
      setCurrentIndex(Math.max(0, Math.min(i, total - 1)));
    },
    [total]
  );

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  const handleShuffle = useCallback(() => {
    // Create indices and shuffle them
    const indices = originalQuestions.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const shuffledQ = indices.map((idx) => originalQuestions[idx]);
    setQuestions(shuffledQ);
    setShuffled(true);
    setShuffledOrder(indices);
    setCurrentIndex(0);
    setAnsweredMap({});
    setReviewMode(false);
  }, [originalQuestions]);

  const handleReset = useCallback(() => {
    // Save result before clearing
    if (Object.keys(answeredMap).length > 0) {
      const entries = Object.values(answeredMap);
      const correct = entries.filter((e) => e.correct === true).length;
      const incorrect = entries.filter((e) => e.correct === false).length;
      const ungraded = entries.filter((e) => e.correct === null).length;
      const gradedTotal = correct + incorrect;
      saveResult(subject, chapterSlug, {
        date: new Date().toISOString(),
        correct,
        incorrect,
        ungraded,
        total: entries.length,
        accuracy: gradedTotal > 0 ? Math.round((correct / gradedTotal) * 100) : 0,
        timeSpent: timerSecondsRef.current,
      });
    }
    setQuestions(originalQuestions);
    setShuffled(false);
    setShuffledOrder(null);
    setCurrentIndex(0);
    setAnsweredMap({});
    setShowAllAnswers(false);
    setReviewMode(false);
    clearSession(subject, chapterSlug);
  }, [originalQuestions, answeredMap, subject, chapterSlug]);

  const handleAnswer = useCallback((selected: string, isCorrect: boolean | null) => {
    setAnsweredMap((prev) => ({ ...prev, [filteredIndex]: { selected, correct: isCorrect } }));
  }, [filteredIndex]);

  const handleRetry = useCallback(() => {
    setAnsweredMap((prev) => {
      const next = { ...prev };
      delete next[filteredIndex];
      return next;
    });
  }, [filteredIndex]);

  const handleToggleReviewMode = useCallback(() => {
    setReviewMode((prev) => !prev);
    setCurrentIndex(0);
  }, []);

  const handleKeyboardSelect = useCallback((option: string) => {
    setKeyboardSelection(option);
  }, []);

  const handleToggleBookmark = useCallback(
    (q: Question) => {
      const key = getKeyForQuestion(q);
      const newState = toggleBookmark(key);
      setBookmarkedKeys((prev) => {
        const next = new Set(prev);
        if (newState) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [getKeyForQuestion]
  );

  // Auto-scroll the active grid button into view
  useEffect(() => {
    if (activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [currentIndex]);

  // Reset keyboard selection after it's been consumed
  useEffect(() => {
    if (keyboardSelection) {
      const timer = setTimeout(() => setKeyboardSelection(null), 50);
      return () => clearTimeout(timer);
    }
  }, [keyboardSelection]);

  const swipeHandlers = useSwipe(next, prev);

  const getGridButtonStyle = (i: number) => {
    const fi = mapToFilteredIndex(i);
    if (i === currentIndex) return "bg-primary text-primary-foreground";
    if (answeredMap[fi]) {
      if (answeredMap[fi].correct === true) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      if (answeredMap[fi].correct === false) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    }
    return "bg-muted text-muted-foreground hover:bg-muted/80";
  };

  // Show resume prompt if a saved session was found
  if (resumePrompt) {
    const savedAnswered = Object.keys(resumePrompt.answeredMap).length;
    const savedEntries = Object.values(resumePrompt.answeredMap);
    const savedCorrect = savedEntries.filter((e) => e.correct === true).length;
    const savedIncorrect = savedEntries.filter((e) => e.correct === false).length;
    const savedGraded = savedCorrect + savedIncorrect;
    const savedAccuracy = savedGraded > 0 ? Math.round((savedCorrect / savedGraded) * 100) : 0;
    const savedMinutes = Math.floor(resumePrompt.timerSeconds / 60);

    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-8 text-center space-y-4">
          <h2 className="text-lg font-semibold">Resume Previous Session?</h2>
          <p className="text-sm text-muted-foreground">
            You have an unfinished session for this chapter.
          </p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              {savedAnswered} question{savedAnswered !== 1 ? "s" : ""} answered
              {savedGraded > 0 && <> &middot; {savedAccuracy}% accuracy</>}
            </p>
            {savedMinutes > 0 && <p>{savedMinutes} min spent</p>}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button onClick={() => restoreSession(resumePrompt)} size="sm">
              <Play className="size-4" />
              Resume
            </Button>
            <Button onClick={startFresh} size="sm" variant="outline">
              <RotateCcw className="size-4" />
              Start Fresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessionChecked) {
    return null;
  }

  if (!current) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No questions found for this filter.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row 1 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-semibold capitalize truncate">{chapterName.replace(/_/g, " ")}</h1>
            <p className="text-xs text-muted-foreground capitalize">
              {subjectName} &middot; {total} questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Stat pills - desktop only */}
          {answered > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500">
                <Check className="size-3.5" />
                {correctCount}
              </span>
              <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-500">
                <X className="size-3.5" />
                {incorrectCount}
              </span>
              {ungradedCount > 0 && (
                <span className="text-sm text-amber-500">
                  ? {ungradedCount}
                </span>
              )}
              {(correctCount + incorrectCount) > 0 && (
                <span className="text-xs font-medium rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  {accuracy}%
                </span>
              )}
            </div>
          )}
          <Timer initialSeconds={initialTimerSeconds} onTick={handleTimerTick} variant="compact" />
        </div>
      </div>

      {/* Header Row 2 - mobile stat pills */}
      {answered > 0 && (
        <div className="flex items-center gap-2 sm:hidden">
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500">
            <Check className="size-3.5" />
            {correctCount}
          </span>
          <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-500">
            <X className="size-3.5" />
            {incorrectCount}
          </span>
          {ungradedCount > 0 && (
            <span className="text-sm text-amber-500">
              ? {ungradedCount}
            </span>
          )}
          {(correctCount + incorrectCount) > 0 && (
            <span className="text-xs font-medium rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
              {accuracy}%
            </span>
          )}
        </div>
      )}

      {/* Sort/filter help */}
      {showSortHelp && (
        <div className="rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-1">
          <p><strong>Year:</strong> Click a year to select it. In &quot;All&quot; mode, click to exclude years (strikethrough). Double-click to select only that year.</p>
          <p><strong>Sort:</strong> Reorder questions by default order, newest year first, or difficulty level.</p>
          <p><strong>Difficulty:</strong> Filter to only show Easy, Medium, or Hard questions.</p>
        </div>
      )}

      {/* Year filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setShowSortHelp(!showSortHelp)}
          className="rounded-full p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Sorting & filtering help"
        >
          <Info className="size-3.5" />
        </button>
        <span className="text-xs text-muted-foreground mr-1">Year:</span>
        <Button
          size="xs"
          variant={yearFilter === null && excludedYears.size === 0 ? "default" : "outline"}
          onClick={() => {
            setYearFilter(null);
            setExcludedYears(new Set());
            setCurrentIndex(0);
          }}
          className="text-xs"
        >
          All
        </Button>
        {years.map((y) => {
          const isSelected = yearFilter === y;
          const isExcluded = yearFilter === null && excludedYears.has(y);
          return (
            <Button
              key={y}
              size="xs"
              variant={isSelected ? "default" : isExcluded ? "secondary" : "outline"}
              onClick={() => {
                if (yearFilter !== null) {
                  // In single-year mode, clicking selects that year
                  setYearFilter(y === yearFilter ? null : y);
                } else {
                  // In "All" mode, clicking toggles year exclusion
                  setExcludedYears((prev) => {
                    const next = new Set(prev);
                    if (next.has(y)) next.delete(y);
                    else next.add(y);
                    return next;
                  });
                }
                setCurrentIndex(0);
              }}
              onDoubleClick={() => {
                // Double-click always selects single year
                setYearFilter(y);
                setExcludedYears(new Set());
                setCurrentIndex(0);
              }}
              className={`text-xs ${isExcluded ? "line-through opacity-50" : ""}`}
            >
              {y}
            </Button>
          );
        })}
        {excludedYears.size > 0 && (
          <span className="text-xs text-muted-foreground">
            ({excludedYears.size} excluded)
          </span>
        )}
      </div>

      {/* Sort & Difficulty filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <ArrowUpDown className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-0.5">Sort:</span>
        {([
          ["default", "Default"],
          ["newest", "Newest First"],
          ["difficulty", "Easy → Hard"],
          ["difficulty-desc", "Hard → Easy"],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            size="xs"
            variant={sortBy === value ? "default" : "outline"}
            onClick={() => {
              setSortBy(value);
              setCurrentIndex(0);
            }}
            className="text-xs"
          >
            {label}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground ml-2 mr-0.5">Difficulty:</span>
        {([
          ["all", "All"],
          ["easy", "Easy"],
          ["medium", "Medium"],
          ["hard", "Hard"],
        ] as const).map(([value, label]) => (
          <Button
            key={value}
            size="xs"
            variant={difficultyFilter === value ? "default" : "outline"}
            onClick={() => {
              setDifficultyFilter(value);
              setCurrentIndex(0);
            }}
            className={cn(
              "text-xs",
              difficultyFilter === value && value === "easy" && "bg-green-600 hover:bg-green-700 border-green-600",
              difficultyFilter === value && value === "medium" && "bg-amber-600 hover:bg-amber-700 border-amber-600",
              difficultyFilter === value && value === "hard" && "bg-red-600 hover:bg-red-700 border-red-600",
            )}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleShuffle}>
          <Shuffle className="size-4" />
          {shuffled ? "Re-shuffle" : "Shuffle"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAllAnswers(!showAllAnswers)}
        >
          {showAllAnswers ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {showAllAnswers ? "Hide Answers" : "Show Answer"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        {nullAnswerCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setHideNullAnswers(!hideNullAnswers);
              setCurrentIndex(0);
            }}
          >
            <AlertTriangle className="size-4" />
            {hideNullAnswers ? "Show All" : "Hide Ungraded"}
          </Button>
        )}
        {hideNullAnswers && nullAnswerCount > 0 && (
          <span className="text-xs text-amber-600">
            ({nullAnswerCount} ungraded hidden)
          </span>
        )}
        <Button
          size="sm"
          variant={bookmarkFilter ? "default" : "outline"}
          onClick={() => {
            setBookmarkFilter(!bookmarkFilter);
            setCurrentIndex(0);
          }}
        >
          <Bookmark className={`size-4 ${bookmarkFilter ? "fill-current" : ""}`} />
          Bookmarked ({bookmarkedCount})
        </Button>
        {incorrectCount > 0 && (
          <Button
            size="sm"
            variant={reviewMode ? "destructive" : "outline"}
            onClick={handleToggleReviewMode}
          >
            <RotateCcw className="size-4" />
            {reviewMode ? "Exit Review" : `Review Mistakes (${incorrectCount})`}
          </Button>
        )}
      </div>

      {/* Review mode banner */}
      {reviewMode && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2">
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            Reviewing {total} incorrect answer{total !== 1 ? "s" : ""}
          </span>
          <Button
            size="xs"
            variant="outline"
            onClick={handleToggleReviewMode}
            className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            Exit Review
          </Button>
        </div>
      )}

      {/* Question */}
      <div {...swipeHandlers}>
        <QuestionCard
          key={`${filteredIndex}-${current.year}-${current.number}`}
          question={current}
          index={currentIndex}
          total={total}
          showAnswer={showAllAnswers || !!answeredMap[filteredIndex]}
          onAnswer={handleAnswer}
          externalSelection={keyboardSelection}
          bookmarkKey={getKeyForQuestion(current)}
          isBookmarked={bookmarkedKeys.has(getKeyForQuestion(current))}
          onToggleBookmark={() => handleToggleBookmark(current)}
          onRetry={reviewMode ? handleRetry : undefined}
          showChat={showChat}
          onOpenChat={() => setShowChat(true)}
        />
      </div>

      {/* AI Chat - rendered outside QuestionCard so it persists across question changes */}
      {showChat && (
        <AIChat
          question={current}
          selectedAnswer={answeredMap[filteredIndex]?.selected}
          onClose={() => setShowChat(false)}
        />
      )}

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
          {total > 20 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Question {currentIndex + 1} of {total}
              </span>
              <button
                onClick={() => setShowGrid((v) => !v)}
                className="inline-flex items-center justify-center size-9 min-w-[44px] min-h-[44px] rounded-md text-muted-foreground hover:bg-muted/80 transition-colors"
                aria-label={showGrid ? "Hide question grid" : "Show question grid"}
              >
                <Grid3X3 className="size-4" />
              </button>
            </div>
          )}
          {(total <= 20 || showGrid) && (
            <div
              ref={gridRef}
              className="flex flex-wrap justify-center gap-1 overflow-x-hidden overflow-y-auto max-h-40 sm:max-h-48 w-full"
            >
              {displayQuestions.map((_, i) => (
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
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => goTo(total - 1)}
            disabled={currentIndex === total - 1}
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-muted-foreground">
        <span className="hidden sm:inline">
          Use <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">←</kbd>{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">→</kbd> arrow
          keys to navigate &middot; Press{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">A</kbd>{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">B</kbd>{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">C</kbd>{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">D</kbd> to
          select answer
        </span>
        <span className="sm:hidden">Swipe left/right to navigate</span>
      </p>

      <KeyboardNav
        onPrev={prev}
        onNext={next}
        onSelectAnswer={handleKeyboardSelect}
        isAnswered={showAllAnswers || !!answeredMap[filteredIndex]}
      />
    </div>
  );
}

function KeyboardNav({
  onPrev,
  onNext,
  onSelectAnswer,
  isAnswered,
}: {
  onPrev: () => void;
  onNext: () => void;
  onSelectAnswer: (option: string) => void;
  isAnswered: boolean;
}) {
  useEffect(() => {
    const keyToOption: Record<string, string> = {
      a: "A",
      b: "B",
      c: "C",
      d: "D",
      "1": "A",
      "2": "B",
      "3": "C",
      "4": "D",
    };

    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();

      const option = keyToOption[e.key.toLowerCase()];
      if (option && !isAnswered) {
        onSelectAnswer(option);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext, onSelectAnswer, isAnswered]);
  return null;
}
