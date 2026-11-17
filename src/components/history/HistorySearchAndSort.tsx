import { memo } from 'react';
import type { HistorySort } from '../../types.ts';

interface HistorySearchAndSortProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: HistorySort;
  onSortChange: (sort: HistorySort) => void;
}

export const HistorySearchAndSort = memo(function HistorySearchAndSort({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
}: HistorySearchAndSortProps) {
  return (
    <>
      <h2 className="mb-2.5 text-lg font-bold text-gray-900">Question history</h2>

      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="history-search" className="min-w-0 flex-1">
          <span className="sr-only">Search question history</span>
          <input
            id="history-search"
            name="history-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by ID or text..."
            className="form-control h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </label>

        <label htmlFor="history-sort" className="shrink-0">
          <span className="sr-only">Sort questions</span>
          <select
            id="history-sort"
            name="history-sort"
            value={sortOption}
            onChange={(event) => onSortChange(event.target.value as HistorySort)}
            aria-label="Sort questions"
            className="form-control h-9 w-auto cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-900"
          >
            <option value="ascending">Order ↑</option>
            <option value="descending">Order ↓</option>
            <option value="most-wrong">Most wrong</option>
            <option value="most-correct">Most correct</option>
          </select>
        </label>
      </div>
    </>
  );
});
