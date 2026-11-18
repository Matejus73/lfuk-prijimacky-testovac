import { memo, type ReactNode } from 'react';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  isActive?: boolean;
  activeTone?: 'highlight' | 'edit' | 'copy';
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const IconButton = memo(function IconButton({
  onClick,
  title,
  ariaLabel,
  ariaExpanded,
  ariaPressed,
  isActive = false,
  activeTone = 'highlight',
  children,
  disabled = false,
  className = '',
}: IconButtonProps) {
  const activeClass = isActive
    ? activeTone === 'edit'
      ? 'icon-btn-active-edit'
      : activeTone === 'copy'
        ? 'icon-btn-active-copy'
        : 'icon-btn-active-highlight'
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      className={`icon-btn flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center shadow-2xs disabled:cursor-not-allowed disabled:opacity-40 ${activeClass} ${className}`.trim()}
    >
      {children}
    </button>
  );
});
