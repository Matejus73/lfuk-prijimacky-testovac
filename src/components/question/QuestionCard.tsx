import type { EditableQuestion, Option, Question } from '../../types.ts';
import { QuestionNavigation } from './QuestionNavigation.tsx';
import { QuestionOptionList } from './QuestionOptionList.tsx';

const sourceImages = import.meta.glob('../../data/Original data/*/*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

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

export function QuestionCard({
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
  const imagePrefix = activeSubject === 'Biology' ? 'BIO' : 'CHEM';
  const questionNumber = activeQuestionId.split('_')[1]?.padStart(4, '0');
  const questionImage =
    questionNumber &&
    sourceImages[
      `../../data/Original data/${imagePrefix}_q/${imagePrefix}_${questionNumber}_question.jpg`
    ];
  const answerKeyImage =
    questionNumber &&
    sourceImages[
      `../../data/Original data/${imagePrefix}_a/${imagePrefix}_${questionNumber}_key.jpg`
    ];

  const questionValue = isEditing && editingQuestion
    ? editingQuestion.question
    : currentQuestion.question;

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
          isEditing ? 'overflow-y-auto pr-3' : ''
        }`}
      >
        {/* Source images morphing drawer */}
        <div
          className={`edit-source-drawer ${
            isEditing ? 'edit-source-drawer-open' : ''
          }`}
          inert={!isEditing}
          aria-hidden={!isEditing}
        >
          <div className="edit-source-drawer-inner">
            {editingQuestion && (
              <div className="edit-source-images mb-4 rounded-lg border border-gray-200 bg-gray-50 p-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  {questionImage && (
                    <figure className="min-w-0">
                      <a href={questionImage} target="_blank" rel="noreferrer">
                        <img
                          src={questionImage}
                          alt="Original question source"
                          decoding="async"
                          className="edit-source-image"
                        />
                      </a>
                    </figure>
                  )}
                  {answerKeyImage && (
                    <figure className="min-w-0">
                      <a href={answerKeyImage} target="_blank" rel="noreferrer">
                        <img
                          src={answerKeyImage}
                          alt="Original answer key source"
                          decoding="async"
                          className="edit-source-image"
                        />
                      </a>
                    </figure>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Question title morphing into editable question box */}
        <div className="question-morph-section">
          <div
            className={`edit-label-drawer ${
              isEditing ? 'edit-label-drawer-open' : ''
            }`}
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
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
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
            <div className="question-card-title text-lg font-bold text-gray-900">
              {currentQuestion.question}
            </div>

            <div className="question-option-list min-h-0 flex-1 overflow-hidden pr-1">
              {displayedOptions.map((option) => {
                const isChecked = selectedLabels.includes(option.label);

                let borderClass = 'border-gray-200';
                let bgClass = 'bg-white';

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

                return (
                  <div
                    key={option.label}
                    className={`question-option flex items-start rounded-lg border-2 ${borderClass} ${bgClass}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      tabIndex={-1}
                      className="circle-checkbox mt-1"
                    />
                    <span
                      className={`ml-3 shrink-0 font-semibold uppercase ${
                        isChecked ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {option.label})
                    </span>
                    <span className="question-option-text ml-2 min-w-0 leading-snug text-gray-800">
                      {option.text}
                    </span>
                  </div>
                );
              })}
            </div>
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
}
