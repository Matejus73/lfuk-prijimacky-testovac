import { ArrowLeftIcon, ArrowRightIcon } from '../common/Icons.tsx';

interface QuestionNavigationProps {
  isEditing: boolean;
  onResetCorrection: () => void;
  onCancelCorrection: () => void;
  onSaveCorrection: () => void;
  onPrev: () => void;
  isPrevDisabled: boolean;
  onNext: () => void;
  isNextDisabled: boolean;
  isEvaluated: boolean;
  onCheckAnswer: () => void;
  onTryAgain: () => void;
}

export function QuestionNavigation({
  isEditing,
  onResetCorrection,
  onCancelCorrection,
  onSaveCorrection,
  onPrev,
  isPrevDisabled,
  onNext,
  isNextDisabled,
  isEvaluated,
  onCheckAnswer,
  onTryAgain,
}: QuestionNavigationProps) {
  return (
    <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-white pb-1 pt-4">
      {isEditing ? (
        <div className="flex w-full flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onResetCorrection}
            className="mr-auto rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Reset to default
          </button>
          <button
            type="button"
            onClick={onCancelCorrection}
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSaveCorrection}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Save correction
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={onPrev}
            disabled={isPrevDisabled}
            title="Previous question"
            aria-label="Previous question"
            className="flex h-10 w-10 items-center justify-center rounded-lg border text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeftIcon />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {!isEvaluated ? (
              <button
                type="button"
                onClick={onCheckAnswer}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Check Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={onTryAgain}
                className="rounded-lg border px-4 py-2 text-sm font-semibold transition hover:bg-gray-50"
              >
                Try Again
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            title="Next question"
            aria-label="Next question"
            className="flex h-10 w-10 items-center justify-center rounded-lg border text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowRightIcon />
          </button>
        </>
      )}
    </div>
  );
}
