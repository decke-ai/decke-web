"use client";

import { ReactNode, Suspense } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { PostHogProvider, PostHogPageview } from "@/components/posthog-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      <AuthProvider>{children}</AuthProvider>
    </PostHogProvider>
  );
}
