"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Latex } from "@/components/latex";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bookmark, RotateCcw, Lightbulb, ChevronDown, ChevronUp, Sparkles, Copy, CheckCheck } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  showAnswer: boolean;
  onAnswer: (selected: string, isCorrect: boolean | null) => void;
  externalSelection?: string | null;
  savedSelection?: string | null;
  bookmarkKey?: string;
  onToggleBookmark?: () => void;
  isBookmarked?: boolean;
  onRetry?: () => void;
  showChat?: boolean;
  onOpenChat?: () => void;
}

export function QuestionCard({
  question,
  index,
  total,
  showAnswer,
  onAnswer,
  externalSelection,
  savedSelection,
  bookmarkKey,
  onToggleBookmark,
  isBookmarked: bookmarked,
  onRetry,
  showChat,
  onOpenChat,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(savedSelection ?? null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  const optionKeys = ["A", "B", "C", "D"] as const;

  useEffect(() => {
    if (externalSelection && !showAnswer) {
      handleSelect(externalSelection);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSelection]);

  const handleSelect = (key: string) => {
    if (showAnswer) return;
    setSelected(key);
    const isCorrect = question.answer === null ? null : key === question.answer;
    onAnswer(key, isCorrect);
  };

  const getOptionStyle = (key: string) => {
    if (!showAnswer) {
      return "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer";
    }
    if (question.answer === null) {
      if (key === selected) {
        return "border-amber-500 bg-amber-100 dark:bg-amber-950/30";
      }
      return "border-border opacity-60";
    }
    if (key === question.answer) {
      return "border-green-600 dark:border-green-500 bg-green-100 dark:bg-green-950/30";
    }
    if (key === selected && key !== question.answer) {
      return "border-red-600 dark:border-red-500 bg-red-100 dark:bg-red-950/30";
    }
    return "border-border opacity-60";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-mono text-xs">
              {index + 1}/{total}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {question.year}
            </Badge>
            {question.difficulty && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs capitalize",
                  question.difficulty === "easy" && "text-green-600 border-green-300 dark:text-green-400 dark:border-green-700",
                  question.difficulty === "medium" && "text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-700",
                  question.difficulty === "hard" && "text-red-600 border-red-300 dark:text-red-400 dark:border-red-700"
                )}
              >
                {question.difficulty}
              </Badge>
            )}
            {question.chapter && (
              <Badge variant="secondary" className="text-xs capitalize">
                {question.chapter.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {question.answer === null && (
              <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400 mr-1">
                No answer key
              </Badge>
            )}
            <button
              onClick={() => {
                const text = `Q: ${question.question}\nA: ${question.options.A}\nB: ${question.options.B}\nC: ${question.options.C}\nD: ${question.options.D}${question.answer ? `\nAnswer: ${question.answer}` : ""}`;
                navigator.clipboard?.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }).catch(() => {/* clipboard unavailable */});
              }}
              className="inline-flex items-center justify-center size-9 min-w-[44px] min-h-[44px] rounded-md hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Copy question"
            >
              {copied ? (
                <CheckCheck className="size-4 text-green-500" />
              ) : (
                <Copy className="size-4 text-muted-foreground" />
              )}
            </button>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(question.question)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center size-9 min-w-[44px] min-h-[44px] rounded-md hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Search on Google"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </a>
            {bookmarkKey && onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark();
                }}
                className="inline-flex items-center justify-center size-9 min-w-[44px] min-h-[44px] rounded-md hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark
                  className={cn(
                    "size-4",
                    bookmarked
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-base leading-relaxed">
          <Latex text={question.question} />
        </div>

        <div role="radiogroup" aria-label="Answer options" className="grid gap-2">
          {optionKeys.map((key) => (
            <button
              key={key}
              role="radio"
              aria-checked={selected === key}
              aria-disabled={showAnswer || undefined}
              onClick={() => handleSelect(key)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                getOptionStyle(key)
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  showAnswer && question.answer === null && key === selected
                    ? "border-amber-500 bg-amber-500 text-white"
                    : showAnswer && key === question.answer
                    ? "border-green-600 bg-green-600 dark:border-green-500 dark:bg-green-500 text-white"
                    : showAnswer && key === selected
                    ? "border-red-600 bg-red-600 dark:border-red-500 dark:bg-red-500 text-white"
                    : "border-muted-foreground/30"
                )}
              >
                {key}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed">
                <Latex text={question.options[key]} />
              </span>
            </button>
          ))}
        </div>

        {showAnswer && question.answer === null && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Answer key not available for this question
          </p>
        )}

        {showAnswer && onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <RotateCcw className="size-3.5" />
            Try Again
          </Button>
        )}

        {showAnswer && question.explanation && (
          <div>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              aria-expanded={showExplanation}
            >
              <Lightbulb className="size-3.5" />
              {showExplanation ? "Hide Explanation" : "Show Explanation"}
              {showExplanation ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
            {showExplanation && (
              <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed">
                <Latex text={question.explanation} />
              </div>
            )}
          </div>
        )}

        {showAnswer && !showChat && onOpenChat && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenChat}
            className="border-primary/30 text-primary hover:bg-primary/5"
          >
            <Sparkles className="size-3.5" />
            Ask AI Tutor
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
