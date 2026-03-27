import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  serial,
  index,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").notNull().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: serial("id").notNull().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bookmarkKey: text("bookmark_key").notNull(), // "subject:chapter:year:number"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueUserKey: unique("bookmarks_user_key_unique").on(
      t.userId,
      t.bookmarkKey
    ),
    userIdIdx: index("bookmarks_user_id_idx").on(t.userId),
  })
);

export const sessionResults = pgTable(
  "session_results",
  {
    id: serial("id").notNull().primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    chapter: text("chapter").notNull(), // chapter slug
    date: timestamp("date").notNull(),
    correct: integer("correct").notNull(),
    incorrect: integer("incorrect").notNull(),
    ungraded: integer("ungraded").notNull(),
    total: integer("total").notNull(),
    accuracy: real("accuracy").notNull(), // 0–100
    timeSpent: integer("time_spent").notNull(), // seconds
  },
  (t) => ({
    userSubjectChapterIdx: index("results_user_subject_chapter_idx").on(
      t.userId,
      t.subject,
      t.chapter
    ),
  })
);
