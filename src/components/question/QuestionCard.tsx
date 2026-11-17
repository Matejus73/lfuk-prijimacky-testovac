import { memo, useEffect } from 'react';
import type { EditableQuestion, Option, Question } from '../../types.ts';
import {
  getQuestionSourceImages,
  preloadSourceImage,
} from '../../utils/sourceImageUtils.ts';
import { QuestionNavigation } from './QuestionNavigation.tsx';
import { QuestionOptionList } from './QuestionOptionList.tsx';
import { SourceImageSlot } from './SourceImageSlot.tsx';

interface QuestionCardProps {
  currentQuestion: Question;
  displayedOptions: Option[];
  selectedLabels: string[];
  isEvaluated: boolean;
  onToggleOption: (label: string) => void;
  isEditing: boolean;
  editingQuestion: EditableQuestion | null;
  onChangeQuestionText: (text: string) => void;
  onToggleOptionCorrect: (index: number, isCorrect: boolean) => void;
  onChangeOptionText: (index: number, text: string) => void;
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

export const QuestionCard = memo(function QuestionCard({
  currentQuestion,
  displayedOptions,
  selectedLabels,
  isEvaluated,
  onToggleOption,
  isEditing,
  editingQuestion,
  onChangeQuestionText,
  onToggleOptionCorrect,
  onChangeOptionText,
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
  const shutterClass =
    copyPulseKey > 0
      ? copyPulseKey % 2 === 1
        ? 'copy-card-shutter-a'
        : 'copy-card-shutter-b'
      : '';

  const activeSubject = editingQuestion?.subject ?? currentQuestion.subject;
  const activeQuestionId = editingQuestion?.id ?? currentQuestion.id;
  const { questionImage, answerKeyImage } = getQuestionSourceImages(
    activeSubject,
    activeQuestionId,
  );
  const currentImages = getQuestionSourceImages(
    currentQuestion.subject,
    currentQuestion.id,
  );

  useEffect(() => {
    if (currentImages.questionImage) {
      void preloadSourceImage(currentImages.questionImage);
    }
    if (currentImages.answerKeyImage) {
      void preloadSourceImage(currentImages.answerKeyImage);
    }
  }, [currentImages.questionImage, currentImages.answerKeyImage]);

  const questionValue =
    isEditing && editingQuestion ? editingQuestion.question : currentQuestion.question;

  return (
    <div
      className={`question-card relative flex h-[calc(100dvh-8rem)] min-h-0 min-w-0 flex-col rounded-xl bg-white shadow-md lg:h-auto lg:flex-1 ${
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

      <div
        className={`relative flex min-h-0 flex-1 flex-col ${
          isEditing ? 'question-card-body-editing' : ''
        }`}
      >
        {/* Source images morphing drawer */}
        <div
          className={`edit-source-drawer ${isEditing ? 'edit-source-drawer-open' : ''}`}
          inert={!isEditing}
          aria-hidden={!isEditing}
        >
          <div className="edit-source-drawer-inner">
            {editingQuestion && (questionImage || answerKeyImage) && (
              <div className="edit-source-images mb-4 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                <div className="grid items-start gap-3 sm:grid-cols-2">
                  {questionImage && (
                    <SourceImageSlot
                      key={questionImage}
                      src={questionImage}
                      alt="Original question source"
                      variant="question"
                      placeholderLabel="Loading question image..."
                    />
                  )}
                  {answerKeyImage && (
                    <SourceImageSlot
                      key={answerKeyImage}
                      src={answerKeyImage}
                      alt="Original answer key source"
                      variant="key"
                      placeholderLabel="Loading answer key..."
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question title morphing into editable question box */}
        <div className="question-morph-section">
          <div
            className={`edit-label-drawer ${isEditing ? 'edit-label-drawer-open' : ''}`}
            aria-hidden={!isEditing}
          >
            <div className="edit-label-drawer-inner">
              <span className="mb-1 block text-sm font-semibold text-gray-700">
                Question
              </span>
            </div>
          </div>

          <div
            className={`question-title-morph ${
              isEditing ? 'question-title-morph-editing' : ''
            }`}
          >
            {isEditing ? (
              <textarea
                name="edit-question-text"
                value={questionValue}
                onChange={(event) => onChangeQuestionText(event.target.value)}
                aria-label="Question"
                rows={2}
                className="question-title-textarea"
              />
            ) : (
              <h2 className="question-title-heading">{questionValue}</h2>
            )}
          </div>
        </div>

        {/* Options list morphing into editable answer rows */}
        <QuestionOptionList
          key={currentQuestion.id}
          options={displayedOptions}
          allOptions={currentQuestion.options}
          selectedLabels={selectedLabels}
          isEvaluated={isEvaluated}
          onToggleOption={onToggleOption}
          isEditing={isEditing}
          editingOptions={editingQuestion?.options ?? null}
          onToggleOptionCorrect={onToggleOptionCorrect}
          onChangeOptionText={onChangeOptionText}
        />

        {editError && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-rose-500/40 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
          >
            {editError}
          </p>
        )}

        {copyPulseKey > 0 && !isEditing && (
          <div
            key={`ghost-${copyPulseKey}`}
            className="copy-ghost-layer pointer-events-none absolute inset-0 flex flex-col select-none overflow-hidden"
            aria-hidden="true"
          >
            <div className="question-morph-section">
              <div className="question-title-morph">
                <div className="question-title-heading">{currentQuestion.question}</div>
              </div>
            </div>

            <QuestionOptionList
              options={displayedOptions}
              allOptions={currentQuestion.options}
              selectedLabels={selectedLabels}
              isEvaluated={isEvaluated}
              isGhost
            />
          </div>
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
