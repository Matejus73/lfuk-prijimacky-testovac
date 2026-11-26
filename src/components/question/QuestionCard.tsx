import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type {
  CopyStatus,
  EditableQuestion,
  ForcedKnowledgeState,
  KnowledgeState,
  Option,
  Question,
  QuestionEditDiff,
  QuestionStats,
  Subject,
} from '../../types.ts';
import { getKnowledgeLabel, getRealKnowledgeState } from '../../utils/scoringUtils.ts';
import {
  getQuestionSourceImages,
  preloadSourceImage,
} from '../../utils/sourceImageUtils.ts';
import { IconButton } from '../common/IconButton.tsx';
import {
  AlmostIcon,
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  ModifiedIcon,
} from '../common/Icons.tsx';
import { FieldResizeHandle } from './FieldResizeHandle.tsx';
import { QuestionNavigation } from './QuestionNavigation.tsx';
import { QuestionOptionList } from './QuestionOptionList.tsx';
import { SourceImageSlot } from './SourceImageSlot.tsx';

interface QuestionCardProps {
  currentSubject: Subject;
  currentQuestion: Question;
  questionStats?: QuestionStats;
  displayedOptions: Option[];
  orderedOptions: Option[];
  selectedLabels: string[];
  isEvaluated: boolean;
  onToggleOption: (label: string) => void;
  copyStatus: CopyStatus;
  onCopy: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  editingQuestion: EditableQuestion | null;
  editingForcedState?: ForcedKnowledgeState;
  editDiff: QuestionEditDiff;
  onChangeQuestionText: (text: string) => void;
  onToggleOptionCorrect: (index: number, isCorrect: boolean) => void;
  onChangeOptionText: (index: number, text: string) => void;
  onCycleEditingForcedState: () => void;
  editError: string;
  onResetCorrection: () => void;
  onCancelCorrection: () => void;
  onSaveCorrection: () => void;
  onPrev: () => void;
  isPrevDisabled: boolean;
  onNext: () => void;
  isNextDisabled: boolean;
  onCheckAnswer: () => void;
  onTryAgain: () => void;
  copyPulseKey: number;
}

const SUBJECT_ORDER: Record<Subject, number> = {
  Biology: 0,
  Chemistry: 1,
};

const PILL_COLOR_CLASSES: Record<KnowledgeState, string> = {
  knows: 'section-pill-btn-knows',
  almost: 'section-pill-btn-almost',
  'doesnt-know': 'section-pill-btn-doesnt-know',
  unanswered: 'section-pill-btn-unanswered',
};

const PILL_TRACK_CLASSES: Record<ForcedKnowledgeState | 'auto', string> = {
  auto: 'section-pill-track-auto',
  knows: 'section-pill-track-knows',
  almost: 'section-pill-track-almost',
  'doesnt-know': 'section-pill-track-doesnt-know',
};

