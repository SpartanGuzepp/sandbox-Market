export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating === null) return <span className="text-sm text-slate-400">No reviews yet</span>;
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1 text-sm text-slate-600">
      <span className="text-amber-500" aria-hidden>
        {"★".repeat(full)}
        <span className="text-slate-300">{"★".repeat(5 - full)}</span>
      </span>
      <span>{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-slate-400">({count.toLocaleString("en-GB")})</span>}
    </span>
  );
}
