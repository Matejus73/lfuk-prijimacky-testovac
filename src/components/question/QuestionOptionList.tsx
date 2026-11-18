import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { Option, QuestionEditDiff } from '../../types.ts';
import { CheckIcon, CloseIcon, ModifiedIcon } from '../common/Icons.tsx';
import { FieldResizeHandle } from './FieldResizeHandle.tsx';

interface QuestionOptionListProps {
  options: Option[];
  allOptions: Option[];
  selectedLabels: string[];
  isEvaluated: boolean;
  onToggleOption?: (label: string) => void;
  isEditing?: boolean;
  editingOptions?: Option[] | null;
  editDiff?: QuestionEditDiff;
  onToggleOptionCorrect?: (index: number, isCorrect: boolean) => void;
  onChangeOptionText?: (index: number, text: string) => void;
  customOptionHeights?: Record<string, number>;
  onResizeOptionField?: (label: string, nextHeight: number | null) => void;
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
  editDiff,
  onToggleOptionCorrect,
  onChangeOptionText,
  customOptionHeights,
  onResizeOptionField,
  isGhost = false,
}: QuestionOptionListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [isListScrollable, setIsListScrollable] = useState(false);
  const [isListScrolled, setIsListScrolled] = useState(false);
  const [listScrollbarWidth, setListScrollbarWidth] = useState(0);

  const visibleLabels = useMemo(
    () => new Set(options.map((option) => option.label)),
    [options],
  );
  const displayLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((option, index) => {
      map.set(option.label, String.fromCharCode(97 + index));
    });
    return map;
  }, [options]);
  const sourceOptions = isEditing && editingOptions ? editingOptions : allOptions;

  const updateScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el || isEditing || isGhost) {
      setIsListScrollable(false);
      setIsListScrolled(false);
      setListScrollbarWidth(0);
      return;
    }
    const nextScrollable = el.scrollHeight > el.clientHeight + 1;
    const nextScrolled = el.scrollTop > 1;
    const nextScrollbarWidth = Math.max(0, el.offsetWidth - el.clientWidth);
    setIsListScrollable((prev) => (prev !== nextScrollable ? nextScrollable : prev));
    setIsListScrolled((prev) => (prev !== nextScrolled ? nextScrolled : prev));
    setListScrollbarWidth((prev) => (prev !== nextScrollbarWidth ? nextScrollbarWidth : prev));
  }, [isEditing, isGhost]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || isEditing || isGhost) {
      setIsListScrollable(false);
      setIsListScrolled(false);
      setListScrollbarWidth(0);
      return;
    }

    updateScrollState();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [isEditing, isGhost, options.length, updateScrollState]);

  const handleListScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const nextScrolled = el.scrollTop > 1;
    const nextScrollable = el.scrollHeight > el.clientHeight + 1;
    const nextScrollbarWidth = Math.max(0, el.offsetWidth - el.clientWidth);
    setIsListScrolled((prev) => (prev !== nextScrolled ? nextScrolled : prev));
    setIsListScrollable((prev) => (prev !== nextScrollable ? nextScrollable : prev));
    setListScrollbarWidth((prev) => (prev !== nextScrollbarWidth ? nextScrollbarWidth : prev));
  }, []);

  const listContent = (
    <div
      ref={isGhost ? undefined : listRef}
      onScroll={!isEditing && !isGhost ? handleListScroll : undefined}
      className={`question-option-list ${
        isEditing
          ? 'question-option-list-editing'
          : `min-h-0 flex-1 question-option-list-scroll ${
              isGhost
                ? 'overflow-hidden'
                : `overflow-y-auto ${
                    isListScrollable ? 'question-option-list-scroll-scrollable' : ''
                  }`
            }`
      }`}
    >
      {sourceOptions.map((option, optionIndex) => {
        const isVisibleInNormal = visibleLabels.has(option.label);
        const isRowHidden = !isEditing && !isVisibleInNormal;
        const isChecked = selectedLabels.includes(option.label);
        const displayLabel = isEditing
          ? option.label
          : (displayLabelMap.get(option.label) ?? option.label);
        const optionEditDiff = isEditing ? editDiff?.editedOptions[option.label] : undefined;

        let optionStateClass = 'question-option-interactive';
        let labelToneClass = 'text-gray-700';

        if (!isEditing) {
          if (isEvaluated) {
            if (option.is_correct) {
              optionStateClass = 'question-option-correct';
              labelToneClass = 'text-emerald-800';
            } else if (isChecked && !option.is_correct) {
              optionStateClass = 'question-option-incorrect';
              labelToneClass = 'text-rose-700';
            }
          } else if (isChecked) {
            optionStateClass = 'question-option-selected';
            labelToneClass = 'text-blue-600';
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
                    : `question-option select-none shadow-2xs ${
                        isGhost ? '' : 'cursor-pointer'
                      } ${optionStateClass}`
                }`}
              >
                {/* Indicator morphing from normal checkbox to edit ✓ / × mark */}
                <div className="option-indicator-wrap">
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
                          aria-label={`Answer ${displayLabel}`}
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
                          title={option.is_correct ? 'Marked correct (click to toggle)' : 'Marked incorrect (click to toggle)'}
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

                  {isEditing && optionEditDiff?.isCorrectEdited && (
                    <span
                      className="edit-mark-badge"
                      title={`Answer ${option.label.toUpperCase()} correctness was edited`}
                      aria-label={`Answer ${option.label.toUpperCase()} correctness was edited`}
                    >
                      <ModifiedIcon className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                {/* Option letter label */}
                <span
                  className={`option-label-morph shrink-0 font-semibold uppercase ${
                    isEditing ? '' : labelToneClass
                  }`}
                >
                  {displayLabel})
                </span>

                {/* Option text morphing into textarea */}
                <div
                  onClick={
                    isEditing
                      ? (event) => {
                          const target = event.target as HTMLElement;
                          if (
                            target.tagName !== 'TEXTAREA' &&
                            !target.closest('.edit-field-resize-handle')
                          ) {
                            event.currentTarget.querySelector('textarea')?.focus();
                          }
                        }
                      : undefined
                  }
                  style={
                    isEditing && customOptionHeights?.[option.label] != null
                      ? { minHeight: `${customOptionHeights[option.label]}px` }
                      : undefined
                  }
                  className={`option-text-morph ${
                    isEditing ? 'option-text-morph-editing' : ''
                  }`}
                >
                  {isEditing ? (
                    <>
                      <textarea
                        name={`edit-option-text-${option.label}`}
                        lang="sk"
                        spellCheck={false}
                        value={option.text}
                        onChange={(event) =>
                          onChangeOptionText?.(optionIndex, event.target.value)
                        }
                        aria-label={`Answer ${option.label} text`}
                        rows={1}
                        className="option-text-textarea"
                      />
                      {optionEditDiff?.isTextEdited && (
                        <span
                          className="edit-element-icon edit-element-icon-field"
                          title={`Answer ${option.label.toUpperCase()} text was edited`}
                          aria-label={`Answer ${option.label.toUpperCase()} text was edited`}
                        >
                          <ModifiedIcon className="h-3 w-3" />
                        </span>
                      )}
                      {onResizeOptionField && (
                        <FieldResizeHandle
                          ariaLabel={`Resize answer ${option.label} field`}
                          onResize={(nextHeight) => onResizeOptionField(option.label, nextHeight)}
                          onReset={() => onResizeOptionField(option.label, null)}
                        />
                      )}
                    </>
                  ) : (
                    <span lang="sk" className="question-option-text block min-w-0 leading-snug text-gray-800">
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

  if (!isEditing && !isGhost) {
    return (
      <div
        style={
          (listScrollbarWidth > 0
            ? { '--card-scrollbar-w': `${listScrollbarWidth}px` }
            : undefined) as CSSProperties | undefined
        }
        className="relative flex min-h-0 flex-1 flex-col"
      >
        {listContent}
        {isListScrolled && (
          <div
            className={`scroll-window-corners scroll-window-corners-card scroll-window-corners-top ${
              isListScrollable ? 'scroll-window-corners-card-scrollable' : ''
            }`}
            aria-hidden="true"
          />
        )}
      </div>
    );
  }

  return listContent;
});
