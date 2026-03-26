"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
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
  const [answeredMap, setAnsweredMap] = useState<Record<number, boolean>>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [questions, setQuestions] = useState(originalQuestions);
  const [yearFilter, setYearFilter] = useState<number | null>(null);

  const years = useMemo(() => {
    const y = Array.from(new Set(originalQuestions.map((q) => q.year))).sort();
    return y;
  }, [originalQuestions]);

  const filteredQuestions = useMemo(() => {
    if (yearFilter === null) return questions;
    return questions.filter((q) => q.year === yearFilter);
  }, [questions, yearFilter]);

  const total = filteredQuestions.length;
  const current = filteredQuestions[currentIndex] || filteredQuestions[0];
  const answered = Object.keys(answeredMap).length;

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

  const toggleAnswer = useCallback(() => {
    setAnsweredMap((prev) => ({ ...prev, [currentIndex]: true }));
  }, [currentIndex]);

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
          {showAllAnswers ? "Hide Answers" : "Show All"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <div className="ml-auto flex items-center gap-1.5">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {answered}/{total} attempted
          </span>
        </div>
      </div>

      {/* Question */}
      <QuestionCard
        key={`${currentIndex}-${current.year}-${current.number}`}
        question={current}
        index={currentIndex}
        total={total}
        showAnswer={showAllAnswers || !!answeredMap[currentIndex]}
        onToggleAnswer={toggleAnswer}
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

        <div className="flex items-center gap-1 overflow-x-auto px-2">
          {total <= 20 ? (
            filteredQuestions.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`size-8 shrink-0 rounded-md text-xs font-medium transition-colors ${
                  i === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : answeredMap[i]
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {i + 1}
              </button>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {total}
            </span>
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
        keys to navigate
      </p>

      <KeyboardNav onPrev={prev} onNext={next} />
    </div>
  );
}

function KeyboardNav({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onPrev, onNext]);
  return null;
}
