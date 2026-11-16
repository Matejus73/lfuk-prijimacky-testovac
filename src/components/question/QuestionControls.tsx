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
  randomRangeStart: number;
  randomRangeEnd: number;
  randomRangeMax: number;
  onRandomRangeStartChange: (value: number) => void;
  onRandomRangeEndChange: (value: number) => void;
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
  randomRangeStart,
  randomRangeEnd,
  randomRangeMax,
  onRandomRangeStartChange,
  onRandomRangeEndChange,
  fourAnswersOnly,
  onToggleFourAnswers,
}: QuestionControlsProps) {
  const subjectPrefix = subject === 'Biology' ? 'BIO' : 'CHEM';
  const copyTitle =
    copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy question card';
  const editTitle = isEditing ? 'Save or cancel correction' : 'Correct this question';

  return (
    <div className="question-controls rounded-xl bg-white shadow-md">
      {/* Mode Switcher */}
      <div className="question-mode-switcher relative flex rounded-lg bg-gray-100 p-1">
        {/* Sliding background indicator pill */}
        <div
          className={`mode-switcher-pill ${
            questionMode === 'all'
              ? 'mode-switcher-pill-all'
              : 'mode-switcher-pill-revision'
          }`}
        />

        <button
          type="button"
          onClick={() => onModeChange('all')}
          className={`relative z-10 flex-1 cursor-pointer rounded-md text-sm font-semibold transition-colors duration-150 ${
            questionMode === 'all'
              ? 'text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All questions
        </button>
        <button
          type="button"
          onClick={() => onModeChange('revision')}
          disabled={revisionCount === 0}
          className={`relative z-10 flex-1 cursor-pointer rounded-md text-sm font-semibold transition-colors duration-150 ${
            questionMode === 'revision'
              ? 'text-white'
              : 'text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40'
          }`}
        >
          Revision ({revisionCount})
        </button>
      </div>

      {/* Control bar: Question tag, actions, and toggles */}
      <div className="question-control-bar relative flex items-center justify-center">
        <div className="question-position pointer-events-none">
          <span className="question-position-content pointer-events-auto flex items-center gap-2 text-sm font-bold tracking-wide text-gray-700">
            {subjectPrefix} {currentIndex + 1}
            <span
              className={`random-range flex items-center gap-1 font-normal tracking-normal text-gray-600 ${
                randomNext ? 'random-range-visible' : ''
              }`}
              aria-hidden={!randomNext}
            >
              <input
                type="number"
                disabled={!randomNext}
                min={1}
                max={randomRangeEnd}
                value={randomRangeStart}
                onChange={(event) => onRandomRangeStartChange(Number(event.target.value))}
                aria-label="First random question"
                className="random-range-input"
              />
              <span>to</span>
              <input
                type="number"
                disabled={!randomNext}
                min={randomRangeStart}
                max={randomRangeMax}
                value={randomRangeEnd}
                onChange={(event) => onRandomRangeEndChange(Number(event.target.value))}
                aria-label="Last random question"
                className="random-range-input"
              />
            </span>
          </span>
        </div>

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
