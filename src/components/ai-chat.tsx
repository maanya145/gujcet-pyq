"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChatMarkdown } from "@/components/chat-markdown";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import type { Question } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  question: Question;
  selectedAnswer?: string | null;
  onClose: () => void;
}

function buildContext(question: Question, selectedAnswer?: string | null): string {
  const parts = [
    `Question (${question.year}): ${question.question}`,
    `Options:`,
    `A: ${question.options.A}`,
    `B: ${question.options.B}`,
    `C: ${question.options.C}`,
    `D: ${question.options.D}`,
  ];
  if (question.answer) parts.push(`Correct answer: ${question.answer}`);
  if (selectedAnswer && selectedAnswer !== question.answer) {
    parts.push(`Student selected: ${selectedAnswer} (incorrect)`);
  }
  if (question.explanation) parts.push(`Reference explanation: ${question.explanation}`);
  return parts.join("\n");
}

let msgCounter = 0;

export function AIChat({ question, selectedAnswer, onClose }: AIChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const greeting = question.answer && selectedAnswer && selectedAnswer !== question.answer
      ? `You selected **${selectedAnswer}** but the correct answer is **${question.answer}**. What would you like me to explain?`
      : question.answer
      ? `The correct answer is **${question.answer}**. What would you like me to explain about this question?`
      : `This question doesn't have an answer key. I'll do my best to help! What would you like to know?`;

    return [
      { id: "ctx", role: "user", content: `Help me understand this question:\n\n${buildContext(question, selectedAnswer)}` },
      { id: "greet", role: "assistant", content: greeting },
    ];
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { id: `u${++msgCounter}`, role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            parts: [{ type: "text", text: m.content }],
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get response");
      }

      const data = await res.json();
      const assistantMsg: Message = { id: `a${++msgCounter}`, role: "assistant", content: data.text };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [...prev, { id: `e${++msgCounter}`, role: "assistant", content: `*Error: ${errMsg}*` }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue("");
    sendMessage(text);
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
        <div ref={scrollRef} className="max-h-72 overflow-y-auto px-4 py-2 space-y-3">
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
                  <ChatMarkdown id={msg.id} content={msg.content} />
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Thinking...
            </div>
          )}
        </div>

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
