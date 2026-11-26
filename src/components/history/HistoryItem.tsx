import { memo, useEffect, useState } from 'react';
import type { KnowledgeState, Question, QuestionStats } from '../../types.ts';
import { roundStat } from '../../utils/questionUtils.ts';
import {
  getKnowledgeLabel,
  getKnowledgeState,
  getMasteryPercentage,
  getRealKnowledgeState,
} from '../../utils/scoringUtils.ts';
import {
  AlmostIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleHelpIcon,
  CloseIcon,
} from '../common/Icons.tsx';

interface HistoryItemProps {
  question: Question;
  index: number;
  questionStats?: QuestionStats;
  isCurrent: boolean;
  isExpanded: boolean;
  onSelect: (index: number) => void;
  onToggleExpand: (id: string) => void;
}

const STATE_TEXT_CLASS: Record<KnowledgeState, string> = {
  knows: 'text-emerald-800',
  almost: 'text-amber-500',
  'doesnt-know': 'text-rose-800',
  unanswered: 'text-gray-500',
};

export const HistoryItem = memo(function HistoryItem({
  question,
  index,
  questionStats,
  isCurrent,
  isExpanded,
  onSelect,
  onToggleExpand,
}: HistoryItemProps) {
  const [prevIsCurrent, setPrevIsCurrent] = useState(isCurrent);
  const [jumpTick, setJumpTick] = useState(0);
  const [shouldRenderDetails, setShouldRenderDetails] = useState(isExpanded);
  const [isDrawerOpen, setIsDrawerOpen] = useState(isExpanded);

  if (isCurrent !== prevIsCurrent) {
    setPrevIsCurrent(isCurrent);
    if (isCurrent) {
      setJumpTick((tick) => tick + 1);
    }
  }

  if (isExpanded && !shouldRenderDetails) {
    setShouldRenderDetails(true);
  }
  if (!isExpanded && isDrawerOpen) {
    setIsDrawerOpen(false);
  }

  useEffect(() => {
    if (isExpanded) {
      const frameId = window.requestAnimationFrame(() => {
        setIsDrawerOpen(true);
      });
      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    if (shouldRenderDetails) {
      const timerId = window.setTimeout(() => {
        setShouldRenderDetails(false);
      }, 210);
      return () => {
        window.clearTimeout(timerId);
      };
    }
  }, [isExpanded, shouldRenderDetails]);

  const knowledgeState = getKnowledgeState(questionStats);
  const realState = getRealKnowledgeState(questionStats);
  const isForced = Boolean(questionStats?.forcedState);
  const knowledgeLabel = getKnowledgeLabel(knowledgeState);
  const masteryPercentage = getMasteryPercentage(questionStats);
  const attempts = questionStats?.attempts ?? 0;
  const hasAttempts = attempts > 0;
  const correctCount = roundStat(questionStats?.correct ?? 0);
  const incorrectCount = roundStat(questionStats?.incorrect ?? 0);

  const lastAnswerText = questionStats?.lastAnswer?.length
    ? questionStats.lastAnswer.join(', ')
    : 'No answer';

  const stateTextClass = STATE_TEXT_CLASS[knowledgeState];
  const stateDisplayLabel = isForced ? `${knowledgeLabel} (forced)` : knowledgeLabel;
  const realSummary = hasAttempts
    ? `${getKnowledgeLabel(realState)} · ${masteryPercentage}% (${correctCount} correct, ${incorrectCount} incorrect)`
    : 'Never answered';
  const badgeTitle = isForced
    ? `${stateDisplayLabel} · Real: ${realSummary}`
    : hasAttempts
      ? `${knowledgeLabel} (${masteryPercentage}%) · ${correctCount} correct, ${incorrectCount} incorrect`
      : knowledgeLabel;

  const jumpClass =
    isCurrent && jumpTick > 0
      ? jumpTick % 2 === 1
        ? 'history-number-jump-a'
        : 'history-number-jump-b'
      : '';

  const renderStateIcon = () => {
    switch (knowledgeState) {
      case 'knows':
        return <CheckIcon className="h-3.5 w-3.5 shrink-0" />;
      case 'almost':
        return <AlmostIcon className="h-3.5 w-3.5 shrink-0" />;
      case 'doesnt-know':
        return <CloseIcon className="h-3.5 w-3.5 shrink-0" />;
      case 'unanswered':
        return <CircleHelpIcon className="h-3.5 w-3.5 shrink-0" />;
    }
  };

  return (
    <div
      className={`history-item shadow-2xs ${
        isCurrent ? 'history-item-current' : ''
      } ${isExpanded ? 'history-item-expanded' : ''}`}
    >
      <div className="history-item-header">
        <button
          type="button"
          onClick={() => onSelect(index)}
          className="flex min-w-0 flex-1 cursor-pointer items-center self-stretch py-2 pl-3.5 pr-1 text-left"
        >
          <div className="flex w-full items-center justify-between gap-2.5">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="history-item-number shrink-0">
                <span className={`inline-block ${jumpClass}`}>{index + 1}</span>.
              </span>
              <span
                className={`history-item-question min-w-0 line-clamp-2 ${
                  isCurrent ? 'history-item-question-current' : ''
                }`}
              >
                {question.question}
              </span>
            </span>

            {hasAttempts ? (
              <span
                className={`history-item-mastery flex shrink-0 items-center gap-1 text-xs font-semibold ${stateTextClass}`}
                title={badgeTitle}
                aria-label={`${stateDisplayLabel} ${masteryPercentage}%`}
              >
                {renderStateIcon()}
                <span>{masteryPercentage}%</span>
              </span>
            ) : (
              <span
                className={`flex shrink-0 items-center ${stateTextClass}`}
                title={badgeTitle}
                aria-label={stateDisplayLabel}
              >
                {renderStateIcon()}
              </span>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => onToggleExpand(question.id)}
          title={isExpanded ? `Collapse question ${index + 1}` : `Expand question ${index + 1}`}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} question ${index + 1} answer`}
          aria-expanded={isExpanded}
          className="history-expand-btn mr-2 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md"
        >
          <span
            className={`history-chevron ${
              isExpanded ? 'history-chevron-expanded' : ''
            }`}
          >
            <ChevronDownIcon />
          </span>
        </button>
      </div>

      {shouldRenderDetails && (
        <div
          className={`history-details-drawer ${
            isDrawerOpen ? 'history-details-drawer-open' : ''
          }`}
          inert={!isExpanded}
          aria-hidden={!isExpanded}
        >
          <div className="history-details-drawer-inner">
            <div className="history-details px-3.5 pb-3.5 pt-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                <span className={`inline-flex items-center gap-1.5 font-semibold ${stateTextClass}`}>
                  {renderStateIcon()}
                  <span>
                    {stateDisplayLabel}
                    {hasAttempts ? ` · ${masteryPercentage}%` : ''}
                  </span>
                </span>

                {hasAttempts ? (
                  <span className="tabular-nums text-gray-500">
                    {attempts} {attempts === 1 ? 'attempt' : 'attempts'} ({correctCount}✓ /{' '}
                    {incorrectCount}✕)
                  </span>
                ) : isForced ? (
                  <span className="text-gray-500">Real: never answered</span>
                ) : null}
              </div>

              <p className="mb-2.5 text-sm text-gray-600">
                Last answer:{' '}
                <span className="font-semibold text-gray-800">{lastAnswerText}</span>
              </p>
              <div className="space-y-2">
                {question.options.map((option) => {
                  const wasSelected = questionStats?.lastAnswer?.includes(option.label) ?? false;
                  let optionStyle = 'border-gray-200 bg-white';

                  if (wasSelected) {
                    optionStyle = option.is_correct
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-rose-500 bg-rose-50';
                  } else if (option.is_correct && hasAttempts) {
                    optionStyle = 'border-emerald-500 bg-emerald-50/50';
                  }

                  return (
                    <label
                      key={option.label}
                      className={`history-expanded-option flex items-start px-2.5 py-2 text-sm ${optionStyle}`}
                    >
                      <input
                        type="checkbox"
                        name={`history-${question.id}-option-${option.label}`}
                        checked={wasSelected}
                        disabled
                        readOnly
                        className="circle-checkbox mt-[0.1875rem]"
                      />
                      <span className="ml-2.5 leading-snug text-gray-800">
                        <strong className="mr-1 font-semibold">{option.label})</strong>
                        {option.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
