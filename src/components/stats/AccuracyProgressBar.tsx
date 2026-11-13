interface AccuracyProgressBarProps {
  totalAttempts: number;
  correctPercentage: number;
  incorrectPercentage: number;
}

export function AccuracyProgressBar({
  totalAttempts,
  correctPercentage,
  incorrectPercentage,
}: AccuracyProgressBarProps) {
  return (
    <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
        <span>Answer accuracy</span>
        <span>{totalAttempts} graded attempts</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-200">
        {correctPercentage > 0 && (
          <div
            className="bg-emerald-500 transition-all"
            style={{ width: `${correctPercentage}%` }}
            title={`${correctPercentage}% correct`}
          />
        )}
        {incorrectPercentage > 0 && (
          <div
            className="bg-rose-500 transition-all"
            style={{ width: `${incorrectPercentage}%` }}
            title={`${incorrectPercentage}% incorrect`}
          />
        )}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-gray-600">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Correct {correctPercentage}%
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />
          Incorrect {incorrectPercentage}%
        </span>
      </div>
    </div>
  );
}
