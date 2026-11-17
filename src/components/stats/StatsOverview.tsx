import { memo } from 'react';
import { roundStat } from '../../utils/questionUtils.ts';

interface StatsOverviewProps {
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
}

export const StatsOverview = memo(function StatsOverview({
  unansweredCount,
  correctCount,
  incorrectCount,
}: StatsOverviewProps) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2.5">
      <div className="rounded-lg bg-slate-100 px-3 py-2 text-center text-sm">
        <span className="font-bold">{unansweredCount}</span> unanswered
      </div>
      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-800">
        <span className="font-bold">{roundStat(correctCount)}</span> correct
      </div>
      <div className="rounded-lg bg-rose-50 px-3 py-2 text-center text-sm text-rose-800">
        <span className="font-bold">{roundStat(incorrectCount)}</span> incorrect
      </div>
    </div>
  );
});
