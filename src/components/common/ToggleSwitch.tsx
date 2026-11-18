import { memo } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  activeBadgeText: string;
  inactiveBadgeText: string;
  title: string;
  ariaLabel?: string;
  disabled?: boolean;
  activeColor?: 'highlight' | 'revision';
}

export const ToggleSwitch = memo(function ToggleSwitch({
  checked,
  onChange,
  label,
  activeBadgeText,
  inactiveBadgeText,
  title,
  ariaLabel,
  disabled = false,
  activeColor = 'highlight',
}: ToggleSwitchProps) {
  const activeClass =
    activeColor === 'revision' ? 'toggle-switch-btn-active-revision' : 'toggle-switch-btn-active';

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className={`text-xs font-semibold text-gray-500 ${disabled ? 'opacity-40' : ''}`}>
        {label}:
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel ?? title}
        className={`toggle-switch-btn ${
          checked ? activeClass : 'toggle-switch-btn-inactive'
        }`}
      >
        <span
          className={`toggle-switch-track ${
            checked ? 'toggle-switch-track-checked' : 'toggle-switch-track-unchecked'
          }`}
        >
          <span className="toggle-switch-item" aria-hidden={checked}>
            {inactiveBadgeText}
          </span>
          <span className="toggle-switch-item" aria-hidden={!checked}>
            {activeBadgeText}
          </span>
        </span>
      </button>
    </div>
  );
});
