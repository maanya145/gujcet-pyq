"use client";

import katex from "katex";
import { useMemo } from "react";

function renderLatex(text: string): string {
  if (!text) return "";

  // Handle display math: $$...$$
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `$$${math}$$`;
    }
  });

  // Handle inline math: $...$  (but not $$)
  result = result.replace(/\$([^$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `$${math}$`;
    }
  });

  // Handle \( ... \) inline math
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `\\(${math}\\)`;
    }
  });

  // Handle \[ ... \] display math
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
      });
    } catch {
      return `\\[${math}\\]`;
    }
  });

  return result;
}

export function Latex({ text }: { text: string }) {
  const html = useMemo(() => renderLatex(text), [text]);
  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
      className="latex-content"
    />
  );
}
