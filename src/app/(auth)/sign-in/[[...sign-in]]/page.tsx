import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted" aria-label="Sign in">
      <div className="flex flex-col items-center gap-6">
          <Link href="/" className="inline-flex items-center gap-1.5" aria-label="GUJCET PYQ — Go to home page">
            <span className="text-lg font-bold tracking-wide">GUJCET</span>
            <span
              className="mx-0.5 flex h-4 w-[3px] flex-col overflow-hidden rounded-full"
              aria-hidden="true"
            >
              <span className="flex-1 bg-blue-500" />
              <span className="flex-1 bg-green-500" />
              <span className="flex-1 bg-purple-500" />
            </span>
            <span className="text-sm font-medium text-muted-foreground">PYQ</span>
          </Link>

          <SignIn appearance={{ elements: { rootBox: "w-full" } }} />
        </div>
    </main>
  );
}
