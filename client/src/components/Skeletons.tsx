export function SkeletonCard() {
  return <div aria-hidden="true" className="animate-pulse bg-slate-200 rounded-2xl h-28" />;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="animate-pulse bg-slate-200 rounded-xl h-16" />
      ))}
    </div>
  );
}
