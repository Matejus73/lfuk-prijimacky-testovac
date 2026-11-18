import { memo, type CSSProperties } from 'react';
import { AlmostIcon, CheckIcon, CloseIcon } from '../common/Icons.tsx';
import { RollingNumber } from '../common/RollingNumber.tsx';

interface AccuracyProgressBarProps {
  knowsCount: number;
  almostCount: number;
  doesntKnowCount: number;
  answeredCount: number;
}

export const AccuracyProgressBar = memo(function AccuracyProgressBar({
  knowsCount,
  almostCount,
  doesntKnowCount,
  answeredCount,
}: AccuracyProgressBarProps) {
  const hasAnswered = answeredCount > 0;
  const hasKnows = knowsCount > 0;
  const hasAlmost = almostCount > 0;
  const hasDoesntKnow = doesntKnowCount > 0;

  return (
    <div
      className="accuracy-bar-wrap"
      title={`${knowsCount} knows · ${almostCount} almost knows · ${doesntKnowCount} doesn't know`}
    >
      <span
        className={`accuracy-bar-count text-emerald-800 ${
          hasKnows ? 'opacity-100' : 'opacity-70'
        }`}
        aria-label={`${knowsCount} knows`}
        title={`${knowsCount} knows`}
      >
        <CheckIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        <RollingNumber value={knowsCount} align="left" />
      </span>

      <div
        className={`accuracy-bar-track ${hasKnows ? 'accuracy-bar-track-active' : ''}`}
        style={
          {
            '--segment-grow': hasKnows ? knowsCount : 0,
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <div className="accuracy-bar-segment accuracy-bar-segment-knows w-full" />
      </div>

      <span
        className={`accuracy-bar-count accuracy-bar-count-spaced text-amber-500 ${
          hasAlmost ? 'opacity-100' : 'opacity-70'
        }`}
        aria-label={`${almostCount} almost knows`}
        title={`${almostCount} almost knows`}
      >
        <AlmostIcon className="h-3.5 w-3.5 shrink-0" />
        <RollingNumber value={almostCount} align="left" />
      </span>

      <div
        className={`accuracy-bar-track ${hasAlmost ? 'accuracy-bar-track-active' : ''}`}
        style={
          {
            '--segment-grow': hasAlmost ? almostCount : 0,
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <div className="accuracy-bar-segment accuracy-bar-segment-almost w-full" />
      </div>

      <span
        className={`accuracy-bar-count accuracy-bar-count-spaced text-rose-800 ${
          hasDoesntKnow ? 'opacity-100' : 'opacity-70'
        }`}
        aria-label={`${doesntKnowCount} doesn't know`}
        title={`${doesntKnowCount} doesn't know`}
      >
        <CloseIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        <RollingNumber value={doesntKnowCount} align="left" />
      </span>

      <div
        className={`accuracy-bar-track ${hasDoesntKnow ? 'accuracy-bar-track-active' : ''}`}
        style={
          {
            '--segment-grow': hasDoesntKnow ? doesntKnowCount : 0,
          } as CSSProperties
        }
        aria-hidden="true"
      >
        <div className="accuracy-bar-segment accuracy-bar-segment-doesnt-know w-full" />
      </div>

      <div
        className={`accuracy-bar-track ${
          !hasAnswered ? 'accuracy-bar-track-active accuracy-bar-track-empty' : ''
        }`}
        style={
          {
            '--segment-grow': !hasAnswered ? 1 : 0,
          } as CSSProperties
        }
        aria-hidden="true"
      />
    </div>
  );
});
