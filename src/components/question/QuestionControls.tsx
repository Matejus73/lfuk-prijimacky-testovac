import type { CopyStatus, QuestionMode, Subject } from '../../types.ts';
import { IconButton } from '../common/IconButton.tsx';
import { CopyIcon, EditIcon } from '../common/Icons.tsx';
import { ToggleSwitch } from '../common/ToggleSwitch.tsx';

interface QuestionControlsProps {
  questionMode: QuestionMode;
  onModeChange: (mode: QuestionMode) => void;
  revisionCount: number;
  subject: Subject;
  currentIndex: number;
  copyStatus: CopyStatus;
  onCopy: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  randomNext: boolean;
  onToggleRandomNext: () => void;
  fourAnswersOnly: boolean;
  onToggleFourAnswers: () => void;
}

export function QuestionControls({
  questionMode,
  onModeChange,
  revisionCount,
  subject,
  currentIndex,
  copyStatus,
  onCopy,
  isEditing,
  onToggleEdit,
  randomNext,
  onToggleRandomNext,
  fourAnswersOnly,
  onToggleFourAnswers,
}: QuestionControlsProps) {
  const subjectPrefix = subject === 'Biology' ? 'BIO' : 'CHEM';
  const copyTitle =
    copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy question card';
  const editTitle = isEditing ? 'Save or cancel correction' : 'Correct this question';

  return (
    <div className="mb-3 space-y-3 rounded-xl bg-white p-3 shadow-md sm:p-4">
      {/* Mode Switcher */}
      <div className="flex rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onModeChange('all')}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            questionMode === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-white'
          }`}
        >
          All questions
        </button>
        <button
          type="button"
          onClick={() => onModeChange('revision')}
          disabled={revisionCount === 0}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
            questionMode === 'revision'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40'
          }`}
        >
          Revision ({revisionCount})
        </button>
      </div>

      {/* Control bar: Question tag, actions, and toggles */}
      <div className="relative flex min-h-9 items-center justify-center">
        <span className="text-sm font-bold tracking-wide text-gray-700">
          {subjectPrefix} {currentIndex + 1}
        </span>

        <div className="absolute left-0 flex shrink-0 items-center gap-1">
          <IconButton onClick={onCopy} title={copyTitle} ariaLabel={copyTitle}>
            <CopyIcon />
          </IconButton>
          <IconButton onClick={onToggleEdit} title={editTitle} ariaLabel={editTitle}>
            <EditIcon />
          </IconButton>
        </div>

        <div className="absolute right-0 flex shrink-0 items-center gap-2">
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
    </div>
  );
}
