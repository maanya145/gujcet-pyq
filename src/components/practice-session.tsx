"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/question-card";
import { Timer } from "@/components/timer";
import type { Question } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Shuffle,
  Eye,
  EyeOff,
  BarChart3,
  Check,
  X,
  Grid3X3,
  AlertTriangle,
} from "lucide-react";

interface PracticeSessionProps {
  questions: Question[];
  chapterName: string;
  subjectName: string;
}

export function PracticeSession({
  questions: originalQuestions,
  chapterName,
  subjectName,
}: PracticeSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredMap, setAnsweredMap] = useState<Record<number, { selected: string; correct: boolean | null }>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [questions, setQuestions] = useState(originalQuestions);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [hideNullAnswers, setHideNullAnswers] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [keyboardSelection, setKeyboardSelection] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  const years = useMemo(() => {
    const y = Array.from(new Set(originalQuestions.map((q) => q.year))).sort();
    return y;
  }, [originalQuestions]);

  const filteredQuestions = useMemo(() => {
    let result = questions;
    if (yearFilter !== null) result = result.filter((q) => q.year === yearFilter);
    if (hideNullAnswers) result = result.filter((q) => q.answer !== null);
    return result;
  }, [questions, yearFilter, hideNullAnswers]);

  const nullAnswerCount = useMemo(() => {
    let base = questions;
    if (yearFilter !== null) base = base.filter((q) => q.year === yearFilter);
    return base.filter((q) => q.answer === null).length;
  }, [questions, yearFilter]);

  const total = filteredQuestions.length;
  const current = filteredQuestions[currentIndex] || filteredQuestions[0];
  const answered = Object.keys(answeredMap).length;

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
    const shuffledQ = [...originalQuestions].sort(() => Math.random() - 0.5);
    setQuestions(shuffledQ);
    setShuffled(true);
    setCurrentIndex(0);
    setAnsweredMap({});
  }, [originalQuestions]);

  const handleReset = useCallback(() => {
    setQuestions(originalQuestions);
    setShuffled(false);
    setCurrentIndex(0);
    setAnsweredMap({});
    setShowAllAnswers(false);
  }, [originalQuestions]);

  const handleAnswer = useCallback((selected: string, isCorrect: boolean | null) => {
    setAnsweredMap((prev) => ({ ...prev, [currentIndex]: { selected, correct: isCorrect } }));
  }, [currentIndex]);

  const handleKeyboardSelect = useCallback((option: string) => {
    setKeyboardSelection(option);
  }, []);

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

  const getGridButtonStyle = (i: number) => {
    if (i === currentIndex) return "bg-primary text-primary-foreground";
    if (answeredMap[i]) {
      if (answeredMap[i].correct === true) return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      if (answeredMap[i].correct === false) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    }
    return "bg-muted text-muted-foreground hover:bg-muted/80";
  };

  if (!current) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No questions found for this filter.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold capitalize">{chapterName.replace(/_/g, " ")}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {subjectName} &middot; {total} questions
          </p>
        </div>
        <Timer />
      </div>

      {/* Year filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1">Year:</span>
        <Button
          size="xs"
          variant={yearFilter === null ? "default" : "outline"}
          onClick={() => {
            setYearFilter(null);
            setCurrentIndex(0);
          }}
          className="text-xs"
        >
          All
        </Button>
        {years.map((y) => (
          <Button
            key={y}
            size="xs"
            variant={yearFilter === y ? "default" : "outline"}
            onClick={() => {
              setYearFilter(y);
              setCurrentIndex(0);
            }}
            className="text-xs"
          >
            {y}
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
        <div className="ml-auto flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
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
          <span className="text-sm text-muted-foreground">
            {answered} total
          </span>
          {(correctCount + incorrectCount) > 0 && (
            <span className="text-sm font-medium text-muted-foreground">
              &middot; {accuracy}% accuracy
            </span>
          )}
        </div>
      </div>

      {/* Question */}
      <QuestionCard
        key={`${currentIndex}-${current.year}-${current.number}`}
        question={current}
        index={currentIndex}
        total={total}
        showAnswer={showAllAnswers || !!answeredMap[currentIndex]}
        onAnswer={handleAnswer}
        externalSelection={keyboardSelection}
      />

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
              {filteredQuestions.map((_, i) => (
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
        Use <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">←</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">→</kbd> arrow
        keys to navigate &middot; Press{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">A</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">B</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">C</kbd>{" "}
        <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono">D</kbd> to
        select answer
      </p>

      <KeyboardNav
        onPrev={prev}
        onNext={next}
        onSelectAnswer={handleKeyboardSelect}
        isAnswered={showAllAnswers || !!answeredMap[currentIndex]}
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
