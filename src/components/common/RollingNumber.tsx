import { memo, useCallback, useState } from 'react';

interface RollingNumberProps {
  value: number;
  suffix?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface RollState {
  current: number;
  previous: number | null;
  direction: 'up' | 'down';
  tick: number;
}

export const RollingNumber = memo(function RollingNumber({
  value,
  suffix = '',
  align = 'left',
  className = '',
}: RollingNumberProps) {
  const [rollState, setRollState] = useState<RollState>({
    current: value,
    previous: null,
    direction: 'up',
    tick: 0,
  });

  if (value !== rollState.current) {
    setRollState({
      current: value,
      previous: rollState.current,
      direction: value > rollState.current ? 'up' : 'down',
      tick: rollState.tick + 1,
    });
  }

  const handleOutgoingAnimationEnd = useCallback(() => {
    setRollState((prev) => (prev.previous !== null ? { ...prev, previous: null } : prev));
  }, []);

  const alignClass =
    align === 'right'
      ? 'rolling-number-outgoing-right'
      : align === 'center'
        ? 'rolling-number-outgoing-center'
        : 'rolling-number-outgoing-left';

  const isAnimating = rollState.previous !== null && rollState.tick > 0;

  const enterClass = isAnimating
    ? rollState.direction === 'up'
      ? 'rolling-number-enter-up'
      : 'rolling-number-enter-down'
    : '';

  const exitClass = isAnimating
    ? rollState.direction === 'up'
      ? 'rolling-number-exit-up'
      : 'rolling-number-exit-down'
    : '';

  return (
    <span className={`rolling-number ${className}`.trim()}>
      <span className="rolling-number-stage">
        {isAnimating && (
          <span
            key={`out-${rollState.tick}`}
            onAnimationEnd={handleOutgoingAnimationEnd}
            className={`rolling-number-outgoing ${alignClass} ${exitClass}`}
            aria-hidden="true"
          >
            {rollState.previous}
          </span>
        )}
        <span
          key={`in-${rollState.tick}`}
          className={`rolling-number-incoming ${enterClass}`.trim()}
        >
          {rollState.current}
        </span>
      </span>
      {suffix && <span>{suffix}</span>}
    </span>
  );
});
