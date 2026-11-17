import { memo } from 'react';
import type { Subject } from '../../types.ts';

interface SubjectSelectorProps {
  currentSubject: Subject;
  questionCounts: Record<Subject, number>;
  onSelectSubject: (subject: Subject) => void;
}

const SUBJECTS: Subject[] = ['Biology', 'Chemistry'];

export const SubjectSelector = memo(function SubjectSelector({
  currentSubject,
  questionCounts,
  onSelectSubject,
}: SubjectSelectorProps) {
  return (
    <div className="subject-selector flex w-full flex-wrap">
      {SUBJECTS.map((subject) => {
        const isSelected = currentSubject === subject;
        return (
          <button
            key={subject}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectSubject(subject)}
            className={`min-w-[9rem] flex-1 cursor-pointer rounded-lg border text-base font-semibold transition-colors duration-150 ${
              isSelected
                ? 'border-transparent bg-blue-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 shadow-2xs hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {subject} ({questionCounts[subject] ?? 0})
          </button>
        );
      })}
    </div>
  );
});
