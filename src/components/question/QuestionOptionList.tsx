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
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      {options.map((option) => {
        const isChecked = selectedLabels.includes(option.label);

        let borderClass = 'border-gray-200 hover:border-blue-400';
        let bgClass = 'bg-white';

        if (isEvaluated) {
          if (option.is_correct) {
            borderClass = 'border-emerald-500';
            bgClass = 'bg-emerald-50 text-emerald-900';
          } else if (isChecked && !option.is_correct) {
            borderClass = 'border-rose-500';
            bgClass = 'bg-rose-50 text-rose-900';
          }
        } else if (isChecked) {
          borderClass = 'border-blue-500';
          bgClass = 'bg-blue-50';
        }

        return (
          <label
            key={option.label}
            className={`flex cursor-pointer items-start rounded-lg border-2 p-3.5 transition ${borderClass} ${bgClass}`}
          >
            <input
              type="checkbox"
              disabled={isEvaluated}
              checked={isChecked}
              onChange={() => onToggleOption(option.label)}
              className="mt-1 h-4 w-4 cursor-pointer rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-3 font-semibold uppercase text-gray-700">
              {option.label})
            </span>
            <span className="ml-2 leading-snug text-gray-800">
              {option.text}
            </span>
          </label>
        );
      })}
    </div>
  );
}
