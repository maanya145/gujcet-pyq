import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5">
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
          <p className="mt-3 text-sm text-muted-foreground">
            Create an account to unlock the AI Tutor
          </p>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-none border border-border rounded-xl bg-card p-6 w-full",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton:
                "border border-border bg-background text-foreground hover:bg-muted transition-colors rounded-lg h-10 text-sm font-medium",
              socialButtonsBlockButtonText: "text-foreground font-medium",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground text-xs",
              formFieldLabel: "text-sm font-medium text-foreground",
              formFieldInput:
                "border border-input bg-background text-foreground rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10 text-sm font-medium transition-colors w-full",
              footerActionLink: "text-primary hover:text-primary/80 font-medium",
              footerActionText: "text-muted-foreground text-sm",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary",
              formFieldInputShowPasswordButton: "text-muted-foreground",
              otpCodeFieldInput:
                "border border-input bg-background rounded-lg text-foreground",
              alertText: "text-sm",
              formFieldErrorText: "text-destructive text-xs mt-1",
            },
            layout: {
              socialButtonsPlacement: "top",
            },
          }}
        />
      </div>
    </main>
  );
}
