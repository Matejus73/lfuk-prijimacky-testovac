interface StatsOverviewProps {
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
}

export function StatsOverview({
  unansweredCount,
  correctCount,
  incorrectCount,
}: StatsOverviewProps) {
  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
        <span className="font-bold">{unansweredCount}</span> unanswered
      </div>
      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <span className="font-bold">{correctCount}</span> correct
      </div>
      <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
        <span className="font-bold">{incorrectCount}</span> incorrect
      </div>
    </div>
  );
}
