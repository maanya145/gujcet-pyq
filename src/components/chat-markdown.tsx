"use client";

import ReactMarkdown from "react-markdown";
import { Latex } from "@/components/latex";

// Split text into LaTeX and non-LaTeX segments, render markdown for non-LaTeX parts
function splitLatex(text: string): { type: "text" | "latex"; content: string }[] {
  const parts: { type: "text" | "latex"; content: string }[] = [];
  // Match $$...$$, $...$, \[...\], \(...\)
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "latex", content: match[0] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts;
}

export function ChatMarkdown({ content }: { content: string }) {
  // Check if content has any LaTeX
  const hasLatex = /\$[\s\S]*?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)/.test(content);

  if (!hasLatex) {
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
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  // Has LaTeX — split into segments, render markdown for text parts and LaTeX for math parts
  const segments = splitLatex(content);
  return (
    <div>
      {segments.map((seg, i) =>
        seg.type === "latex" ? (
          <Latex key={i} text={seg.content} />
        ) : (
          <ReactMarkdown
            key={i}
            components={{
              p: ({ children }) => <span className="mb-1 last:mb-0">{children}</span>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              code: ({ children }) => (
                <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{children}</code>
              ),
            }}
          >
            {seg.content}
          </ReactMarkdown>
        )
      )}
    </div>
  );
}
