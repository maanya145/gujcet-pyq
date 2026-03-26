"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";

interface TimerProps {
  initialSeconds?: number;
  onTick?: (seconds: number) => void;
}

export function Timer({ initialSeconds = 0, onTick }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const [preset, setPreset] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isCountdown = preset !== null;
  const displaySeconds = isCountdown ? Math.max(0, preset! - seconds) : seconds;
  const timeUp = isCountdown && seconds >= preset!;

  const hours = Math.floor(displaySeconds / 3600);
  const mins = Math.floor((displaySeconds % 3600) / 60);
  const secs = displaySeconds % 60;

  const start = useCallback(() => {
    if (timeUp) return;
    setRunning(true);
  }, [timeUp]);

  const pause = useCallback(() => {
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(0);
  }, []);

  const setCountdown = useCallback((minutes: number) => {
    setPreset(minutes * 60);
    setSeconds(0);
    setRunning(false);
  }, []);

  const clearPreset = useCallback(() => {
    setPreset(null);
    setSeconds(0);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (timeUp) {
      setRunning(false);
    }
  }, [timeUp]);

  useEffect(() => {
    onTick?.(seconds);
  }, [seconds, onTick]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`font-mono text-3xl font-bold tabular-nums tracking-wider ${
          timeUp ? "text-red-500 animate-pulse" : "text-foreground"
        }`}
      >
        {hours > 0 && `${hours.toString().padStart(2, "0")}:`}
        {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
        {timeUp && <span className="ml-2 text-sm">Time&apos;s up!</span>}
      </div>

      <div className="flex items-center gap-2">
        {!running ? (
          <Button onClick={start} size="sm" variant="default" disabled={timeUp}>
            <Play className="size-4" />
            Start
          </Button>
        ) : (
          <Button onClick={pause} size="sm" variant="secondary">
            <Pause className="size-4" />
            Pause
          </Button>
        )}
        <Button onClick={reset} size="sm" variant="outline">
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <TimerIcon className="size-3.5 text-muted-foreground" />
        {[15, 30, 45, 60, 90, 120, 180].map((m) => (
          <Button
            key={m}
            onClick={() => setCountdown(m)}
            size="xs"
            variant={preset === m * 60 ? "default" : "outline"}
            className="text-xs"
          >
            {m}m
          </Button>
        ))}
        {isCountdown && (
          <Button onClick={clearPreset} size="xs" variant="ghost" className="text-xs">
            Stopwatch
          </Button>
        )}
      </div>
    </div>
  );
}
