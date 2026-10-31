"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty-state">
      <h1>We couldn’t load your investment world.</h1>
      <p>Please check that the local database is running and try again.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
