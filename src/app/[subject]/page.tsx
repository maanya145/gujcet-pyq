import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChapterHistoryBadge } from "@/components/chapter-history-badge";
import type { SubjectIndex, Subject } from "@/lib/types";
import { ArrowLeft, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import fs from "fs";
import path from "path";

const validSubjects: Subject[] = ["physics", "chemistry", "maths"];

const subjectConfig: Record<Subject, { color: string; borderColor: string; bgColor: string }> = {
  physics: {
    color: "text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  chemistry: {
    color: "text-green-600 dark:text-green-400",
    borderColor: "border-l-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  maths: {
    color: "text-purple-600 dark:text-purple-400",
    borderColor: "border-l-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
};

function loadIndex(subject: Subject): SubjectIndex {
  const filePath = path.join(process.cwd(), "public", "data", subject, "_index.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function generateStaticParams() {
  return validSubjects.map((subject) => ({ subject }));
}

export default function SubjectPage({
  params,
}: {
  params: { subject: string };
}) {
  const subject = params.subject as Subject;
  if (!validSubjects.includes(subject)) return notFound();

  const data = loadIndex(subject);
  const config = subjectConfig[subject];

  return (
    <main className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft data-icon="inline-start" />
              Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold capitalize">{subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.total_chapters} chapters &middot; {data.total_questions} questions
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
        {/* Practice all card */}
        <Link href={`/${subject}/practice`}>
          <Card className={cn("transition-shadow hover:shadow-md cursor-pointer border-l-4", config.borderColor)}>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex size-8 items-center justify-center rounded-md", config.bgColor)}>
                  <BookOpen className={cn("size-4", config.color)} />
                </div>
                <div>
                  <p className="font-semibold">Practice All Chapters</p>
                  <p className="text-sm text-muted-foreground">
                    {data.total_questions} questions from {data.total_chapters} chapters
                  </p>
                </div>
              </div>
              <Badge variant="default" className="font-mono text-sm px-3 py-1 shrink-0">
                {data.total_questions}
              </Badge>
            </CardContent>
          </Card>
        </Link>

        <Separator />

        {/* Chapters in natural curriculum order */}
        <div className="grid gap-2">
          {data.chapters.map((ch) => {
            const chapterSlug = ch.file.replace(".json", "");
            return (
              <Link key={ch.file} href={`/${subject}/${chapterSlug}`}>
                <Card className="transition-shadow hover:shadow-sm cursor-pointer">
                  <CardContent className="flex items-center justify-between py-3.5">
                    <div className="min-w-0 pr-3">
                      <p className="font-medium truncate">{ch.chapter}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {ch.total_questions} questions &middot; {ch.years[0]}&ndash;{ch.years[ch.years.length - 1]}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ChapterHistoryBadge subject={subject} chapterSlug={chapterSlug} />
                      <Badge variant="secondary" className="font-mono text-xs">
                        {ch.total_questions}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
