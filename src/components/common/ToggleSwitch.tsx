interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  activeBadgeText: string;
  inactiveBadgeText: string;
  title: string;
  ariaLabel?: string;
}

export function ToggleSwitch({
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
      <span className="text-xs font-semibold text-gray-500">
        {label}:
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        title={title}
        aria-label={ariaLabel ?? title}
        className={`toggle-switch-btn ${
          checked
            ? 'bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-700'
        }`}
      >
        <span
          className={`toggle-switch-badge ${
            checked
              ? 'toggle-switch-badge-active'
              : 'toggle-switch-badge-active-hidden'
          }`}
          aria-hidden={!checked}
        >
          {activeBadgeText}
        </span>
        <span
          className={`toggle-switch-badge ${
            checked
              ? 'toggle-switch-badge-inactive-hidden'
              : 'toggle-switch-badge-inactive'
          }`}
          aria-hidden={checked}
        >
          {inactiveBadgeText}
        </span>
      </button>
    </div>
  );
}
