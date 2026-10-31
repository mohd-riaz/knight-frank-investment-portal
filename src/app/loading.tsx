import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      className="page-content"
      aria-busy="true"
      aria-label="Loading investment portal"
    >
      <Skeleton className="h-10 w-64 mb-8" />
      <Skeleton className="h-72 w-full mb-8" />
      <div className="property-grid">
        {[1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-80 w-full" />
        ))}
      </div>
    </main>
  );
}
