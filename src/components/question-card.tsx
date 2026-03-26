"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Latex } from "@/components/latex";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Bookmark, RotateCcw } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  showAnswer: boolean;
  onAnswer: (selected: string, isCorrect: boolean | null) => void;
  externalSelection?: string | null;
  bookmarkKey?: string;
  onToggleBookmark?: () => void;
  isBookmarked?: boolean;
  onRetry?: () => void;
}

export function QuestionCard({
  question,
  index,
  total,
  showAnswer,
  onAnswer,
  externalSelection,
  bookmarkKey,
  onToggleBookmark,
  isBookmarked: bookmarked,
  onRetry,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<string | null>(null);
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
            {question.chapter && (
              <Badge variant="secondary" className="text-xs capitalize">
                {question.chapter.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {question.answer === null && (
              <Badge variant="outline" className="text-xs text-amber-600">
                No answer key
              </Badge>
            )}
            {bookmarkKey && onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark();
                }}
                className="p-1 rounded-md hover:bg-muted/80 transition-colors"
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

        <div className="grid gap-2">
          {optionKeys.map((key) => (
            <button
              key={key}
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
          <p className="text-xs text-amber-600">
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
      </CardContent>
    </Card>
  );
}
