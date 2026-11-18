import type { CSSProperties } from 'react';
import {
  ArrowDown10,
  ArrowLeft,
  ArrowRight,
  ArrowUp01,
  Check,
  ChevronDown,
  CircleDot,
  CircleQuestionMark,
  Copy,
  Gauge,
  Image,
  ListChecks,
  Pencil,
  PencilLine,
  Repeat,
  Search,
  Tally5,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

interface IconProps {
  className?: string;
  strokeWidth?: number;
}

const iconStyle = (strokeWidth?: number): CSSProperties | undefined =>
  strokeWidth !== undefined && strokeWidth !== 2
    ? ({ '--icon-stroke-scale': strokeWidth / 2 } as CSSProperties)
    : undefined;

export function CopyIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <Copy
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function CircleHelpIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <CircleQuestionMark
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function AlmostIcon({ className = 'h-3.5 w-3.5', strokeWidth = 2.25 }: IconProps) {
  return (
    <CircleDot
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function EditIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <PencilLine
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function ModifiedIcon({ className = 'h-3 w-3', strokeWidth = 2.25 }: IconProps) {
  return (
    <Pencil
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function ChevronDownIcon({ className = 'h-4 w-4', strokeWidth = 2.25 }: IconProps) {
  return (
    <ChevronDown
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function ArrowLeftIcon({ className = 'h-5 w-5', strokeWidth = 2 }: IconProps) {
  return (
    <ArrowLeft
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function ArrowRightIcon({ className = 'h-5 w-5', strokeWidth = 2 }: IconProps) {
  return (
    <ArrowRight
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function CheckIcon({ className = 'h-3 w-3', strokeWidth = 3.25 }: IconProps) {
  return (
    <Check
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function CloseIcon({ className = 'h-3 w-3', strokeWidth = 3.25 }: IconProps) {
  return (
    <X
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function ImagePlaceholderIcon({ className = 'h-5 w-5', strokeWidth = 1.8 }: IconProps) {
  return (
    <Image
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function SearchIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <Search
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function SortAscendingIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <ArrowUp01
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function SortDescendingIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <ArrowDown10
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function SortLeastKnownIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <TrendingDown
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function SortBestKnownIcon({ className = 'h-4 w-4', strokeWidth = 2 }: IconProps) {
  return (
    <TrendingUp
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function AnsweredIcon({ className = 'h-3.5 w-3.5', strokeWidth = 2 }: IconProps) {
  return (
    <ListChecks
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function MasteryIcon({ className = 'h-3.5 w-3.5', strokeWidth = 2 }: IconProps) {
  return (
    <Gauge
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function AttemptsIcon({ className = 'h-3.5 w-3.5', strokeWidth = 2 }: IconProps) {
  return (
    <Tally5
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}

export function ReviseIcon({ className = 'h-3.5 w-3.5', strokeWidth = 2 }: IconProps) {
  return (
    <Repeat
      aria-hidden="true"
      className={className}
      strokeWidth={strokeWidth}
      style={iconStyle(strokeWidth)}
    />
  );
}
