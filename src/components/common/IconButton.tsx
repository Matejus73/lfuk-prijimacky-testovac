import type { ReactNode, Ref } from 'react';

interface IconButtonProps {
  onClick: () => void;
  title: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  buttonRef?: Ref<HTMLButtonElement>;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  onClick,
  title,
  ariaLabel,
  ariaPressed,
  buttonRef,
  children,
  disabled = false,
  className = '',
}: IconButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? title}
      aria-pressed={ariaPressed}
      className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-gray-600 shadow-2xs transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
