import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { SubjectIndex, Subject } from "@/lib/types";
import {
  Atom,
  FlaskConical,
  Calculator,
  ClipboardList,
  ArrowRight,
  Bookmark,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import fs from "fs";
import path from "path";

const subjectConfig: Record<
  Subject,
  { label: string; icon: typeof Atom; color: string; borderColor: string; bgColor: string }
> = {
  physics: {
    label: "Physics",
    icon: Atom,
    color: "text-blue-600 dark:text-blue-400",
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
  },
  chemistry: {
    label: "Chemistry",
    icon: FlaskConical,
    color: "text-green-600 dark:text-green-400",
    borderColor: "border-l-green-500",
    bgColor: "bg-green-50 dark:bg-green-950/30",
  },
  maths: {
    label: "Maths",
    icon: Calculator,
    color: "text-purple-600 dark:text-purple-400",
    borderColor: "border-l-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
  },
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
  const allYears = indexes.flatMap((i) => i.data.chapters.flatMap((ch) => ch.years));
  const minYear = Math.min(...allYears);
  const maxYear = Math.max(...allYears);

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <div className="border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            GUJCET Past Year Questions
          </h1>
          <p className="mt-3 text-muted-foreground">
            {totalQuestions.toLocaleString()} questions &middot; {totalChapters} chapters &middot; {minYear}&ndash;{maxYear}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Physics, Chemistry &amp; Maths — all in one place
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Subject cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {indexes.map(({ subject, data }) => {
            const config = subjectConfig[subject];
            const Icon = config.icon;
            const allYears = data.chapters.flatMap((ch) => ch.years);
            const minYear = Math.min(...allYears);
            const maxYear = Math.max(...allYears);

            return (
              <Card
                key={subject}
                className={cn("flex flex-col border-l-4", config.borderColor)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex size-8 items-center justify-center rounded-md", config.bgColor)}>
                      <Icon className={cn("size-4", config.color)} />
                    </div>
                    <CardTitle className="text-base">{config.label}</CardTitle>
                  </div>
                  <CardDescription>
                    {data.total_chapters} chapters &middot; {data.total_questions} questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Years {minYear}&ndash;{maxYear}
                  </p>
                </CardContent>
                <CardFooter className="gap-2 pt-0">
                  <Link href={`/${subject}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <BookOpen data-icon="inline-start" />
                      Chapters
                    </Button>
                  </Link>
                  <Link href={`/${subject}/practice`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Practice All
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <Separator />

        {/* Mock Test CTA */}
        <Link href="/mock-test">
          <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 transition-shadow hover:shadow-lg cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10">
                  <ClipboardList className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">Take a Mock Test</h3>
                  <p className="text-sm text-muted-foreground">
                    Simulate the real exam — 120 questions, 3 hours
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 text-muted-foreground hidden sm:block" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">40 Physics</Badge>
              <Badge variant="secondary" className="text-xs">40 Chemistry</Badge>
              <Badge variant="secondary" className="text-xs">40 Maths</Badge>
              <span className="text-xs text-muted-foreground">&middot; 180 min</span>
            </div>
          </div>
        </Link>

        {/* Secondary links */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/bookmarks">
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4 px-5">
                <Bookmark className="size-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Bookmarked Questions</p>
                  <p className="text-xs text-muted-foreground">Review your saved questions</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/analytics">
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4 px-5">
                <BarChart3 className="size-5 text-blue-500 shrink-0" />
                <div>
                  <p className="font-medium text-sm">Performance Analytics</p>
                  <p className="text-xs text-muted-foreground">Track your progress over time</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </main>
  );
}
