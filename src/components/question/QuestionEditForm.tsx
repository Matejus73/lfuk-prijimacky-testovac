import type { EditableQuestion } from '../../types.ts';

const sourceImages = import.meta.glob('../../data/Original data/*/*.jpg', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

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
  const imagePrefix = editingQuestion.subject === 'Biology' ? 'BIO' : 'CHEM';
  const questionNumber = editingQuestion.id.split('_')[1]?.padStart(4, '0');
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

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
      <div className="edit-source-images mb-4 rounded-lg border border-gray-200 bg-gray-50 p-2">
        <div className="grid gap-3 sm:grid-cols-2">
          {questionImage && (
            <figure className="min-w-0">
              <a href={questionImage} target="_blank" rel="noreferrer">
                <img
                  src={questionImage}
                  alt="Original question source"
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
                  className="edit-source-image"
                />
              </a>
            </figure>
          )}
        </div>
      </div>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold text-gray-700">Question</span>
        <textarea
          value={editingQuestion.question}
          onChange={(event) => onChangeQuestionText(event.target.value)}
          rows={2}
          className="edit-question-input w-full rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <fieldset className="space-y-2">
        {editingQuestion.options.map((option, optionIndex) => (
          <div key={option.label} className="flex items-start gap-2">
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
              className="edit-option-input min-w-0 flex-1 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
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
