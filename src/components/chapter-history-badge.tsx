"use client";

import { useEffect, useState } from "react";
import { getLastResult } from "@/lib/storage";

interface ChapterHistoryBadgeProps {
  subject: string;
  chapterSlug: string;
}

export function ChapterHistoryBadge({ subject, chapterSlug }: ChapterHistoryBadgeProps) {
  const [accuracy, setAccuracy] = useState<number | null>(null);

  useEffect(() => {
    const result = getLastResult(subject, chapterSlug);
    if (result) {
      setAccuracy(result.accuracy);
    }
  }, [subject, chapterSlug]);

  if (accuracy === null) return null;

  const color =
    accuracy >= 70
      ? "text-green-600 dark:text-green-400"
      : accuracy >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <span className={`text-xs font-medium ${color}`}>
      Last: {accuracy}%
    </span>
  );
}
