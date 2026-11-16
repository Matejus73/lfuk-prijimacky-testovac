import { memo, useMemo } from 'react';
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

interface HistoryListProps {
  items: Array<{ question: Question; index: number }>;
  stats: AllStats;
  currentSubject: Subject;
  currentQuestionId: string;
  expandedHistoryIds: Set<string>;
  onToggleExpandHistory: (id: string) => void;
  onSelectQuestionByIndex: (index: number) => void;
}

const HistoryList = memo(
  function HistoryList({
    items,
    stats,
    currentSubject,
    currentQuestionId,
    expandedHistoryIds,
    onToggleExpandHistory,
    onSelectQuestionByIndex,
  }: HistoryListProps) {
    return (
      <div className="history-list min-h-0 max-h-[70vh] space-y-2 overflow-y-auto pr-2 lg:flex-1 lg:max-h-none">
        {items.map(({ question, index }) => {
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
              onSelect={onSelectQuestionByIndex}
              onToggleExpand={onToggleExpandHistory}
            />
          );
        })}
      </div>
    );
  },
  (prev, next) =>
    prev.items === next.items &&
    prev.stats === next.stats &&
    prev.currentSubject === next.currentSubject &&
    prev.currentQuestionId === next.currentQuestionId &&
    prev.expandedHistoryIds === next.expandedHistoryIds,
);

export const QuestionHistory = memo(function QuestionHistory({
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

  const filteredHistoryQuestions = useMemo(() => {
    const normalizedSearch = historySearch.trim().toLocaleLowerCase();
    return activeQuestions
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
  }, [activeQuestions, currentSubject, historySearch, historySort, stats]);

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

      <HistoryList
        items={filteredHistoryQuestions}
        stats={stats}
        currentSubject={currentSubject}
        currentQuestionId={currentQuestionId}
        expandedHistoryIds={expandedHistoryIds}
        onToggleExpandHistory={onToggleExpandHistory}
        onSelectQuestionByIndex={onSelectQuestionByIndex}
      />
    </div>
  );
});
