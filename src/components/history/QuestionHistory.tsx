import {
  memo,
  useCallback,
  useDeferredValue,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { AllStats, HistorySort, Question, Subject } from '../../types.ts';
import { getQuestionStats } from '../../utils/questionUtils.ts';
import { compareByKnowledge, type KnowledgeSummary } from '../../utils/scoringUtils.ts';
import {
  loadStoredStatsCollapsed,
  saveStoredStatsCollapsed,
} from '../../utils/storageUtils.ts';
import { ChevronDownIcon } from '../common/Icons.tsx';
import { AccuracyProgressBar } from '../stats/AccuracyProgressBar.tsx';
import { StatsDetails } from '../stats/StatsDetails.tsx';
import { HistoryItem } from './HistoryItem.tsx';
import { HistorySearchAndSort } from './HistorySearchAndSort.tsx';

interface QuestionHistoryProps {
  activeQuestions: Question[];
  stats: AllStats;
  currentSubject: Subject;
  currentQuestionId: string;
  knowledgeSummary: KnowledgeSummary;
  historySearch: string;
  onHistorySearchChange: (value: string) => void;
  historySort: HistorySort;
  onHistorySortChange: (sort: HistorySort) => void;
  expandedHistoryIds: Set<string>;
  onToggleExpandHistory: (id: string) => void;
  onSelectQuestionByIndex: (index: number) => void;
}

interface HistoryEntry {
  question: Question;
  index: number;
}

interface HistoryListProps {
  items: HistoryEntry[];
  searchQuery: string;
  stats: AllStats;
  currentSubject: Subject;
  currentQuestionId: string;
  expandedHistoryIds: Set<string>;
  onToggleExpandHistory: (id: string) => void;
  onSelectQuestionByIndex: (index: number) => void;
  measuredHeights: ReadonlyMap<string, number>;
  onMeasureHeights: (updates: Array<[string, number]>) => void;
  isStaleFilter: boolean;
  enterClass: string;
}

const SUBJECT_ORDER: Record<Subject, number> = {
  Biology: 0,
  Chemistry: 1,
};

const DEFAULT_COLLAPSED_HEIGHT = 68;
const DEFAULT_EXPANDED_HEIGHT = 328;
const OVERSCAN_PX = 360;

const searchTextCache = new WeakMap<Question, string>();

const getQuestionSearchText = (question: Question): string => {
  let cached = searchTextCache.get(question);
  if (cached === undefined) {
    cached = `${question.id} ${question.question}`.toLocaleLowerCase();
    searchTextCache.set(question, cached);
  }
  return cached;
};

const findStartIndex = (offsets: Float64Array, count: number, minTop: number): number => {
  let low = 0;
  let high = count;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (offsets[mid + 1] <= minTop) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};

const findEndIndex = (
  offsets: Float64Array,
  count: number,
  startIndex: number,
  maxBottom: number,
): number => {
  let low = startIndex;
  let high = count;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (offsets[mid] < maxBottom) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};

const HistoryList = memo(
  function HistoryList({
    items,
    searchQuery,
    stats,
    currentSubject,
    currentQuestionId,
    expandedHistoryIds,
    onToggleExpandHistory,
    onSelectQuestionByIndex,
    measuredHeights,
    onMeasureHeights,
    isStaleFilter,
    enterClass,
  }: HistoryListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewportHeight, setViewportHeight] = useState(640);
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollbarWidth, setScrollbarWidth] = useState(0);
    const rowObserverRef = useRef<ResizeObserver | null>(null);
    const observedNodesRef = useRef<WeakSet<HTMLElement>>(new WeakSet());
    const rafMeasureRef = useRef<number | null>(null);
    const pendingUpdatesRef = useRef<Map<string, number>>(new Map());

    useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container || typeof ResizeObserver === 'undefined') return;

      const updateViewport = () => {
        const nextHeight = container.clientHeight;
        const nextScrollbarWidth = Math.max(0, container.offsetWidth - container.clientWidth);
        if (nextHeight > 0) {
          setViewportHeight((prev) => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
        }
        setScrollbarWidth((prev) =>
          prev !== nextScrollbarWidth ? nextScrollbarWidth : prev,
        );
      };

      updateViewport();
      const viewportObserver = new ResizeObserver(updateViewport);
      viewportObserver.observe(container);

      const rowObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          const measureKey = element.dataset.measureKey;
          if (!measureKey) continue;
          if (element.querySelector('.history-details-drawer:not(.history-details-drawer-open)')) {
            continue;
          }
          const nextHeight =
            entry.borderBoxSize?.[0]?.blockSize ?? element.getBoundingClientRect().height;
          if (nextHeight > 0) {
            pendingUpdatesRef.current.set(measureKey, nextHeight);
          }
        }
        if (pendingUpdatesRef.current.size > 0 && rafMeasureRef.current === null) {
          rafMeasureRef.current = window.requestAnimationFrame(() => {
            rafMeasureRef.current = null;
            const updates = Array.from(pendingUpdatesRef.current.entries());
            pendingUpdatesRef.current.clear();
            if (updates.length > 0) {
              onMeasureHeights(updates);
            }
          });
        }
      });

      rowObserverRef.current = rowObserver;
      const existingRows = container.querySelectorAll<HTMLElement>('[data-measure-key]');
      for (const row of existingRows) {
        observedNodesRef.current.add(row);
        rowObserver.observe(row);
      }

      return () => {
        if (rafMeasureRef.current !== null) {
          window.cancelAnimationFrame(rafMeasureRef.current);
          rafMeasureRef.current = null;
        }
        viewportObserver.disconnect();
        rowObserver.disconnect();
        rowObserverRef.current = null;
      };
    }, [onMeasureHeights]);

    const registerRowNode = useCallback((node: HTMLDivElement | null) => {
      if (!node || observedNodesRef.current.has(node)) return;
      observedNodesRef.current.add(node);
      rowObserverRef.current?.observe(node);
    }, []);

    const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget;
      const nextScrollbarWidth = Math.max(0, el.offsetWidth - el.clientWidth);
      setScrollTop(el.scrollTop);
      setScrollbarWidth((prev) =>
        prev !== nextScrollbarWidth ? nextScrollbarWidth : prev,
      );
    }, []);

    const count = items.length;
    const offsets = new Float64Array(count + 1);
    for (let i = 0; i < count; i += 1) {
      const { question } = items[i];
      const isExpanded = expandedHistoryIds.has(question.id);
      const measureKey = `${currentSubject}:${question.id}:${isExpanded ? 1 : 0}`;
      const measured = measuredHeights.get(measureKey);
      const fallback = isExpanded ? DEFAULT_EXPANDED_HEIGHT : DEFAULT_COLLAPSED_HEIGHT;
      offsets[i + 1] = offsets[i] + (measured ?? fallback);
    }

    const totalHeight = offsets[count];
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight);
    const effectiveScrollTop = Math.min(scrollTop, maxScrollTop);
    const minTop = Math.max(0, effectiveScrollTop - OVERSCAN_PX);
    const maxBottom = effectiveScrollTop + viewportHeight + OVERSCAN_PX;

    const startIndex = count > 0 ? findStartIndex(offsets, count, minTop) : 0;
    const endIndex = count > 0 ? findEndIndex(offsets, count, startIndex, maxBottom) : 0;

    const topSpacerHeight = offsets[startIndex];
    const bottomSpacerHeight = Math.max(0, totalHeight - offsets[endIndex]);
    const visibleItems = items.slice(startIndex, endIndex);

    const isScrolledTop = effectiveScrollTop > 1;
    const isScrolledBottom = maxScrollTop > 1 && effectiveScrollTop < maxScrollTop - 1;
    const cornerMaskClass = isScrolledTop && isScrolledBottom
      ? 'scroll-window-corners-both'
      : isScrolledTop
        ? 'scroll-window-corners-top'
        : isScrolledBottom
          ? 'scroll-window-corners-bottom'
          : '';

    return (
      <div
        style={
          { '--history-scrollbar-w': `${scrollbarWidth}px` } as CSSProperties
        }
        className="relative flex min-h-0 flex-1 flex-col"
      >
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className={`history-list min-h-0 flex-1 overflow-y-scroll transition-opacity duration-150 ${
            isStaleFilter ? 'opacity-70' : 'opacity-100'
          }`}
        >
          <div className={enterClass}>
            {topSpacerHeight > 0 && <div style={{ height: topSpacerHeight }} aria-hidden="true" />}

            {visibleItems.map(({ question, index }, offsetIdx) => {
              const absoluteIdx = startIndex + offsetIdx;
              const questionStats = getQuestionStats(stats, currentSubject, question.id);
              const isCurrent = question.id === currentQuestionId;
              const isExpanded = expandedHistoryIds.has(question.id);
              const measureKey = `${currentSubject}:${question.id}:${isExpanded ? 1 : 0}`;

              return (
                <div
                  key={question.id}
                  ref={registerRowNode}
                  data-measure-key={measureKey}
                  className={absoluteIdx < count - 1 ? 'pb-2.5' : undefined}
                >
                  <HistoryItem
                    question={question}
                    index={index}
                    questionStats={questionStats}
                    isCurrent={isCurrent}
                    isExpanded={isExpanded}
                    onSelect={onSelectQuestionByIndex}
                    onToggleExpand={onToggleExpandHistory}
                  />
                </div>
              );
            })}

            {bottomSpacerHeight > 0 && (
              <div style={{ height: bottomSpacerHeight }} aria-hidden="true" />
            )}

            {count === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
                No questions match “{searchQuery}”.
              </p>
            )}
          </div>
        </div>

        <div
          className={`history-scroll-shades ${
            isScrolledTop ? 'history-scroll-shades-top' : ''
          } ${isScrolledBottom ? 'history-scroll-shades-bottom' : ''}`}
          aria-hidden="true"
        />

        {cornerMaskClass && (
          <div
            className={`scroll-window-corners scroll-window-corners-history ${cornerMaskClass}`}
            aria-hidden="true"
          />
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.items === next.items &&
    prev.searchQuery === next.searchQuery &&
    prev.stats === next.stats &&
    prev.currentSubject === next.currentSubject &&
    prev.currentQuestionId === next.currentQuestionId &&
    prev.expandedHistoryIds === next.expandedHistoryIds &&
    prev.measuredHeights === next.measuredHeights &&
    prev.isStaleFilter === next.isStaleFilter &&
    prev.enterClass === next.enterClass,
);

export const QuestionHistory = memo(function QuestionHistory({
  activeQuestions,
  stats,
  currentSubject,
  currentQuestionId,
  knowledgeSummary,
  historySearch,
  onHistorySearchChange,
  historySort,
  onHistorySortChange,
  expandedHistoryIds,
  onToggleExpandHistory,
  onSelectQuestionByIndex,
}: QuestionHistoryProps) {
  const [isStatsCollapsed, setIsStatsCollapsed] = useState<boolean>(() =>
    loadStoredStatsCollapsed(),
  );

  const handleToggleStatsCollapsed = useCallback(() => {
    setIsStatsCollapsed((prev) => {
      const next = !prev;
      saveStoredStatsCollapsed(next);
      return next;
    });
  }, []);

  const [subjectTransition, setSubjectTransition] = useState<{
    subject: Subject;
    direction: 'next' | 'prev';
    tick: number;
  }>({
    subject: currentSubject,
    direction: 'next',
    tick: 0,
  });

  if (currentSubject !== subjectTransition.subject) {
    setSubjectTransition({
      subject: currentSubject,
      direction:
        SUBJECT_ORDER[currentSubject] >= SUBJECT_ORDER[subjectTransition.subject]
          ? 'next'
          : 'prev',
      tick: subjectTransition.tick + 1,
    });
  }

  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(() => new Map());

  const handleMeasureHeights = useCallback((updates: Array<[string, number]>) => {
    setMeasuredHeights((prev) => {
      let next: Map<string, number> | null = null;
      for (const [key, height] of updates) {
        const existing = (next ?? prev).get(key);
        if (existing === undefined || Math.abs(existing - height) > 0.5) {
          if (!next) {
            next = new Map(prev);
          }
          next.set(key, height);
        }
      }
      return next ?? prev;
    });
  }, []);

  const deferredSearch = useDeferredValue(historySearch);
  const deferredSort = useDeferredValue(historySort);
  const isStaleFilter = deferredSearch !== historySearch || deferredSort !== historySort;

  const baseEntries = useMemo<HistoryEntry[]>(
    () =>
      activeQuestions.map((question, index) => ({
        question,
        index,
      })),
    [activeQuestions],
  );

  const filteredHistoryQuestions = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLocaleLowerCase();
    const matched = normalizedSearch
      ? baseEntries.filter((entry) =>
          getQuestionSearchText(entry.question).includes(normalizedSearch),
        )
      : baseEntries;

    if (deferredSort === 'ascending') {
      return matched;
    }
    if (deferredSort === 'descending') {
      return [...matched].reverse();
    }

    return [...matched].sort((left, right) =>
      compareByKnowledge(
        getQuestionStats(stats, currentSubject, left.question.id),
        getQuestionStats(stats, currentSubject, right.question.id),
        left.index,
        right.index,
        deferredSort,
      ),
    );
  }, [baseEntries, currentSubject, deferredSearch, deferredSort, stats]);

  const enterClass =
    subjectTransition.tick > 0
      ? subjectTransition.direction === 'next'
        ? 'history-list-enter-next'
        : 'history-list-enter-prev'
      : '';

  return (
    <div className="history-card min-h-0 min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
      <div className="stats-header flex shrink-0 flex-col">
        <div className="stats-top-row">
          <AccuracyProgressBar
            knowsCount={knowledgeSummary.knowsCount}
            almostCount={knowledgeSummary.almostCount}
            doesntKnowCount={knowledgeSummary.doesntKnowCount}
            answeredCount={knowledgeSummary.answeredCount}
          />

          <button
            type="button"
            onClick={handleToggleStatsCollapsed}
            title={isStatsCollapsed ? 'Show detailed statistics' : 'Hide detailed statistics'}
            aria-label={
              isStatsCollapsed ? 'Expand detailed statistics' : 'Collapse detailed statistics'
            }
            aria-expanded={!isStatsCollapsed}
            aria-controls="stats-details-drawer"
            className="stats-collapse-btn flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md"
          >
            <span
              className={`stats-collapse-chevron ${
                isStatsCollapsed ? '' : 'stats-collapse-chevron-expanded'
              }`}
              aria-hidden="true"
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </span>
          </button>
        </div>

        <div
          id="stats-details-drawer"
          className={`stats-details-drawer ${
            isStatsCollapsed ? '' : 'stats-details-drawer-open'
          }`}
          inert={isStatsCollapsed}
          aria-hidden={isStatsCollapsed}
        >
          <div className="stats-details-drawer-inner">
            <StatsDetails
              unansweredCount={knowledgeSummary.unansweredCount}
              totalQuestions={knowledgeSummary.total}
              answeredCount={knowledgeSummary.answeredCount}
              revisionCount={knowledgeSummary.revisionCount}
              totalAttempts={knowledgeSummary.totalAttempts}
              averageMasteryPercentage={knowledgeSummary.averageMasteryPercentage}
            />
          </div>
        </div>
      </div>

      <HistorySearchAndSort
        searchQuery={historySearch}
        onSearchChange={onHistorySearchChange}
        sortOption={historySort}
        onSortChange={onHistorySortChange}
      />

      <div className="relative flex min-h-0 max-h-[70vh] flex-col lg:flex-1 lg:max-h-none">
        <HistoryList
          key={currentSubject}
          items={filteredHistoryQuestions}
          searchQuery={deferredSearch}
          stats={stats}
          currentSubject={currentSubject}
          currentQuestionId={currentQuestionId}
          expandedHistoryIds={expandedHistoryIds}
          onToggleExpandHistory={onToggleExpandHistory}
          onSelectQuestionByIndex={onSelectQuestionByIndex}
          measuredHeights={measuredHeights}
          onMeasureHeights={handleMeasureHeights}
          isStaleFilter={isStaleFilter}
          enterClass={enterClass}
        />
      </div>
    </div>
  );
});
