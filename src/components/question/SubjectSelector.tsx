import { memo, useState } from 'react';
import type { Subject } from '../../types.ts';
import { CopyIcon, EditIcon } from '../common/Icons.tsx';
import { RollingNumber } from '../common/RollingNumber.tsx';

interface SubjectSelectorProps {
  currentSubject: Subject;
  onSelectSubject: (subject: Subject) => void;
  questionNumber: number;
  isEditing: boolean;
  isRevision: boolean;
  isCopied: boolean;
  copyPulseKey: number;
  randomNext: boolean;
  randomRangeStart: number;
  randomRangeEnd: number;
  randomRangeMax: number;
  onRandomRangeStartChange: (value: number) => void;
  onRandomRangeEndChange: (value: number) => void;
}

const SUBJECTS: Subject[] = ['Biology', 'Chemistry'];

export const SubjectSelector = memo(function SubjectSelector({
  currentSubject,
  onSelectSubject,
  questionNumber,
  isEditing,
  isRevision,
  isCopied,
  copyPulseKey,
  randomNext,
  randomRangeStart,
  randomRangeEnd,
  randomRangeMax,
  onRandomRangeStartChange,
  onRandomRangeEndChange,
}: SubjectSelectorProps) {
  const [lastNumbers, setLastNumbers] = useState<Record<Subject, number>>(() => ({
    Biology: currentSubject === 'Biology' ? questionNumber : 1,
    Chemistry: currentSubject === 'Chemistry' ? questionNumber : 1,
  }));
  const [focusedBound, setFocusedBound] = useState<'start' | 'end' | null>(null);
  const [draftValue, setDraftValue] = useState('');

  if (lastNumbers[currentSubject] !== questionNumber) {
    setLastNumbers((prev) => ({
      ...prev,
      [currentSubject]: questionNumber,
    }));
  }

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

  const showRange = randomNext && !isEditing && !isRevision;

  return (
    <div className={`subject-selector ${showRange ? 'subject-selector-random' : ''}`}>
      {SUBJECTS.map((subject) => {
        const isSelected = currentSubject === subject;
        const tabNumber = isSelected ? questionNumber : lastNumbers[subject];
        const isRangeVisible = isSelected && showRange;
        const isTabEditIconVisible = isSelected && isEditing;
        const isTabCopyIconVisible = isSelected && isCopied;
        const tabShutterClass =
          isSelected && copyPulseKey > 0
            ? copyPulseKey % 2 === 1
              ? 'copy-tab-shutter-a'
              : 'copy-tab-shutter-b'
            : '';

        return (
          <div
            key={subject}
            className={`subject-tab ${
              isSelected ? 'subject-tab-active' : 'subject-tab-inactive'
            } ${tabShutterClass}`.trim()}
          >
            <span className="subject-tab-fillet subject-tab-fillet-left" aria-hidden="true">
              {isSelected && copyPulseKey > 0 && (
                <span key={`fillet-left-${copyPulseKey}`} className="subject-tab-fillet-flash" />
              )}
            </span>
            <span className="subject-tab-fillet subject-tab-fillet-right" aria-hidden="true">
              {isSelected && copyPulseKey > 0 && (
                <span key={`fillet-right-${copyPulseKey}`} className="subject-tab-fillet-flash" />
              )}
            </span>
            <span className="subject-tab-surface">
              <span className="subject-tab-surface-hover" aria-hidden="true" />
              <span className="subject-tab-surface-active" aria-hidden="true" />
              {isSelected && copyPulseKey > 0 && (
                <span
                  key={`tab-flash-${copyPulseKey}`}
                  className="subject-tab-flash"
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectSubject(subject)}
                className="subject-tab-button"
              >
                <span className="sr-only">
                  {subject}
                  {isSelected && isEditing ? ' (editing)' : ''}
                  {isSelected && isCopied ? ' (copied)' : ''}
                </span>
              </button>

              <span
                className={`subject-tab-edit-icon ${
                  isTabEditIconVisible ? 'subject-tab-edit-icon-visible' : ''
                }`}
                aria-hidden="true"
              >
                <span className="subject-tab-edit-icon-inner">
                  <EditIcon className="h-3.5 w-3.5 shrink-0" />
                </span>
              </span>

              <span
                className={`subject-tab-copy-icon ${
                  isTabCopyIconVisible ? 'subject-tab-copy-icon-visible' : ''
                }`}
                aria-hidden="true"
              >
                <span className="subject-tab-copy-icon-inner">
                  <CopyIcon className="h-3.5 w-3.5 shrink-0" />
                </span>
              </span>

              <span className="subject-tab-title" aria-hidden="true">
                {subject}
              </span>

              <span
                className={`random-range ${isRangeVisible ? 'random-range-visible' : ''}`}
                inert={!isRangeVisible}
                aria-hidden={!isRangeVisible}
              >
                <span className="random-range-inner">
                  <span
                    className={`random-range-pill ${
                      isRangeVisible ? 'random-range-pill-visible' : ''
                    }`}
                  >
                    <span
                      className={`random-range-track ${
                        isRangeVisible ? 'random-range-track-visible' : ''
                      }`}
                    >
                      <span className="random-range-slot" aria-hidden="true" />
                      <span className="random-range-slot">
                        <input
                          type="number"
                          name={`random-range-start-${subject.toLowerCase()}`}
                          disabled={!isRangeVisible}
                          tabIndex={isRangeVisible ? 0 : -1}
                          min={1}
                          max={randomRangeEnd}
                          value={
                            isRangeVisible && focusedBound === 'start'
                              ? draftValue
                              : randomRangeStart
                          }
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

                  <span className="random-range-separator">to</span>

                  <span
                    className={`random-range-pill ${
                      isRangeVisible ? 'random-range-pill-visible' : ''
                    }`}
                  >
                    <span
                      className={`random-range-track ${
                        isRangeVisible ? 'random-range-track-visible' : ''
                      }`}
                    >
                      <span className="random-range-slot" aria-hidden="true" />
                      <span className="random-range-slot">
                        <input
                          type="number"
                          name={`random-range-end-${subject.toLowerCase()}`}
                          disabled={!isRangeVisible}
                          tabIndex={isRangeVisible ? 0 : -1}
                          min={randomRangeStart}
                          max={randomRangeMax}
                          value={
                            isRangeVisible && focusedBound === 'end'
                              ? draftValue
                              : randomRangeEnd
                          }
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

              <span
                className={`subject-tab-number ${
                  isSelected ? 'subject-tab-number-visible' : 'subject-tab-number-hidden'
                }`}
                aria-hidden={!isSelected}
              >
                {isSelected && <span className="sr-only"> Question </span>}
                <RollingNumber value={tabNumber} align="right" />
              </span>
            </span>
            {isSelected && <span className="subject-tab-seam" aria-hidden="true" />}
            {isSelected && copyPulseKey > 0 && (
              <span
                key={`tab-seam-flash-${copyPulseKey}`}
                className="subject-tab-seam-flash"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
