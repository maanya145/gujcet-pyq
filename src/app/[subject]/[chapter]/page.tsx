import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PracticeSession } from "@/components/practice-session";
import type { ChapterData, Subject, SubjectIndex } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
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

export default function ChapterPage({
  params,
}: {
  params: { subject: string; chapter: string };
}) {
  const subject = params.subject as Subject;
  if (!validSubjects.includes(subject)) return notFound();

  const data = loadChapter(subject, params.chapter);
  if (!data) return notFound();

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
          questions={data.questions}
          chapterName={data.chapter}
          chapterSlug={params.chapter}
          subjectName={data.subject}
          subject={subject}
        />
      </div>
    </main>
  );
}
