import type { Option } from '../../types.ts';

interface QuestionOptionListProps {
  options: Option[];
  selectedLabels: string[];
  isEvaluated: boolean;
  onToggleOption: (label: string) => void;
}

export function QuestionOptionList({
  options,
  selectedLabels,
  isEvaluated,
  onToggleOption,
}: QuestionOptionListProps) {
  return (
    <div className="question-option-list min-h-0 flex-1 overflow-y-auto pr-1">
      {options.map((option) => {
        const isChecked = selectedLabels.includes(option.label);

        let borderClass = 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/20';
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
          <label
            key={option.label}
            className={`question-option flex cursor-pointer select-none items-start rounded-lg border-2 shadow-2xs transition-colors duration-150 ${borderClass} ${bgClass}`}
          >
            <input
              type="checkbox"
              disabled={isEvaluated}
              checked={isChecked}
              onChange={() => onToggleOption(option.label)}
              className="mt-1 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
            />
            <span
              className={`ml-3 shrink-0 font-semibold uppercase transition-colors duration-150 ${
                isChecked ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {option.label})
            </span>
            <span className="question-option-text ml-2 min-w-0 leading-snug text-gray-800 transition-colors duration-150">
              {option.text}
            </span>
          </label>
        );
      })}
    </div>
  );
}
