import type { HistorySort } from '../../types.ts';

interface HistorySearchAndSortProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: HistorySort;
  onSortChange: (sort: HistorySort) => void;
}

export function HistorySearchAndSort({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
}: HistorySearchAndSortProps) {
  return (
    <>
      <h2 className="mb-3 text-lg font-bold text-gray-900">Question history</h2>

      <label className="mb-4 block">
        <span className="sr-only">Search question history</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by question ID or text..."
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </label>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="history-sort" className="text-sm font-semibold text-gray-600">
          Sort:
        </label>
        <select
          id="history-sort"
          value={sortOption}
          onChange={(event) => onSortChange(event.target.value as HistorySort)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="ascending">Question order (ascending)</option>
          <option value="descending">Question order (descending)</option>
          <option value="most-wrong">Most incorrect answers</option>
          <option value="most-correct">Most correct answers</option>
        </select>
      </div>
    </>
  );
}
