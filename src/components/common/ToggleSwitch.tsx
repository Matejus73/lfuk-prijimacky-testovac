import { memo } from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  activeBadgeText: string;
  inactiveBadgeText: string;
  title: string;
  ariaLabel?: string;
}

export const ToggleSwitch = memo(function ToggleSwitch({
  checked,
  onChange,
  label,
  activeBadgeText,
  inactiveBadgeText,
  title,
  ariaLabel,
}: ToggleSwitchProps) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-500">{label}:</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        title={title}
        aria-label={ariaLabel ?? title}
        className={`toggle-switch-btn ${
          checked ? 'toggle-switch-btn-active' : 'toggle-switch-btn-inactive'
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
