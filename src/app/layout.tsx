import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { NavHeader } from "@/components/nav-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider, PostHogPageView } from "@posthog/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "GUJCET PYQ Practice",
  description:
    "Practice past year questions for GUJCET exam — Physics, Chemistry & Maths",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className="bg-background">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `try{if(localStorage.getItem('gujcet:theme')!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}`,
            }}
          />
        </head>
        <body className={cn("min-h-screen bg-background antialiased pb-14 sm:pb-0", inter.className)}>
          {process.env.NEXT_PUBLIC_POSTHOG_KEY ? (
            <PostHogProvider>
              <Suspense fallback={null}>
                <PostHogPageView />
              </Suspense>
              <NavHeader />
              <TooltipProvider>
                <div id="main-content">
                  {children}
                </div>
              </TooltipProvider>
            </PostHogProvider>
          ) : (
            <>
              <NavHeader />
              <TooltipProvider>
                <div id="main-content">
                  {children}
                </div>
              </TooltipProvider>
            </>
          )}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
