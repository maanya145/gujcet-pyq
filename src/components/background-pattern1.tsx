import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BackgroundPattern1Props {
  className?: string;
  children?: ReactNode;
}

const BackgroundPattern1 = ({ className, children }: BackgroundPattern1Props) => {
  return (
    <section className={cn("relative w-full", className)}>
      {/* Top Primary Radial Background Pattern */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, hsl(var(--background)) 40%, hsl(var(--primary)) 100%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </section>
  );
};

export { BackgroundPattern1 };
