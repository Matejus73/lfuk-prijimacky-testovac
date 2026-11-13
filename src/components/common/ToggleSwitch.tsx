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
      <span className="text-xs font-semibold text-gray-500">{label}:</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        title={title}
        aria-label={ariaLabel ?? title}
        className={`relative h-6 w-11 rounded-full text-[10px] font-bold transition ${
          checked ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
        }`}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          {checked ? activeBadgeText : inactiveBadgeText}
        </span>
      </button>
    </div>
  );
}
