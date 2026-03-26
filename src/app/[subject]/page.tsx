import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SubjectIndex, Subject } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import fs from "fs";
import path from "path";

const validSubjects: Subject[] = ["physics", "chemistry", "maths"];

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

  // Sort chapters by question count (most first)
  const sortedChapters = [...data.chapters].sort(
    (a, b) => b.total_questions - a.total_questions
  );

  return (
    <main className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="size-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold capitalize">{subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.total_chapters} chapters &middot; {data.total_questions} questions
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid gap-3">
          {sortedChapters.map((ch) => {
            const chapterSlug = ch.file.replace(".json", "");
            return (
              <Link key={ch.file} href={`/${subject}/${chapterSlug}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-medium">{ch.chapter}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {ch.total_questions} questions
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({ch.years[0]}&ndash;{ch.years[ch.years.length - 1]})
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {ch.total_questions}
                    </Badge>
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
