import { memo } from 'react';

interface AccuracyProgressBarProps {
  totalAttempts: number;
  correctPercentage: number;
  incorrectPercentage: number;
}

export const AccuracyProgressBar = memo(function AccuracyProgressBar({
  totalAttempts,
  correctPercentage,
  incorrectPercentage,
}: AccuracyProgressBarProps) {
  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-2xs">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
        <span>Answer accuracy</span>
        <span>{totalAttempts} graded attempts</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-200">
        <div
          className="accuracy-bar-fill bg-emerald-500"
          style={{ width: `${correctPercentage}%` }}
          title={`${correctPercentage}% correct`}
        />
        <div
          className="accuracy-bar-fill bg-rose-500"
          style={{ width: `${incorrectPercentage}%` }}
          title={`${incorrectPercentage}% incorrect`}
        />
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-600">
        <span className="flex items-center">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Correct {correctPercentage}%
        </span>
        <span className="flex items-center">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-500" />
          Incorrect {incorrectPercentage}%
        </span>
      </div>
    </div>
  );
});
