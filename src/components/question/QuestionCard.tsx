import type { EditableQuestion, Option, Question } from '../../types.ts';
import { QuestionEditForm } from './QuestionEditForm.tsx';
import { QuestionNavigation } from './QuestionNavigation.tsx';
import { QuestionOptionList } from './QuestionOptionList.tsx';

interface QuestionCardProps {
  currentQuestion: Question;
  displayedOptions: Option[];
  selectedLabels: string[];
  isEvaluated: boolean;
  onToggleOption: (label: string) => void;
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
}

export function QuestionCard({
  currentQuestion,
  displayedOptions,
  selectedLabels,
  isEvaluated,
  onToggleOption,
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
}: QuestionCardProps) {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-0 min-w-0 flex-col rounded-xl bg-white p-4 shadow-md sm:p-6 lg:h-auto lg:flex-1">
      {editingQuestion ? (
        <QuestionEditForm
          editingQuestion={editingQuestion}
          onChangeQuestionText={onChangeQuestionText}
          onToggleOptionCorrect={onToggleOptionCorrect}
          onChangeOptionText={onChangeOptionText}
          editError={editError}
        />
      ) : (
        <>
          <h2 className="mb-6 text-lg font-bold text-gray-900">
            {currentQuestion.question}
          </h2>

          <QuestionOptionList
            options={displayedOptions}
            selectedLabels={selectedLabels}
            isEvaluated={isEvaluated}
            onToggleOption={onToggleOption}
          />
        </>
      )}

      <QuestionNavigation
        isEditing={Boolean(editingQuestion)}
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
