import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SubjectIndex, Subject } from "@/lib/types";
import { Atom, FlaskConical, Calculator } from "lucide-react";
import fs from "fs";
import path from "path";

const subjectConfig: Record<Subject, { label: string; icon: typeof Atom; color: string }> = {
  physics: { label: "Physics", icon: Atom, color: "text-blue-600" },
  chemistry: { label: "Chemistry", icon: FlaskConical, color: "text-green-600" },
  maths: { label: "Maths", icon: Calculator, color: "text-purple-600" },
};

function loadIndex(subject: Subject): SubjectIndex {
  const filePath = path.join(process.cwd(), "public", "data", subject, "_index.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export default function Home() {
  const subjects: Subject[] = ["physics", "chemistry", "maths"];
  const indexes = subjects.map((s) => ({ subject: s, data: loadIndex(s) }));

  const totalQuestions = indexes.reduce((sum, i) => sum + i.data.total_questions, 0);
  const totalChapters = indexes.reduce((sum, i) => sum + i.data.total_chapters, 0);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:py-16">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            GUJCET PYQ Practice
          </h1>
          <p className="mt-3 text-muted-foreground">
            {totalQuestions.toLocaleString()} questions across {totalChapters} chapters &middot;
            2006&ndash;2025
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Badge variant="secondary">Physics</Badge>
            <Badge variant="secondary">Chemistry</Badge>
            <Badge variant="secondary">Maths</Badge>
          </div>
        </div>
      </div>

      {/* Subjects grid */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {indexes.map(({ subject, data }) => {
            const config = subjectConfig[subject];
            const Icon = config.icon;
            return (
              <Link key={subject} href={`/${subject}`}>
                <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-5 ${config.color}`} />
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{data.total_chapters} chapters</p>
                      <p>{data.total_questions} questions</p>
                      <p className="text-xs">
                        Years: {data.chapters[0]?.years[0]}&ndash;
                        {data.chapters[0]?.years[data.chapters[0].years.length - 1]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Select a subject to start practicing. Choose chapters, filter by year, and time yourself.</p>
        </div>
      </div>
    </main>
  );
}
