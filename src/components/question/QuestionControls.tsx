import { memo } from 'react';
import type { QuestionMode } from '../../types.ts';
import { ToggleSwitch } from '../common/ToggleSwitch.tsx';

interface QuestionControlsProps {
  questionMode: QuestionMode;
  onModeChange: (mode: QuestionMode) => void;
  revisionCount: number;
  randomNext: boolean;
  onToggleRandomNext: () => void;
  fourAnswersOnly: boolean;
  onToggleFourAnswers: () => void;
}

export const QuestionControls = memo(function QuestionControls({
  questionMode,
  onModeChange,
  revisionCount,
  randomNext,
  onToggleRandomNext,
  fourAnswersOnly,
  onToggleFourAnswers,
}: QuestionControlsProps) {
  const isRevision = questionMode === 'revision';
  const isRevisionDisabled = revisionCount === 0 && !isRevision;
  const revisionTitle = isRevisionDisabled
    ? 'No questions to revise yet'
    : isRevision
      ? "Showing questions you don't know or almost know (switch to all)"
      : `Revise ${revisionCount} ${revisionCount === 1 ? 'question' : 'questions'} (doesn't know & almost knows)`;

  return (
    <div className="question-controls">
      <div className="flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-2 sm:gap-x-4">
        <ToggleSwitch
          label="Revision"
          checked={isRevision}
          onChange={() => onModeChange(isRevision ? 'all' : 'revision')}
          disabled={isRevisionDisabled}
          activeColor="revision"
          activeBadgeText="on"
          inactiveBadgeText="off"
          title={revisionTitle}
          ariaLabel={revisionTitle}
        />
        <ToggleSwitch
          label="Random"
          checked={randomNext}
          onChange={onToggleRandomNext}
          activeBadgeText="on"
          inactiveBadgeText="off"
          title={randomNext ? 'Next question is random' : 'Next question follows order'}
        />
        <ToggleSwitch
          label="Answers"
          checked={fourAnswersOnly}
          onChange={onToggleFourAnswers}
          activeBadgeText="4"
          inactiveBadgeText="all"
          title={fourAnswersOnly ? 'Show all answers' : 'Show 4 random answers'}
        />
      </div>
    </div>
  );
});
