import { memo, type ReactNode } from 'react';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaPressed?: boolean;
  isActive?: boolean;
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
  children,
  disabled = false,
  className = '',
}: IconButtonProps) {
  const stateClasses = isActive
    ? 'border-blue-500 bg-blue-50 text-blue-600 hover:border-blue-400'
    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      className={`icon-btn flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border shadow-2xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${stateClasses} ${className}`.trim()}
    >
      {children}
    </button>
  );
});
