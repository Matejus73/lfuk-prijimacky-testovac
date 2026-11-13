import type { EditableQuestion } from '../../types.ts';

interface QuestionEditFormProps {
  editingQuestion: EditableQuestion;
  onChangeQuestionText: (text: string) => void;
  onToggleOptionCorrect: (index: number, isCorrect: boolean) => void;
  onChangeOptionText: (index: number, text: string) => void;
  editError: string;
}

export function QuestionEditForm({
  editingQuestion,
  onChangeQuestionText,
  onToggleOptionCorrect,
  onChangeOptionText,
  editError,
}: QuestionEditFormProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <label className="mb-5 block">
        <span className="mb-1 block text-sm font-semibold text-gray-700">Question</span>
        <textarea
          value={editingQuestion.question}
          onChange={(event) => onChangeQuestionText(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <fieldset className="space-y-3">
        {editingQuestion.options.map((option, optionIndex) => (
          <div key={option.label} className="flex items-start gap-3">
            <label className="mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={option.is_correct}
                onChange={(event) => onToggleOptionCorrect(optionIndex, event.target.checked)}
                aria-label={`Mark answer ${option.label} as correct`}
                className="edit-answer-checkbox"
              />
              <span className="edit-answer-mark" aria-hidden="true">
                {option.is_correct ? '✓' : '×'}
              </span>
            </label>

            <span className="mt-1.5 w-5 font-semibold uppercase text-gray-700">
              {option.label})
            </span>

            <textarea
              value={option.text}
              onChange={(event) => onChangeOptionText(optionIndex, event.target.value)}
              rows={2}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        ))}
      </fieldset>

      {editError && (
        <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
          {editError}
        </p>
      )}
    </div>
  );
}
