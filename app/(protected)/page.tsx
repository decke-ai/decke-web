"use client";

export default function HomePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Welcome to Decke</h1>
      <p className="mt-2 text-muted-foreground">
        Select an option from the sidebar to get started.
      </p>
    </div>
  );
}
