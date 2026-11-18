import { memo, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import type { HistorySort } from '../../types.ts';
import {
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  SortAscendingIcon,
  SortBestKnownIcon,
  SortDescendingIcon,
  SortLeastKnownIcon,
} from '../common/Icons.tsx';

interface HistorySearchAndSortProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortOption: HistorySort;
  onSortChange: (sort: HistorySort) => void;
}

interface SortOptionItem {
  value: HistorySort;
  label: string;
  ariaLabel: string;
  icon: ReactNode;
}

const SORT_OPTIONS: SortOptionItem[] = [
  {
    value: 'ascending',
    label: 'Ascending',
    ariaLabel: 'Order ascending',
    icon: <SortAscendingIcon className="h-4 w-4 shrink-0 text-blue-600" />,
  },
  {
    value: 'descending',
    label: 'Descending',
    ariaLabel: 'Order descending',
    icon: <SortDescendingIcon className="h-4 w-4 shrink-0 text-blue-600" />,
  },
  {
    value: 'least-known',
    label: 'Least known',
    ariaLabel: 'Rank from least known to best known',
    icon: <SortLeastKnownIcon className="h-4 w-4 shrink-0 text-rose-700" />,
  },
  {
    value: 'most-known',
    label: 'Best known',
    ariaLabel: 'Rank from best known to least known',
    icon: <SortBestKnownIcon className="h-4 w-4 shrink-0 text-emerald-800" />,
  },
];

export const HistorySearchAndSort = memo(function HistorySearchAndSort({
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
}: HistorySearchAndSortProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedOption =
    SORT_OPTIONS.find((option) => option.value === sortOption) ?? SORT_OPTIONS[0];
  const selectedIndex = Math.max(
    SORT_OPTIONS.findIndex((option) => option.value === sortOption),
    0,
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  const focusOption = (index: number) => {
    const bounded = (index + SORT_OPTIONS.length) % SORT_OPTIONS.length;
    optionRefs.current[bounded]?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      requestAnimationFrame(() => {
        focusOption(selectedIndex);
      });
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(SORT_OPTIONS.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const handleSelectOption = (value: HistorySort) => {
    onSortChange(value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <h2 className="sr-only">Question history</h2>

      <div className="history-search-bar flex items-center gap-2">
        <label htmlFor="history-search" className="search-field relative min-w-0 flex-1">
          <span className="sr-only">Search question history</span>
          <span
            className="search-field-icon pointer-events-none absolute inset-y-0 left-1 flex items-center"
            aria-hidden="true"
          >
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            id="history-search"
            name="history-search"
            type="search"
            lang="sk"
            spellCheck={false}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search question history"
            className="search-line-input h-9 w-full pl-7 pr-2 text-sm text-gray-900"
          />
        </label>

        <div ref={dropdownRef} className="relative shrink-0">
          <button
            ref={triggerRef}
            id="history-sort"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={`Sort questions: ${selectedOption.ariaLabel}`}
            onClick={() => setIsOpen((prev) => !prev)}
            onKeyDown={handleTriggerKeyDown}
            className="sort-trigger flex h-9 cursor-pointer items-center gap-1.5 px-1.5 text-xs font-medium"
          >
            <span className="flex items-center gap-1.5">
              {selectedOption.icon}
              <span className="whitespace-nowrap">{selectedOption.label}</span>
            </span>
            <span
              className={`history-chevron shrink-0 ${
                isOpen ? 'history-chevron-expanded' : ''
              }`}
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </span>
          </button>

          {isOpen && (
            <div
              role="listbox"
              aria-labelledby="history-sort"
              className="sort-menu absolute right-0 top-full z-30 mt-1.5 min-w-full w-max p-1 shadow-lg"
            >
              {SORT_OPTIONS.map((option, index) => {
                const isSelected = option.value === sortOption;
                return (
                  <button
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    aria-label={option.ariaLabel}
                    onClick={() => handleSelectOption(option.value)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                    className={`sort-menu-option flex w-full cursor-pointer items-center justify-between gap-3 px-2.5 py-1.5 text-left text-xs font-medium ${
                      isSelected ? 'sort-menu-option-selected' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon}
                      <span className="whitespace-nowrap">{option.label}</span>
                    </span>
                    <CheckIcon
                      className={`h-3 w-3 shrink-0 text-blue-600 transition-opacity duration-150 ${
                        isSelected ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
});
