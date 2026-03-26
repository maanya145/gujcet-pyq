export interface Question {
  year: number;
  number: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string | null;
  chapter?: string; // Added for cross-chapter mode
}

export interface ChapterData {
  subject: string;
  chapter: string;
  total_questions: number;
  questions: Question[];
}

export interface ChapterMeta {
  chapter: string;
  file: string;
  total_questions: number;
  years: number[];
}

export interface SubjectIndex {
  subject: string;
  total_chapters: number;
  total_questions: number;
  chapters: ChapterMeta[];
}

export type Subject = "physics" | "chemistry" | "maths";

export interface MockQuestion extends Question {
  subject: Subject;
  chapter: string;
}
