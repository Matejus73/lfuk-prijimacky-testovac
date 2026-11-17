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
  const middleEditingTrackClass = isEvaluated
    ? 'nav-morph-track-mid-secondary-editing'
    : 'nav-morph-track-mid-primary-editing';

  return (
    <div className="question-navigation mt-auto flex shrink-0 items-center justify-between gap-2 border-t border-gray-200 bg-white">
      {/* Left button: Prev arrow morphs into Reset to default */}
      <button
        type="button"
        onClick={handleLeftAction}
        disabled={!isEditing && isPrevDisabled}
        title={isEditing ? 'Reset to default' : 'Previous question'}
        aria-label={isEditing ? 'Reset to default' : 'Previous question'}
        className={`nav-morph-btn nav-arrow-btn group cursor-pointer rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-2xs hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white ${
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
              className={`nav-morph-slot nav-morph-slot-icon ${
                !isEditing && isPrevDisabled ? 'opacity-40' : ''
              }`}
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

      {/* Spacer that morphs flex-grow so middle button glides toward the right in edit mode */}
      <div
        className={`nav-morph-spacer ${isEditing ? 'nav-morph-spacer-editing' : ''}`}
        aria-hidden="true"
      />

      {/* Middle button: Check Answer / Try Again morphs into Cancel */}
      <button
        type="button"
        onClick={handleMiddleAction}
        title={isEditing ? 'Cancel' : isEvaluated ? 'Try Again' : 'Check Answer'}
        aria-label={isEditing ? 'Cancel' : isEvaluated ? 'Try Again' : 'Check Answer'}
        className={`nav-morph-btn cursor-pointer rounded-lg border text-sm font-semibold ${
          isMiddlePrimary
            ? 'nav-morph-btn-primary border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
            : 'nav-morph-btn-secondary border-gray-200 bg-white text-gray-700 shadow-2xs hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="nav-morph-stage">
          <span
            className={`nav-morph-track ${isEditing ? middleEditingTrackClass : ''}`}
          >
            <span
              className={`nav-morph-slot ${
                isEvaluated ? 'nav-morph-slot-secondary' : 'nav-morph-slot-primary'
              }`}
              aria-hidden={isEditing}
            >
              {isEvaluated ? 'Try Again' : 'Check Answer'}
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

      {/* Spacer that collapses in edit mode so Cancel sits next to Save correction */}
      <div
        className={`nav-morph-spacer ${
          isEditing ? 'nav-morph-spacer-collapsed' : 'nav-morph-spacer-editing'
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
        className={`nav-morph-btn nav-arrow-btn group cursor-pointer rounded-lg border text-sm font-semibold disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white ${
          isRightPrimary
            ? 'nav-morph-btn-right-edit border-blue-500 bg-blue-600 text-white shadow-sm hover:bg-blue-700'
            : 'nav-morph-btn-icon border-gray-200 bg-white text-gray-700 shadow-2xs hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="nav-morph-stage">
          <span
            className={`nav-morph-track ${
              isEditing ? 'nav-morph-track-icon-editing' : ''
            }`}
          >
            <span
              className={`nav-morph-slot nav-morph-slot-icon ${
                !isEditing && isNextDisabled ? 'opacity-40' : ''
              }`}
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
