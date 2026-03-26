"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChatMarkdown } from "@/components/chat-markdown";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import type { Question } from "@/lib/types";

interface AIChatProps {
  question: Question;
  selectedAnswer?: string | null;
  onClose: () => void;
}

function buildInitialContext(question: Question, selectedAnswer?: string | null): string {
  const parts = [
    `Question (${question.year}): ${question.question}`,
    `Options:`,
    `A: ${question.options.A}`,
    `B: ${question.options.B}`,
    `C: ${question.options.C}`,
    `D: ${question.options.D}`,
  ];
  if (question.answer) {
    parts.push(`Correct answer: ${question.answer}`);
  }
  if (selectedAnswer && selectedAnswer !== question.answer) {
    parts.push(`Student selected: ${selectedAnswer} (incorrect)`);
  }
  if (question.explanation) {
    parts.push(`Reference explanation: ${question.explanation}`);
  }
  return parts.join("\n");
}

export function AIChat({ question, selectedAnswer, onClose }: AIChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  const greeting = question.answer && selectedAnswer && selectedAnswer !== question.answer
    ? `I can see you selected **${selectedAnswer}** but the correct answer is **${question.answer}**. What would you like me to explain?`
    : question.answer
    ? `The correct answer is **${question.answer}**. What would you like me to explain about this question?`
    : `I see this question doesn't have an answer key. I'll do my best to help! What would you like to know?`;

  const { messages, sendMessage, status } = useChat({
    messages: [
      {
        id: "context",
        role: "user" as const,
        content: `Help me understand this GUJCET question:\n\n${buildInitialContext(question, selectedAnswer)}`,
        parts: [{ type: "text" as const, text: `Help me understand this GUJCET question:\n\n${buildInitialContext(question, selectedAnswer)}` }],
      },
      {
        id: "greeting",
        role: "assistant" as const,
        content: greeting,
        parts: [{ type: "text" as const, text: greeting }],
      },
    ],
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    sendMessage({ text });
  };

  return (
    <Card className="w-full border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-semibold">AI Tutor</span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <div
          ref={scrollRef}
          className="max-h-72 overflow-y-auto px-4 py-2 space-y-3"
        >
          {messages.slice(1).map((msg) => (
            <div
              key={msg.id}
              className={`text-sm ${
                msg.role === "user"
                  ? "ml-8 rounded-lg bg-primary/10 p-2.5"
                  : "mr-4 text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="leading-relaxed">
                  {msg.parts.map((part, i) => {
                    if (part.type === "text") {
                      return <ChatMarkdown key={`${msg.id}-${i}`} id={msg.id} content={part.text} />;
                    }
                    return null;
                  })}
                </div>
              ) : (
                <p>
                  {msg.parts.map((part, i) => {
                    if (part.type === "text") {
                      return <span key={`${msg.id}-${i}`}>{part.text}</span>;
                    }
                    return null;
                  })}
                </p>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t px-4 py-3">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about this question..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={isLoading || !inputValue.trim()}
            onClick={handleSend}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
