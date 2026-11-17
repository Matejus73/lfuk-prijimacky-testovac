import { memo, useState } from 'react';
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

export const QuestionControls = memo(function QuestionControls({
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
  const [focusedBound, setFocusedBound] = useState<'start' | 'end' | null>(null);
  const [draftValue, setDraftValue] = useState('');

  const subjectPrefix = subject === 'Biology' ? 'BIO' : 'CHEM';
  const copyTitle =
    copyStatus === 'copied'
      ? 'Copied!'
      : copyStatus === 'failed'
        ? 'Copy failed'
        : 'Copy question card';
  const editTitle = isEditing ? 'Save or cancel correction' : 'Correct this question';

  const commitStartDraft = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      onRandomRangeStartChange(parsed);
    }
    setFocusedBound(null);
  };

  const commitEndDraft = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) {
      onRandomRangeEndChange(parsed);
    }
    setFocusedBound(null);
  };

  return (
    <div className="question-controls rounded-xl bg-white shadow-md">
      {/* Mode Switcher */}
      <div className="question-mode-switcher relative flex rounded-lg bg-gray-100 p-1">
        {/* Sliding background indicator pill */}
        <div
          className={`mode-switcher-pill ${
            questionMode === 'all' ? 'mode-switcher-pill-all' : 'mode-switcher-pill-revision'
          }`}
        />

        <button
          type="button"
          aria-pressed={questionMode === 'all'}
          onClick={() => onModeChange('all')}
          className={`relative z-10 flex-1 cursor-pointer rounded-md text-sm font-semibold transition-colors duration-180 ${
            questionMode === 'all' ? 'text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All questions
        </button>
        <button
          type="button"
          aria-pressed={questionMode === 'revision'}
          onClick={() => onModeChange('revision')}
          disabled={revisionCount === 0}
          className={`relative z-10 flex-1 cursor-pointer rounded-md text-sm font-semibold transition-colors duration-180 ${
            questionMode === 'revision'
              ? 'text-white'
              : 'text-gray-600 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40'
          }`}
        >
          Revision ({revisionCount})
        </button>
      </div>

      {/* Control bar: Question tag, actions, and toggles */}
      <div className="question-control-bar relative flex items-center justify-between gap-2">
        <div className="relative z-10 flex shrink-0 items-center gap-1.5">
          <IconButton onClick={onCopy} title={copyTitle} ariaLabel={copyTitle}>
            <CopyIcon />
          </IconButton>
          <IconButton
            onClick={onToggleEdit}
            title={editTitle}
            ariaLabel={editTitle}
            ariaPressed={isEditing}
            isActive={isEditing}
          >
            <EditIcon />
          </IconButton>
        </div>

        <div className="question-position pointer-events-none">
          <span
            className={`question-position-content pointer-events-auto flex items-center text-sm font-bold tracking-wide text-gray-700 ${
              randomNext ? 'question-position-content-expanded' : ''
            }`}
          >
            <span>
              {subjectPrefix} {currentIndex + 1}
            </span>
            <span
              className={`random-range font-normal tracking-normal text-gray-600 ${
                randomNext ? 'random-range-visible' : ''
              }`}
              aria-hidden={!randomNext}
            >
              <span className="random-range-inner">
                <span
                  className={`random-range-pill ${randomNext ? 'random-range-pill-visible' : ''}`}
                >
                  <span
                    className={`random-range-track ${
                      randomNext ? 'random-range-track-visible' : ''
                    }`}
                  >
                    <span className="random-range-slot" aria-hidden="true" />
                    <span className="random-range-slot">
                      <input
                        type="number"
                        name="random-range-start"
                        disabled={!randomNext}
                        tabIndex={randomNext ? 0 : -1}
                        min={1}
                        max={randomRangeEnd}
                        value={focusedBound === 'start' ? draftValue : randomRangeStart}
                        onFocus={() => {
                          setFocusedBound('start');
                          setDraftValue(String(randomRangeStart));
                        }}
                        onChange={(event) => {
                          const raw = event.target.value;
                          setDraftValue(raw);
                          if (raw.trim() === '') return;
                          const parsed = Number(raw);
                          if (
                            Number.isFinite(parsed) &&
                            parsed >= 1 &&
                            parsed <= randomRangeEnd
                          ) {
                            onRandomRangeStartChange(parsed);
                          }
                        }}
                        onBlur={() => commitStartDraft(draftValue)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.currentTarget.blur();
                          }
                        }}
                        aria-label="First random question"
                        className="random-range-input"
                      />
                    </span>
                  </span>
                </span>
                <span>to</span>
                <span
                  className={`random-range-pill ${randomNext ? 'random-range-pill-visible' : ''}`}
                >
                  <span
                    className={`random-range-track ${
                      randomNext ? 'random-range-track-visible' : ''
                    }`}
                  >
                    <span className="random-range-slot" aria-hidden="true" />
                    <span className="random-range-slot">
                      <input
                        type="number"
                        name="random-range-end"
                        disabled={!randomNext}
                        tabIndex={randomNext ? 0 : -1}
                        min={randomRangeStart}
                        max={randomRangeMax}
                        value={focusedBound === 'end' ? draftValue : randomRangeEnd}
                        onFocus={() => {
                          setFocusedBound('end');
                          setDraftValue(String(randomRangeEnd));
                        }}
                        onChange={(event) => {
                          const raw = event.target.value;
                          setDraftValue(raw);
                          if (raw.trim() === '') return;
                          const parsed = Number(raw);
                          if (
                            Number.isFinite(parsed) &&
                            parsed >= randomRangeStart &&
                            parsed <= randomRangeMax
                          ) {
                            onRandomRangeEndChange(parsed);
                          }
                        }}
                        onBlur={() => commitEndDraft(draftValue)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.currentTarget.blur();
                          }
                        }}
                        aria-label="Last random question"
                        className="random-range-input"
                      />
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </span>
        </div>

        <div className="relative z-10 flex shrink-0 items-center gap-2">
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
});
