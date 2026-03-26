"use client";

import { marked } from "marked";
import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { Latex } from "@/components/latex";

// Check if a block contains LaTeX math
const LATEX_RE = /\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/;

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
}

const MarkdownBlock = memo(
  ({ content }: { content: string }) => {
    const hasLatex = LATEX_RE.test(content);

    // If block has LaTeX, render via the Latex component (handles both math and plain text)
    if (hasLatex) {
      return (
        <div className="mb-2 last:mb-0">
          <Latex text={content} />
        </div>
      );
    }

    // Pure markdown block — render with react-markdown
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{children}</code>
          ),
          h1: ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
          hr: () => <hr className="my-2 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prev, next) => prev.content === next.content
);

MarkdownBlock.displayName = "MarkdownBlock";

export const ChatMarkdown = memo(
  ({ content, id }: { content: string; id?: string }) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

    return (
      <>
        {blocks.map((block, index) => (
          <MarkdownBlock content={block} key={`${id ?? "cm"}-${index}`} />
        ))}
      </>
    );
  }
);

ChatMarkdown.displayName = "ChatMarkdown";