export const QuestionCard = memo(function QuestionCard({
  currentSubject,
  currentQuestion,
  questionStats,
  displayedOptions,
  orderedOptions,
  selectedLabels,
  isEvaluated,
  onToggleOption,
  copyStatus,
  onCopy,
  isEditing,
  onToggleEdit,
  editingQuestion,
  editingForcedState,
  editDiff,
  onChangeQuestionText,
  onToggleOptionCorrect,
  onChangeOptionText,
  onCycleEditingForcedState,
  editError,
  onResetCorrection,
  onCancelCorrection,
  onSaveCorrection,
  onPrev,
  isPrevDisabled,
  onNext,
  isNextDisabled,
  onCheckAnswer,
  onTryAgain,
  copyPulseKey,
}: QuestionCardProps) {
  const [areSourceImagesHidden, setAreSourceImagesHidden] = useState(false);
  const [isEditScrolled, setIsEditScrolled] = useState(false);
  const [editScrollbarWidth, setEditScrollbarWidth] = useState(0);
  const [editFieldSizes, setEditFieldSizes] = useState<{
    questionHeight: number;
    optionHeight: number;
    bottomGap: number;
  } | null>(null);
  const [fieldCustomHeights, setFieldCustomHeights] = useState<{
    questionId: string;
    questionHeight: number | null;
    optionHeights: Record<string, number>;
  }>({
    questionId: currentQuestion.id,
    questionHeight: null,
    optionHeights: {},
  });

  const editShellRef = useRef<HTMLDivElement>(null);
  const editScrollBodyRef = useRef<HTMLDivElement>(null);
  const editContentRef = useRef<HTMLDivElement>(null);
  const sourceImagesRef = useRef<HTMLDivElement>(null);
  const imagesToggleRef = useRef<HTMLDivElement>(null);
  const sectionOverrideRef = useRef<HTMLDivElement>(null);

  const [subjectTransition, setSubjectTransition] = useState<{
    subject: Subject;
    direction: 'next' | 'prev';
    tick: number;
  }>({
    subject: currentSubject,
    direction: 'next',
    tick: 0,
  });

  if (currentSubject !== subjectTransition.subject) {
    setSubjectTransition({
      subject: currentSubject,
      direction:
        SUBJECT_ORDER[currentSubject] >= SUBJECT_ORDER[subjectTransition.subject]
          ? 'next'
          : 'prev',
      tick: subjectTransition.tick + 1,
    });
  }

  const subjectEnterClass =
    subjectTransition.tick > 0
      ? subjectTransition.direction === 'next'
        ? 'subject-content-enter-next'
        : 'subject-content-enter-prev'
      : '';

  const shutterClass =
    copyPulseKey > 0
      ? copyPulseKey % 2 === 1
        ? 'copy-card-shutter-a'
        : 'copy-card-shutter-b'
      : '';

  const copyTitle =
    copyStatus === 'copied'
      ? 'Copied!'
      : copyStatus === 'failed'
        ? 'Copy failed'
        : 'Copy question card';
  const editTitle = isEditing ? 'Save or cancel correction' : 'Correct this question';
  const imagesToggleText = areSourceImagesHidden ? 'Reference images' : 'Hide Images';
  const imagesToggleTitle = areSourceImagesHidden ? 'Show reference images' : 'Hide images';

  const realState = getRealKnowledgeState(questionStats);
  const pillModeKey: ForcedKnowledgeState | 'auto' = editingForcedState ?? 'auto';
  const pillVisualState: KnowledgeState = editingForcedState ?? realState;
  const pillColorClass = PILL_COLOR_CLASSES[pillVisualState];
  const pillTrackClass = PILL_TRACK_CLASSES[pillModeKey];
  const pillTitle = editingForcedState
    ? `Forced section: ${getKnowledgeLabel(editingForcedState)} — click to cycle`
    : `Auto section (${getKnowledgeLabel(realState)}) — click to cycle`;

  const activeSubject = editingQuestion?.subject ?? currentQuestion.subject;
  const activeQuestionId = editingQuestion?.id ?? currentQuestion.id;
  const { questionImage, answerKeyImage } = getQuestionSourceImages(
    activeSubject,
    activeQuestionId,
  );
  const hasSourceImages = Boolean(questionImage || answerKeyImage);
  const showSourceImages = isEditing && !areSourceImagesHidden && hasSourceImages;
  const showImagesToggle = isEditing && hasSourceImages;
  const optionCount = Math.max(
    editingQuestion?.options.length ?? currentQuestion.options.length,
    1,
  );

  useEffect(() => {
    if (questionImage) {
      void preloadSourceImage(questionImage);
    }
    if (answerKeyImage) {
      void preloadSourceImage(answerKeyImage);
    }
  }, [questionImage, answerKeyImage]);

  const computeEditFieldSizes = useCallback(() => {
    const shell = editShellRef.current;
    if (!shell) return;

    const shellHeight = shell.clientHeight;
    if (shellHeight <= 0) return;

    const rootFontSize =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const viewportHeight = window.innerHeight;
    const editGapPx = Math.min(
      Math.max(viewportHeight * 0.0115, 0.5 * rootFontSize),
      0.875 * rootFontSize,
    );
    const questionLabelOffset = Math.round(rootFontSize * 0.4375);
    const topInputGap = editGapPx + questionLabelOffset;
    const bottomGap = Math.round(topInputGap * 1.3);

    const spacerHeight = Math.round(rootFontSize * 1.75);
    const imagesHeight = areSourceImagesHidden ? 0 : (sourceImagesRef.current?.offsetHeight ?? 0);
    const toggleHeight = imagesToggleRef.current?.offsetHeight ?? 0;
    const sectionHeight = sectionOverrideRef.current?.offsetHeight ?? 0;
    const topReservedHeight =
      (hasSourceImages ? imagesHeight + toggleHeight : spacerHeight) + sectionHeight;

    const totalGapHeight = optionCount * editGapPx;
    const safetyBuffer = 4;
    const availableForFields =
      shellHeight -
      topReservedHeight -
      totalGapHeight -
      questionLabelOffset -
      bottomGap -
      safetyBuffer;

    const questionShare = 1.4;
    const totalShares = questionShare + optionCount;
    const questionHeight = Math.max(
      44,
      Math.floor((availableForFields * questionShare) / totalShares),
    );
    const optionHeight = Math.max(34, Math.floor(availableForFields / totalShares));

    setEditFieldSizes((prev) =>
      prev &&
      prev.questionHeight === questionHeight &&
      prev.optionHeight === optionHeight &&
      prev.bottomGap === bottomGap
        ? prev
        : { questionHeight, optionHeight, bottomGap },
    );
  }, [areSourceImagesHidden, hasSourceImages, optionCount]);

  useLayoutEffect(() => {
    computeEditFieldSizes();
    const shell = editShellRef.current;
    if (!shell || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(computeEditFieldSizes);
    observer.observe(shell);
    if (sourceImagesRef.current) {
      observer.observe(sourceImagesRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [computeEditFieldSizes, questionImage, answerKeyImage]);

  const updateEditScrollMetrics = useCallback(() => {
    const container = editScrollBodyRef.current;
    if (!container || !isEditing) {
      setIsEditScrolled(false);
      setEditScrollbarWidth(0);
      return;
    }
    const nextScrolled = container.scrollTop > 1;
    const nextScrollbarWidth = Math.max(0, container.offsetWidth - container.clientWidth);
    setIsEditScrolled((prev) => (prev !== nextScrolled ? nextScrolled : prev));
    setEditScrollbarWidth((prev) => (prev !== nextScrollbarWidth ? nextScrollbarWidth : prev));
  }, [isEditing]);

  useLayoutEffect(() => {
    const container = editScrollBodyRef.current;
    const content = editContentRef.current;
    if (!container || !isEditing) {
      setIsEditScrolled(false);
      setEditScrollbarWidth(0);
      return;
    }

    updateEditScrollMetrics();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateEditScrollMetrics);
    observer.observe(container);
    if (content) {
      observer.observe(content);
    }

    return () => {
      observer.disconnect();
    };
  }, [
    areSourceImagesHidden,
    activeQuestionId,
    activeSubject,
    isEditing,
    updateEditScrollMetrics,
  ]);

  const handleEditBodyScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const nextScrolled = el.scrollTop > 1;
    const nextScrollbarWidth = Math.max(0, el.offsetWidth - el.clientWidth);
    setIsEditScrolled((prev) => (prev !== nextScrolled ? nextScrolled : prev));
    setEditScrollbarWidth((prev) => (prev !== nextScrollbarWidth ? nextScrollbarWidth : prev));
  }, []);

  const questionValue =
    isEditing && editingQuestion ? editingQuestion.question : currentQuestion.question;

  const activeCustomQuestionHeight =
    isEditing && fieldCustomHeights.questionId === currentQuestion.id
      ? fieldCustomHeights.questionHeight
      : null;
  const activeCustomOptionHeights =
    isEditing && fieldCustomHeights.questionId === currentQuestion.id
      ? fieldCustomHeights.optionHeights
      : undefined;

  const handleResizeQuestionField = useCallback(
    (nextHeight: number | null) => {
      setFieldCustomHeights((prev) => ({
        questionId: currentQuestion.id,
        questionHeight: nextHeight,
        optionHeights: prev.questionId === currentQuestion.id ? prev.optionHeights : {},
      }));
    },
    [currentQuestion.id],
  );

  const handleResizeOptionField = useCallback(
    (label: string, nextHeight: number | null) => {
      setFieldCustomHeights((prev) => {
        const baseOptions = prev.questionId === currentQuestion.id ? prev.optionHeights : {};
        const nextOptions = { ...baseOptions };
        if (nextHeight === null) {
          delete nextOptions[label];
        } else {
          nextOptions[label] = nextHeight;
        }
        return {
          questionId: currentQuestion.id,
          questionHeight: prev.questionId === currentQuestion.id ? prev.questionHeight : null,
          optionHeights: nextOptions,
        };
      });
    },
    [currentQuestion.id],
  );

  const shellStyle = {
    ...(editFieldSizes
      ? {
          '--edit-question-height': `${editFieldSizes.questionHeight}px`,
          '--edit-option-height': `${editFieldSizes.optionHeight}px`,
          '--edit-bottom-gap': `${editFieldSizes.bottomGap}px`,
        }
      : {}),
    ...(editScrollbarWidth > 0 ? { '--card-scrollbar-w': `${editScrollbarWidth}px` } : {}),
  } as CSSProperties;

  return (
    <div
      className={`question-card relative flex h-[calc(100dvh-9.5rem)] min-h-0 min-w-0 flex-col rounded-xl sm:h-[calc(100dvh-8.75rem)] lg:h-auto lg:flex-1 ${
        isEditing ? 'question-card-editing' : ''
      } ${shutterClass}`}
    >
      {copyPulseKey > 0 && (
        <div
          key={`flash-${copyPulseKey}`}
          className="copy-card-flash pointer-events-none absolute inset-0 rounded-xl"
          aria-hidden="true"
        />
      )}

      <div className="question-card-actions">
        <IconButton
          onClick={onCopy}
          title={copyTitle}
          ariaLabel={copyTitle}
          isActive={copyStatus === 'copied'}
          activeTone="copy"
        >
          <CopyIcon />
        </IconButton>
        <IconButton
          onClick={onToggleEdit}
          title={editTitle}
          ariaLabel={editTitle}
          ariaPressed={isEditing}
          isActive={isEditing}
          activeTone="edit"
        >
          <EditIcon />
        </IconButton>
      </div>

      <div
        ref={editShellRef}
        style={shellStyle}
        className="relative flex min-h-0 flex-1 flex-col"
      >
        <div
          ref={editScrollBodyRef}
          onScroll={isEditing ? handleEditBodyScroll : undefined}
          className={`relative flex min-h-0 flex-1 flex-col ${
            isEditing ? 'question-card-body-editing' : 'question-card-body'
          }`}
        >
          <div
            className={`edit-actions-spacer shrink-0 ${
              isEditing && !hasSourceImages ? 'edit-actions-spacer-open' : ''
            }`}
            aria-hidden="true"
          >
            <div className="edit-actions-spacer-inner">
              <div className="h-7" />
            </div>
          </div>

          <div
            ref={editContentRef}
            key={currentSubject}
            className={`flex flex-1 flex-col ${
              isEditing ? 'shrink-0' : 'min-h-0'
            } ${subjectEnterClass}`}
          >
            {/* Source images morphing drawer */}
            <div
              className={`edit-source-drawer shrink-0 ${
                showSourceImages ? 'edit-source-drawer-open' : ''
              }`}
              inert={!showSourceImages}
              aria-hidden={!showSourceImages}
            >
              <div className="edit-source-drawer-inner">
                {hasSourceImages && (
                  <div ref={sourceImagesRef} className="edit-source-images">
                    <div className="edit-source-grid">
                      {questionImage && (
                        <div className="edit-source-col-question">
                          <SourceImageSlot
                            key={questionImage}
                            src={questionImage}
                            alt="Original question source"
                            variant="question"
                            placeholderLabel="Loading question image..."
                          />
                        </div>
                      )}
                      {answerKeyImage && (
                        <div className="edit-source-col-key">
                          <SourceImageSlot
                            key={answerKeyImage}
                            src={answerKeyImage}
                            alt="Original answer key source"
                            variant="key"
                            placeholderLabel="Loading answer key..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boxless divider label + collapse / expand arrow under source images */}
            <div
              className={`edit-images-toggle-drawer shrink-0 ${
                showImagesToggle ? 'edit-images-toggle-drawer-open' : ''
              }`}
              inert={!showImagesToggle}
              aria-hidden={!showImagesToggle}
            >
              <div className="edit-images-toggle-drawer-inner">
                {hasSourceImages && (
                  <div
                    ref={imagesToggleRef}
                    className={`edit-images-toggle-row ${
                      areSourceImagesHidden ? 'edit-images-toggle-row-collapsed' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setAreSourceImagesHidden((prev) => !prev)}
                      disabled={!showImagesToggle}
                      tabIndex={showImagesToggle ? 0 : -1}
                      title={imagesToggleTitle}
                      aria-label={imagesToggleTitle}
                      aria-expanded={!areSourceImagesHidden}
                      className="edit-images-toggle-btn"
                    >
                      <span className="edit-images-toggle-divider">
                        <span className="edit-images-toggle-label">{imagesToggleText}</span>
                      </span>
                      <span
                        className={`edit-images-toggle-chevron ${
                          areSourceImagesHidden ? '' : 'edit-images-toggle-chevron-expanded'
                        }`}
                        aria-hidden="true"
                      >
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 4-state section override pill above the Question label */}
            <div
              className={`edit-section-drawer shrink-0 ${
                isEditing ? 'edit-section-drawer-open' : ''
              }`}
              inert={!isEditing}
              aria-hidden={!isEditing}
            >
              <div className="edit-section-drawer-inner">
                <div ref={sectionOverrideRef} className="edit-section-bar">
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="edit-section-label">Section:</span>
                    <button
                      type="button"
                      onClick={onCycleEditingForcedState}
                      tabIndex={isEditing ? 0 : -1}
                      title={pillTitle}
                      aria-label={pillTitle}
                      className={`section-pill-btn ${pillColorClass}`}
                    >
                      <span className={`section-pill-track ${pillTrackClass}`}>
                        <span className="section-pill-item" aria-hidden={pillModeKey !== 'auto'}>
                          auto
                        </span>
                        <span className="section-pill-item" aria-hidden={pillModeKey !== 'knows'}>
                          <CheckIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                        </span>
                        <span className="section-pill-item" aria-hidden={pillModeKey !== 'almost'}>
                          <AlmostIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
                        </span>
                        <span
                          className="section-pill-item"
                          aria-hidden={pillModeKey !== 'doesnt-know'}
                        >
                          <CloseIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Question title morphing into editable question box with integrated border label */}
            <div className="question-morph-section">
              <div
                style={
                  activeCustomQuestionHeight !== null
                    ? { minHeight: `${activeCustomQuestionHeight}px` }
                    : undefined
                }
                className={`question-title-morph ${
                  isEditing ? 'question-title-morph-editing' : ''
                }`}
              >
                <span
                  className={`question-border-label ${
                    isEditing ? 'question-border-label-visible' : ''
                  }`}
                  aria-hidden={!isEditing}
                >
                  Question
                </span>

                {isEditing ? (
                  <>
                    <textarea
                      name="edit-question-text"
                      lang="sk"
                      spellCheck={false}
                      value={questionValue}
                      onChange={(event) => onChangeQuestionText(event.target.value)}
                      aria-label="Question"
                      rows={1}
                      className="question-title-textarea"
                    />
                    {editDiff.isQuestionTextEdited && (
                      <span
                        className="edit-element-icon edit-element-icon-field"
                        title="Question text was edited"
                        aria-label="Question text was edited"
                      >
                        <ModifiedIcon className="h-3 w-3" />
                      </span>
                    )}
                    <FieldResizeHandle
                      ariaLabel="Resize question field"
                      onResize={handleResizeQuestionField}
                      onReset={() => handleResizeQuestionField(null)}
                    />
                  </>
                ) : (
                  <h2 lang="sk" className="question-title-heading">{questionValue}</h2>
                )}
              </div>
            </div>

            {/* Options list morphing into editable answer rows */}
            <QuestionOptionList
              key={currentQuestion.id}
              options={displayedOptions}
              allOptions={orderedOptions}
              selectedLabels={selectedLabels}
              isEvaluated={isEvaluated}
              onToggleOption={onToggleOption}
              isEditing={isEditing}
              editingOptions={editingQuestion?.options ?? null}
              editDiff={editDiff}
              onToggleOptionCorrect={onToggleOptionCorrect}
              onChangeOptionText={onChangeOptionText}
              customOptionHeights={activeCustomOptionHeights}
              onResizeOptionField={handleResizeOptionField}
            />

            {editError && (
              <p
                role="alert"
                className="edit-error-banner mt-4 shrink-0 rounded-lg border border-rose-500/40 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
              >
                {editError}
              </p>
            )}
          </div>

          {copyPulseKey > 0 && !isEditing && (
            <div
              key={`ghost-${copyPulseKey}`}
              className="copy-ghost-layer pointer-events-none absolute inset-0 flex flex-col select-none overflow-hidden"
              aria-hidden="true"
            >
              <div className="question-morph-section">
                <div className="question-title-morph">
                  <div lang="sk" className="question-title-heading">{currentQuestion.question}</div>
                </div>
              </div>

              <QuestionOptionList
                options={displayedOptions}
                allOptions={orderedOptions}
                selectedLabels={selectedLabels}
                isEvaluated={isEvaluated}
                isGhost
              />
            </div>
          )}
        </div>

        {isEditing && isEditScrolled && (
          <div
            className="scroll-window-corners scroll-window-corners-card scroll-window-corners-top"
            aria-hidden="true"
          />
        )}
      </div>

      <QuestionNavigation
        isEditing={isEditing}
        onResetCorrection={onResetCorrection}
        onCancelCorrection={onCancelCorrection}
        onSaveCorrection={onSaveCorrection}
        onPrev={onPrev}
        isPrevDisabled={isPrevDisabled}
        onNext={onNext}
        isNextDisabled={isNextDisabled}
        isEvaluated={isEvaluated}
        onCheckAnswer={onCheckAnswer}
        onTryAgain={onTryAgain}
      />
    </div>
  );
});
