import { memo } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from '../common/Icons.tsx';

interface QuestionNavigationProps {
  isEditing: boolean;
  onResetCorrection: () => void;
  onCancelCorrection: () => void;
  onSaveCorrection: () => void;
  onPrev: () => void;
  isPrevDisabled: boolean;
  onNext: () => void;
  isNextDisabled: boolean;
  isEvaluated: boolean;
  onCheckAnswer: () => void;
  onTryAgain: () => void;
}

export const QuestionNavigation = memo(function QuestionNavigation({
  isEditing,
  onResetCorrection,
  onCancelCorrection,
  onSaveCorrection,
  onPrev,
  isPrevDisabled,
  onNext,
  isNextDisabled,
  isEvaluated,
  onCheckAnswer,
  onTryAgain,
}: QuestionNavigationProps) {
  const handleLeftAction = () => {
    if (isEditing) {
      onResetCorrection();
    } else {
      onPrev();
    }
  };

  const handleMiddleAction = () => {
    if (isEditing) {
      onCancelCorrection();
    } else if (isEvaluated) {
      onTryAgain();
    } else {
      onCheckAnswer();
    }
  };

  const handleRightAction = () => {
    if (isEditing) {
      onSaveCorrection();
    } else {
      onNext();
    }
  };

  const isMiddlePrimary = !isEditing && !isEvaluated;
  const isRightPrimary = isEditing;
  const middleTrackClass = isEditing
    ? 'nav-morph-track-mid-editing'
    : isEvaluated
      ? 'nav-morph-track-mid-evaluated'
      : '';

  return (
    <div className="question-navigation mt-auto flex shrink-0 items-center justify-between">
      {/* Left button: Prev arrow morphs into Reset to default */}
      <button
        type="button"
        onClick={handleLeftAction}
        disabled={!isEditing && isPrevDisabled}
        title={isEditing ? 'Reset to default' : 'Previous question'}
        aria-label={isEditing ? 'Reset to default' : 'Previous question'}
        className={`nav-morph-btn nav-morph-btn-secondary-surface nav-arrow-btn group cursor-pointer shadow-2xs ${
          isEditing ? 'nav-morph-btn-left-edit' : 'nav-morph-btn-icon'
        }`}
      >
        <span className="nav-morph-stage">
          <span
            className={`nav-morph-track ${
              isEditing ? 'nav-morph-track-icon-editing' : ''
            }`}
          >
            <span
              className="nav-morph-slot nav-morph-slot-icon"
              aria-hidden={isEditing}
            >
              <span className="nav-arrow-icon nav-arrow-left">
                <ArrowLeftIcon />
              </span>
            </span>
            <span
              className="nav-morph-slot nav-morph-slot-left-edit"
              aria-hidden={!isEditing}
            >
              Reset to default
            </span>
          </span>
        </span>
      </button>

      {/* Left spacer keeps middle button centered in normal mode and pushes Cancel right in edit mode */}
      <div className="nav-morph-spacer nav-morph-spacer-expanded" aria-hidden="true" />

      {/* Middle button: Check Answer <-> Try Again <-> Cancel */}
      <button
        type="button"
        onClick={handleMiddleAction}
        title={isEditing ? 'Cancel' : isEvaluated ? 'Try Again' : 'Check Answer'}
        aria-label={isEditing ? 'Cancel' : isEvaluated ? 'Try Again' : 'Check Answer'}
        className={`nav-morph-btn cursor-pointer shadow-2xs ${
          isMiddlePrimary
            ? 'nav-morph-btn-primary nav-morph-btn-primary-surface'
            : 'nav-morph-btn-secondary nav-morph-btn-secondary-surface'
        }`}
      >
        <span className="nav-morph-stage">
          <span className={`nav-morph-track ${middleTrackClass}`.trim()}>
            <span
              className="nav-morph-slot nav-morph-slot-primary"
              aria-hidden={isEditing || isEvaluated}
            >
              Check Answer
            </span>
            <span
              className="nav-morph-slot nav-morph-slot-secondary"
              aria-hidden={isEditing || !isEvaluated}
            >
              Try Again
            </span>
            <span
              className="nav-morph-slot nav-morph-slot-secondary"
              aria-hidden={!isEditing}
            >
              Cancel
            </span>
          </span>
        </span>
      </button>

      {/* Right spacer collapses to single button gap in edit mode so Cancel sits next to Save correction */}
      <div
        className={`nav-morph-spacer ${
          isEditing ? 'nav-morph-spacer-collapsed' : 'nav-morph-spacer-expanded'
        }`}
        aria-hidden="true"
      />

      {/* Right button: Next arrow morphs into Save correction */}
      <button
        type="button"
        onClick={handleRightAction}
        disabled={!isEditing && isNextDisabled}
        title={isEditing ? 'Save correction' : 'Next question'}
        aria-label={isEditing ? 'Save correction' : 'Next question'}
        className={`nav-morph-btn nav-arrow-btn group cursor-pointer ${
          isRightPrimary
            ? 'nav-morph-btn-right-edit nav-morph-btn-save shadow-sm'
            : 'nav-morph-btn-icon nav-morph-btn-secondary-surface shadow-2xs'
        }`}
      >
        <span className="nav-morph-stage">
          <span
            className={`nav-morph-track ${
              isEditing ? 'nav-morph-track-icon-editing' : ''
            }`}
          >
            <span
              className="nav-morph-slot nav-morph-slot-icon"
              aria-hidden={isEditing}
            >
              <span className="nav-arrow-icon nav-arrow-right">
                <ArrowRightIcon />
              </span>
            </span>
            <span
              className="nav-morph-slot nav-morph-slot-right-edit"
              aria-hidden={!isEditing}
            >
              Save correction
            </span>
          </span>
        </span>
      </button>
    </div>
  );
});
