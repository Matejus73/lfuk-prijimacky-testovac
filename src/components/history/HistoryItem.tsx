import type { Question, QuestionStats } from '../../types.ts';
import { IconButton } from '../common/IconButton.tsx';
import { ChevronDownIcon, ChevronUpIcon } from '../common/Icons.tsx';

interface HistoryItemProps {
  question: Question;
  index: number;
  questionStats?: QuestionStats;
  isCurrent: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

export function HistoryItem({
  question,
  index,
  questionStats,
  isCurrent,
  isExpanded,
  onSelect,
  onToggleExpand,
}: HistoryItemProps) {
  const lastAnswerText = questionStats?.lastAnswer?.length
    ? questionStats.lastAnswer.join(', ')
    : 'No answer';

  let statusBorderClass = 'border-gray-200';
  if (questionStats?.lastResult === 'correct') {
    statusBorderClass = 'border-emerald-500 bg-emerald-50';
  } else if (questionStats?.lastResult === 'incorrect') {
    statusBorderClass = 'border-rose-500 bg-rose-50';
  } else if (isCurrent) {
    statusBorderClass = 'border-gray-200 bg-blue-50';
  }

  const activeRingClass = isCurrent ? 'ring-2 ring-blue-400' : '';

  return (
    <div
      className={`rounded-lg border-2 transition hover:border-blue-400 ${statusBorderClass} ${activeRingClass}`}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 p-3 text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-gray-800">
              {index + 1}. {question.id}
            </span>
            <span className="text-xs text-gray-500">
              {questionStats?.lastResult && questionStats.lastResult !== 'unanswered'
                ? `${questionStats.correct} correct / ${questionStats.incorrect} incorrect`
                : 'Not answered'}
            </span>
          </div>
        </button>

        <div className="mr-3">
          <IconButton
            onClick={onToggleExpand}
            title={isExpanded ? `Collapse ${question.id}` : `Expand ${question.id}`}
            ariaLabel={`${isExpanded ? 'Collapse' : 'Expand'} ${question.id} answer`}
          >
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </IconButton>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200/80 px-3 pb-3 pt-2">
          <p className="mb-2 text-sm text-gray-600">
            Last answer: <span className="font-semibold text-gray-800">{lastAnswerText}</span>
          </p>
          <div className="space-y-2">
            {question.options.map((option) => {
              const wasSelected = questionStats?.lastAnswer?.includes(option.label) ?? false;
              let optionStyle = 'border-gray-200 bg-white';

              if (wasSelected) {
                optionStyle = option.is_correct
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-rose-500 bg-rose-50';
              } else if (option.is_correct && questionStats?.lastResult) {
                optionStyle = 'border-emerald-500 bg-emerald-50/50';
              }

              return (
                <label
                  key={option.label}
                  className={`flex items-start rounded-lg border p-2 text-sm ${optionStyle}`}
                >
                  <input
                    type="checkbox"
                    checked={wasSelected}
                    disabled
                    readOnly
                    className="mt-0.5 h-4 w-4 rounded text-blue-600"
                  />
                  <span className="ml-2 font-semibold text-gray-700">{option.label})</span>
                  <span className="ml-2 text-gray-700">{option.text}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
