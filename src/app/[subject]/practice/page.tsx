import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PracticeSession } from "@/components/practice-session";
import type { ChapterData, Question, Subject, SubjectIndex } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import fs from "fs";
import path from "path";

const validSubjects: Subject[] = ["physics", "chemistry", "maths"];

function loadIndex(subject: Subject): SubjectIndex {
  const filePath = path.join(process.cwd(), "public", "data", subject, "_index.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadChapter(subject: Subject, chapterFile: string): ChapterData | null {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    subject,
    chapterFile
  );
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadAllQuestions(subject: Subject): Question[] {
  const index = loadIndex(subject);
  const allQuestions: Question[] = [];

  for (const ch of index.chapters) {
    const data = loadChapter(subject, ch.file);
    if (!data) continue;
    for (const q of data.questions) {
      allQuestions.push({
        ...q,
        chapter: ch.chapter,
      });
    }
  }

  // Sort by year descending, then by question number ascending
  allQuestions.sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return a.number - b.number;
  });

  return allQuestions;
}

export function generateStaticParams() {
  return validSubjects.map((subject) => ({ subject }));
}

export default function SubjectPracticePage({
  params,
}: {
  params: { subject: string };
}) {
  const subject = params.subject as Subject;
  if (!validSubjects.includes(subject)) return notFound();

  const questions = loadAllQuestions(subject);

  return (
    <main className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href={`/${subject}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" />
              Back to {subject}
            </Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <PracticeSession
          questions={questions}
          chapterName="All Chapters"
          chapterSlug={`${subject}_all`}
          subjectName={subject}
          subject={subject}
        />
      </div>
    </main>
  );
}
