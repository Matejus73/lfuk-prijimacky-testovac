import type { AllStats, HistorySort, Question, Subject } from '../../types.ts';
import { getQuestionStats } from '../../utils/questionUtils.ts';
import { AccuracyProgressBar } from '../stats/AccuracyProgressBar.tsx';
import { StatsOverview } from '../stats/StatsOverview.tsx';
import { HistoryItem } from './HistoryItem.tsx';
import { HistorySearchAndSort } from './HistorySearchAndSort.tsx';

interface QuestionHistoryProps {
  activeQuestions: Question[];
  stats: AllStats;
  currentSubject: Subject;
  currentQuestionId: string;
  answeredQuestionsCount: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  totalAttempts: number;
  correctPercentage: number;
  incorrectPercentage: number;
  historySearch: string;
  onHistorySearchChange: (value: string) => void;
  historySort: HistorySort;
  onHistorySortChange: (sort: HistorySort) => void;
  expandedHistoryIds: Set<string>;
  onToggleExpandHistory: (id: string) => void;
  onSelectQuestionByIndex: (index: number) => void;
}

export function QuestionHistory({
  activeQuestions,
  stats,
  currentSubject,
  currentQuestionId,
  answeredQuestionsCount,
  correctAnswersCount,
  incorrectAnswersCount,
  totalAttempts,
  correctPercentage,
  incorrectPercentage,
  historySearch,
  onHistorySearchChange,
  historySort,
  onHistorySortChange,
  expandedHistoryIds,
  onToggleExpandHistory,
  onSelectQuestionByIndex,
}: QuestionHistoryProps) {
  const unansweredCount = activeQuestions.length - answeredQuestionsCount;
  const normalizedSearch = historySearch.trim().toLocaleLowerCase();

  const filteredHistoryQuestions = activeQuestions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) =>
      `${question.id} ${question.question}`.toLocaleLowerCase().includes(normalizedSearch),
    )
    .sort((left, right) => {
      const leftStats = getQuestionStats(stats, currentSubject, left.question.id);
      const rightStats = getQuestionStats(stats, currentSubject, right.question.id);

      if (historySort === 'most-wrong') {
        return (rightStats?.incorrect ?? 0) - (leftStats?.incorrect ?? 0);
      }
      if (historySort === 'most-correct') {
        return (rightStats?.correct ?? 0) - (leftStats?.correct ?? 0);
      }

      const questionOrder = left.index - right.index;
      return historySort === 'ascending' ? questionOrder : -questionOrder;
    });

  return (
    <div className="min-h-0 min-w-0 rounded-xl bg-white p-4 shadow-md sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <StatsOverview
        unansweredCount={unansweredCount}
        correctCount={correctAnswersCount}
        incorrectCount={incorrectAnswersCount}
      />

      <AccuracyProgressBar
        totalAttempts={totalAttempts}
        correctPercentage={correctPercentage}
        incorrectPercentage={incorrectPercentage}
      />

      <HistorySearchAndSort
        searchQuery={historySearch}
        onSearchChange={onHistorySearchChange}
        sortOption={historySort}
        onSortChange={onHistorySortChange}
      />

      <div className="min-h-0 max-h-[70vh] space-y-2 overflow-y-auto pr-2 lg:flex-1 lg:max-h-none">
        {filteredHistoryQuestions.map(({ question, index }) => {
          const questionStats = getQuestionStats(stats, currentSubject, question.id);
          const isCurrent = question.id === currentQuestionId;
          const isExpanded = expandedHistoryIds.has(question.id);

          return (
            <HistoryItem
              key={question.id}
              question={question}
              index={index}
              questionStats={questionStats}
              isCurrent={isCurrent}
              isExpanded={isExpanded}
              onSelect={() => onSelectQuestionByIndex(index)}
              onToggleExpand={() => onToggleExpandHistory(question.id)}
            />
          );
        })}

        {filteredHistoryQuestions.length === 0 && (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
            No questions match “{historySearch}”.
          </p>
        )}
      </div>
    </div>
  );
}
