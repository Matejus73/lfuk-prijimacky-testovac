import { memo } from 'react';
import {
  AnsweredIcon,
  CircleHelpIcon,
  MasteryIcon,
  ReviseIcon,
} from '../common/Icons.tsx';
import { RollingNumber } from '../common/RollingNumber.tsx';

interface StatsDetailsProps {
  unansweredCount: number;
  totalQuestions: number;
  answeredCount: number;
  revisionCount: number;
  totalAttempts: number;
  averageMasteryPercentage: number;
}

export const StatsDetails = memo(function StatsDetails({
  unansweredCount,
  totalQuestions,
  answeredCount,
  revisionCount,
  totalAttempts,
  averageMasteryPercentage,
}: StatsDetailsProps) {
  const coveragePercentage =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="stats-details-content">
      {/* Deck coverage bar + unanswered count */}
      <div
        className="stats-coverage-row"
        title={`Answered ${answeredCount} of ${totalQuestions} (${coveragePercentage}%) · ${unansweredCount} never answered`}
      >
        <span
          className={`stats-item ${answeredCount > 0 ? 'opacity-100' : 'opacity-70'}`}
          title={`Answered ${answeredCount} of ${totalQuestions} (${coveragePercentage}%)`}
          aria-label={`Answered ${answeredCount} of ${totalQuestions}`}
        >
          <AnsweredIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
          <span className="inline-flex items-baseline">
            <RollingNumber
              value={answeredCount}
              align="left"
              className={answeredCount > 0 ? 'text-gray-900' : 'text-gray-500'}
            />
            <span className="stats-item-sub">/{totalQuestions}</span>
          </span>
        </span>

        <div className="stats-coverage-track" aria-hidden="true">
          <div
            className={`stats-coverage-fill ${answeredCount === 0 ? 'opacity-0' : ''}`}
            style={{
              width: `${coveragePercentage}%`,
              minWidth: answeredCount > 0 ? '0.5rem' : undefined,
            }}
          />
        </div>

        <span
          className={`stats-item text-gray-500 ${
            unansweredCount > 0 ? 'opacity-100' : 'opacity-70'
          }`}
          title={`${unansweredCount} never answered`}
          aria-label={`${unansweredCount} never answered`}
        >
          <CircleHelpIcon className="h-3.5 w-3.5 shrink-0" />
          <RollingNumber value={unansweredCount} align="right" />
        </span>
      </div>

      {/* Compact inline icon-only numeric metrics */}
      <div className="stats-numbers-row">
        <div
          className={`stats-item ${
            totalAttempts > 0 ? 'text-gray-900 opacity-100' : 'text-gray-500 opacity-70'
          }`}
          title={
            totalAttempts > 0
              ? `Average mastery: ${averageMasteryPercentage}%`
              : 'Average mastery: no attempts yet'
          }
          aria-label={
            totalAttempts > 0
              ? `Average mastery: ${averageMasteryPercentage}%`
              : 'Average mastery: no attempts yet'
          }
        >
          <MasteryIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
          {totalAttempts > 0 ? (
            <RollingNumber value={averageMasteryPercentage} suffix="%" />
          ) : (
            <span>—</span>
          )}
        </div>

        <div
          className={`stats-item ${
            revisionCount > 0 ? 'text-rose-700 opacity-100' : 'text-gray-500 opacity-70'
          }`}
          title={`Needs revision: ${revisionCount}`}
          aria-label={`Needs revision: ${revisionCount}`}
        >
          <ReviseIcon className="h-3.5 w-3.5 shrink-0" />
          <RollingNumber value={revisionCount} align="left" />
        </div>
      </div>
    </div>
  );
});
