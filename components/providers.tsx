"use client";

import { ReactNode, Suspense } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { PostHogProvider, PostHogPageview } from "@/components/posthog-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      <AuthProvider>
        {children}
        <Toaster position="bottom-right" />
      </AuthProvider>
    </PostHogProvider>
  );
}
