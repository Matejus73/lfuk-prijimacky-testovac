import type { ReactNode } from 'react';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  ariaLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  onClick,
  title,
  ariaLabel,
  children,
  disabled = false,
  className = '',
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? title}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
