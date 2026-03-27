import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/practice-session";
import type { ChapterData, Subject, SubjectIndex } from "@/lib/types";
import fs from "fs";
import path from "path";

const validSubjects: Subject[] = ["physics", "chemistry", "maths"];

function loadChapter(subject: Subject, chapter: string): ChapterData | null {
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    subject,
    `${chapter}.json`
  );
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function loadIndex(subject: Subject): SubjectIndex {
  const filePath = path.join(process.cwd(), "public", "data", subject, "_index.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function generateStaticParams() {
  const params: { subject: string; chapter: string }[] = [];
  for (const subject of validSubjects) {
    const index = loadIndex(subject);
    for (const ch of index.chapters) {
      params.push({ subject, chapter: ch.file.replace(".json", "") });
    }
  }
  return params;
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ subject: string; chapter: string }>;
}) {
  const { subject: rawSubject, chapter } = await params;
  const subject = rawSubject as Subject;
  if (!validSubjects.includes(subject)) return notFound();

  const data = loadChapter(subject, chapter);
  if (!data) return notFound();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <PracticeSession
          questions={data.questions}
          chapterName={data.chapter}
          chapterSlug={chapter}
          subjectName={data.subject}
          subject={subject}
          backHref={`/${subject}`}
          backLabel={subject}
        />
      </div>
    </main>
  );
}
