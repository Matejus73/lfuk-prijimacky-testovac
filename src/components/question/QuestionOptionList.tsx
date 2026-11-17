import { memo, useMemo } from 'react';
import type { Option } from '../../types.ts';
import { CheckIcon, CloseIcon } from '../common/Icons.tsx';

interface QuestionOptionListProps {
  options: Option[];
  allOptions: Option[];
  selectedLabels: string[];
  isEvaluated: boolean;
  onToggleOption?: (label: string) => void;
  isEditing?: boolean;
  editingOptions?: Option[] | null;
  onToggleOptionCorrect?: (index: number, isCorrect: boolean) => void;
  onChangeOptionText?: (index: number, text: string) => void;
  isGhost?: boolean;
}

export const QuestionOptionList = memo(function QuestionOptionList({
  options,
  allOptions,
  selectedLabels,
  isEvaluated,
  onToggleOption,
  isEditing = false,
  editingOptions = null,
  onToggleOptionCorrect,
  onChangeOptionText,
  isGhost = false,
}: QuestionOptionListProps) {
  const visibleLabels = useMemo(
    () => new Set(options.map((option) => option.label)),
    [options],
  );
  const sourceOptions = isEditing && editingOptions ? editingOptions : allOptions;

  return (
    <div
      className={`question-option-list ${
        isEditing
          ? 'question-option-list-editing'
          : `min-h-0 flex-1 pr-1 ${isGhost ? 'overflow-hidden' : 'overflow-y-auto'}`
      }`}
    >
      {sourceOptions.map((option, optionIndex) => {
        const isVisibleInNormal = visibleLabels.has(option.label);
        const isRowHidden = !isEditing && !isVisibleInNormal;
        const isChecked = selectedLabels.includes(option.label);

        let borderClass = isGhost
          ? 'border-gray-200'
          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/20';
        let bgClass = 'bg-white';

        if (!isEditing) {
          if (isEvaluated) {
            if (option.is_correct) {
              borderClass = 'border-emerald-500 ring-1 ring-emerald-500/30';
              bgClass = 'bg-emerald-50 text-emerald-900';
            } else if (isChecked && !option.is_correct) {
              borderClass = 'border-rose-500 ring-1 ring-rose-500/30';
              bgClass = 'bg-rose-50 text-rose-900';
            }
          } else if (isChecked) {
            borderClass = 'border-blue-500 ring-1 ring-blue-500/30';
            bgClass = 'bg-blue-50';
          }
        }

        return (
          <div
            key={option.label}
            className={`question-option-drawer ${
              isRowHidden ? 'question-option-drawer-hidden' : ''
            }`}
            inert={isRowHidden || isGhost}
            aria-hidden={isRowHidden || isGhost}
          >
            <div className="question-option-drawer-inner">
              <div
                onClick={
                  isGhost
                    ? undefined
                    : () => {
                        if (!isEditing && !isEvaluated) {
                          onToggleOption?.(option.label);
                        }
                      }
                }
                className={`question-option-morph ${
                  isEditing
                    ? 'question-option-morph-editing'
                    : `question-option select-none rounded-lg border-2 shadow-2xs ${
                        isGhost ? '' : 'cursor-pointer'
                      } ${borderClass} ${bgClass}`
                }`}
              >
                {/* Indicator morphing from normal checkbox to edit ✓ / × mark */}
                <div className="option-indicator-morph">
                  <div
                    className={`option-indicator-track ${
                      isEditing ? 'option-indicator-track-editing' : ''
                    }`}
                  >
                    <span className="option-indicator-slot" inert={isEditing || isGhost}>
                      <input
                        type="checkbox"
                        name={`${isGhost ? 'ghost' : 'question'}-option-${option.label}`}
                        aria-label={`Answer ${option.label}`}
                        disabled={!isGhost && (isEvaluated || isEditing)}
                        checked={isChecked}
                        readOnly={isGhost}
                        onChange={
                          isGhost ? undefined : () => onToggleOption?.(option.label)
                        }
                        onClick={
                          isGhost ? undefined : (event) => event.stopPropagation()
                        }
                        tabIndex={isEditing || isGhost ? -1 : 0}
                        className={`circle-checkbox ${isGhost ? '' : 'cursor-pointer'}`}
                      />
                    </span>

                    {!isGhost && (
                      <label
                        className="option-indicator-slot cursor-pointer"
                        inert={!isEditing}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          name={`edit-option-correct-${option.label}`}
                          checked={option.is_correct}
                          disabled={!isEditing}
                          tabIndex={isEditing ? 0 : -1}
                          onChange={(event) =>
                            onToggleOptionCorrect?.(optionIndex, event.target.checked)
                          }
                          aria-label={`Mark answer ${option.label} as correct`}
                          className="edit-answer-checkbox"
                        />
                        <span className="edit-answer-mark" aria-hidden="true">
                          <span
                            className={`edit-answer-mark-track ${
                              option.is_correct ? 'edit-answer-mark-track-correct' : ''
                            }`}
                          >
                            <span className="edit-answer-mark-slot">
                              <CloseIcon />
                            </span>
                            <span className="edit-answer-mark-slot">
                              <CheckIcon />
                            </span>
                          </span>
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Option letter label */}
                <span
                  className={`option-label-morph shrink-0 font-semibold uppercase ${
                    !isEditing && isChecked ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  {option.label})
                </span>

                {/* Option text morphing into textarea */}
                <div
                  className={`option-text-morph ${
                    isEditing ? 'option-text-morph-editing' : ''
                  }`}
                >
                  {isEditing ? (
                    <textarea
                      name={`edit-option-text-${option.label}`}
                      value={option.text}
                      onChange={(event) =>
                        onChangeOptionText?.(optionIndex, event.target.value)
                      }
                      aria-label={`Answer ${option.label} text`}
                      rows={2}
                      className="option-text-textarea"
                    />
                  ) : (
                    <span className="question-option-text block min-w-0 leading-snug text-gray-800">
                      {option.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
