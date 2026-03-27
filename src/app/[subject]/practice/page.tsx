import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/practice-session";
import type { ChapterData, Question, Subject, SubjectIndex } from "@/lib/types";
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

export default async function SubjectPracticePage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: rawSubject } = await params;
  const subject = rawSubject as Subject;
  if (!validSubjects.includes(subject)) return notFound();

  const questions = loadAllQuestions(subject);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <PracticeSession
          questions={questions}
          chapterName="All Chapters"
          chapterSlug={`${subject}_all`}
          subjectName={subject}
          subject={subject}
          backHref={`/${subject}`}
          backLabel={subject}
        />
      </div>
    </main>
  );
}
