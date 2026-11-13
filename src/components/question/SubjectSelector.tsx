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
    <div className="mb-4 flex w-full flex-wrap gap-2">
      {SUBJECTS.map((subject) => {
        const isSelected = currentSubject === subject;
        return (
          <button
            key={subject}
            type="button"
            onClick={() => onSelectSubject(subject)}
            className={`min-w-[9rem] flex-1 rounded-lg py-3 text-base font-semibold transition ${
              isSelected
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {subject} ({questionCounts[subject] ?? 0})
          </button>
        );
      })}
    </div>
  );
}
