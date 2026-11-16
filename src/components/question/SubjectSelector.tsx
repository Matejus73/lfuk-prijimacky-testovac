import type { Subject } from '../../types.ts';

interface SubjectSelectorProps {
  currentSubject: Subject;
  questionCounts: Record<Subject, number>;
  onSelectSubject: (subject: Subject) => void;
}

const SUBJECTS: Subject[] = ['Biology', 'Chemistry'];

export function SubjectSelector({
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
            onClick={() => onSelectSubject(subject)}
            className={`min-w-[9rem] flex-1 cursor-pointer rounded-lg text-base font-semibold shadow-xs transition-colors duration-150 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                : 'border bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {subject} ({questionCounts[subject] ?? 0})
          </button>
        );
      })}
    </div>
  );
}
