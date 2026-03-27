import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { NavHeader } from "@/components/nav-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";

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
    <html lang="en" suppressHydrationWarning className="bg-background">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('gujcet:theme')!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}`,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background antialiased pb-14 sm:pb-0", inter.className)}>
        <NavHeader />
        <TooltipProvider>
          <div id="main-content">
            {children}
          </div>
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
