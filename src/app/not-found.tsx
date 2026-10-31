import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="empty-state">
      <h1>Opportunity not found.</h1>
      <p>This page is not available in the portfolio.</p>
      <Button asChild>
        <Link href="/overview">Return to overview</Link>
      </Button>
    </main>
  );
}
