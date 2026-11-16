import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QuestionCard } from './components/question/QuestionCard.tsx';
import { QuestionControls } from './components/question/QuestionControls.tsx';
import { SubjectSelector } from './components/question/SubjectSelector.tsx';
import { QuestionHistory } from './components/history/QuestionHistory.tsx';
import bioData from './data/OtazkyBio.json';
import chemData from './data/OtazkyChem.json';
import type {
  AllStats,
  AnswerResult,
  CopyStatus,
  EditableQuestion,
  HistorySort,
  Question,
  QuestionMode,
  QuestionStats,
  Subject,
} from './types.ts';
import {
  areAnswersEqual,
  formatQuestionForClipboard,
  getInitialRandomOptionLabels,
  getQuestionStats,
} from './utils/questionUtils.ts';
import {
  loadStoredFourAnswers,
  loadStoredQuestions,
  loadStoredStats,
  saveStoredFourAnswers,
  saveStoredQuestions,
  saveStoredStats,
} from './utils/storageUtils.ts';

const datasets: Record<Subject, Question[]> = {
  Biology: bioData as Question[],
  Chemistry: chemData as Question[],
};

export default function App() {
  const [currentSubject, setCurrentSubject] = useState<Subject>('Biology');
  const [questions, setQuestions] = useState<Record<Subject, Question[]>>(() =>
    loadStoredQuestions(datasets),
  );
  const [stats, setStats] = useState<AllStats>(() => loadStoredStats());
  const [fourAnswersOnly, setFourAnswersOnly] = useState<boolean>(() => loadStoredFourAnswers());
  const [randomOptionLabels] = useState<Record<string, string[]>>(() =>
    getInitialRandomOptionLabels(questions),
  );
  const [questionMode, setQuestionMode] = useState<QuestionMode>('all');
  const [randomNext, setRandomNext] = useState(false);
  const [randomRange, setRandomRange] = useState({ start: 1, end: datasets.Biology.length });

  // Active question set and revision filter
  const activeQuestions = questions[currentSubject];
  const revisionQuestions = useMemo(
    () =>
      activeQuestions
        .map((question, index) => ({
          question,
          index,
          incorrect: getQuestionStats(stats, currentSubject, question.id)?.incorrect ?? 0,
        }))
        .filter(({ incorrect }) => incorrect > 0),
    [activeQuestions, currentSubject, stats],
  );
  const questionsInMode = useMemo(
    () =>
      questionMode === 'revision'
        ? revisionQuestions.map(({ question }) => question)
        : activeQuestions,
    [activeQuestions, questionMode, revisionQuestions],
  );
  const randomRangeStart = Math.min(
    Math.max(randomRange.start, 1),
    Math.max(questionsInMode.length, 1),
  );
  const randomRangeEnd = Math.min(
    Math.max(randomRange.end, randomRangeStart),
    Math.max(questionsInMode.length, randomRangeStart),
  );

  // Question navigation and answer states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    () => getQuestionStats(stats, 'Biology', questions.Biology[0].id)?.lastAnswer ?? [],
  );
  const [isEvaluated, setIsEvaluated] = useState<boolean>(
    () => Boolean(getQuestionStats(stats, 'Biology', questions.Biology[0].id)?.lastResult),
  );
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [copyPulseKey, setCopyPulseKey] = useState<number>(0);
  const copyPulseIdRef = useRef(0);
  const copyPulseTimerRef = useRef<number | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySort>('ascending');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<EditableQuestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFoxActive, setIsFoxActive] = useState(false);
  const editExitTimerRef = useRef<number | null>(null);
  const [editError, setEditError] = useState('');

  const currentQuestion = questionsInMode[currentIndex] ?? activeQuestions[0];
  const displayedOptions = useMemo(
    () =>
      fourAnswersOnly
        ? currentQuestion.options.filter((option) =>
            (randomOptionLabels[`${currentSubject}:${currentQuestion.id}`] ?? []).includes(
              option.label,
            ),
          )
        : currentQuestion.options,
    [currentQuestion, currentSubject, fourAnswersOnly, randomOptionLabels],
  );

  // Persist state updates to localStorage
  useEffect(() => {
    saveStoredStats(stats);
  }, [stats]);

  useEffect(() => {
    saveStoredQuestions(questions);
  }, [questions]);

  useEffect(() => {
    saveStoredFourAnswers(fourAnswersOnly);
  }, [fourAnswersOnly]);

  useEffect(() => {
    document.documentElement.classList.toggle('fox-cursor-active', isFoxActive);
    return () => {
      document.documentElement.classList.remove('fox-cursor-active');
    };
  }, [isFoxActive]);

  const closeEditMode = useCallback(() => {
    if (editExitTimerRef.current !== null) {
      window.clearTimeout(editExitTimerRef.current);
      editExitTimerRef.current = null;
    }
    setIsEditing(false);
    setEditError('');
    editExitTimerRef.current = window.setTimeout(() => {
      editExitTimerRef.current = null;
      setEditingQuestion(null);
    }, 260);
  }, []);

  const restoreQuestion = useCallback(() => {
    setSelectedLabels([]);
    setIsEvaluated(false);
    closeEditMode();
    if (copyPulseTimerRef.current !== null) {
      window.clearTimeout(copyPulseTimerRef.current);
      copyPulseTimerRef.current = null;
    }
    setCopyPulseKey(0);
  }, [closeEditMode]);

  const handleSubjectChange = (subject: Subject) => {
    setCurrentSubject(subject);
    setCurrentIndex(0);
    restoreQuestion();
  };

  const handleQuestionModeChange = (mode: QuestionMode) => {
    setQuestionMode(mode);
    setCurrentIndex(0);
    restoreQuestion();
  };

  const handleFourAnswersToggle = () => {
    setFourAnswersOnly((prev) => !prev);
    restoreQuestion();
  };

  const handleRandomNextToggle = () => {
    setRandomNext((prev) => !prev);
  };

  const handleFoxToggle = () => {
    setIsFoxActive((prev) => !prev);
  };

  const handleRandomRangeStartChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    const start = Math.min(Math.max(Math.round(value), 1), randomRangeEnd);
    setRandomRange((previous) => ({ start, end: Math.max(previous.end, start) }));
  };

  const handleRandomRangeEndChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    const end = Math.min(
      Math.max(Math.round(value), randomRangeStart),
      Math.max(questionsInMode.length, randomRangeStart),
    );
    setRandomRange((previous) => ({ start: Math.min(previous.start, end), end }));
  };

  const handleToggleOption = (label: string) => {
    if (isEvaluated) return;
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const handleNext = () => {
    if (questionsInMode.length > 1) {
      const availableIndexes = questionsInMode
        .map((_, index) => index)
        .filter(
          (index) =>
            index >= randomRangeStart - 1 &&
            index <= randomRangeEnd - 1 &&
            index !== currentIndex,
        );
      const nextIndex = randomNext
        ? availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
        : currentIndex + 1;
      if (nextIndex === undefined || nextIndex >= questionsInMode.length) return;
      setCurrentIndex(nextIndex);
      restoreQuestion();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      restoreQuestion();
    }
  };

  const handleCheckAnswer = () => {
    const correctLabels = displayedOptions
      .filter((option) => option.is_correct)
      .map((option) => option.label);
    const scoreWeight = displayedOptions.length / currentQuestion.options.length;
    const result: AnswerResult =
      selectedLabels.length === 0
        ? 'unanswered'
        : areAnswersEqual(selectedLabels, correctLabels)
          ? 'correct'
          : 'incorrect';

    setStats((previousStats) => {
      const previousQuestionStats = getQuestionStats(
        previousStats,
        currentSubject,
        currentQuestion.id,
      );
      const nextQuestionStats: QuestionStats = {
        correct: (previousQuestionStats?.correct ?? 0) + (result === 'correct' ? scoreWeight : 0),
        incorrect: (previousQuestionStats?.incorrect ?? 0) + (result === 'incorrect' ? scoreWeight : 0),
        lastAnswer: selectedLabels,
        lastResult: result,
      };

      return {
        ...previousStats,
        [currentSubject]: {
          ...previousStats[currentSubject],
          [currentQuestion.id]: nextQuestionStats,
        },
      };
    });
    setIsEvaluated(true);
  };

  const handleTryAgain = () => {
    setSelectedLabels([]);
    setIsEvaluated(false);
  };

  const handleCopyCard = async () => {
    const nextPulse = ++copyPulseIdRef.current;
    setCopyPulseKey(nextPulse);
    if (copyPulseTimerRef.current !== null) {
      window.clearTimeout(copyPulseTimerRef.current);
    }
    copyPulseTimerRef.current = window.setTimeout(() => {
      copyPulseTimerRef.current = null;
      setCopyPulseKey((current) => (current === nextPulse ? 0 : current));
    }, 680);

    const cardText = formatQuestionForClipboard(
      currentSubject,
      currentQuestion,
      selectedLabels,
      getQuestionStats(stats, currentSubject, currentQuestion.id)?.lastResult,
    );

    try {
      await navigator.clipboard.writeText(cardText);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }

    window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleOpenCorrection = () => {
    if (isEditing && editingQuestion) {
      const hasChanges =
        editingQuestion.question !== currentQuestion.question ||
        editingQuestion.options.some((option, index) => {
          const originalOption = currentQuestion.options[index];
          return (
            option.text !== originalOption.text || option.is_correct !== originalOption.is_correct
          );
        });

      if (!hasChanges) {
        closeEditMode();
      } else {
        handleSaveCorrection();
      }
      return;
    }

    if (editExitTimerRef.current !== null) {
      window.clearTimeout(editExitTimerRef.current);
      editExitTimerRef.current = null;
    }
    setEditingQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map((option) => ({ ...option })),
    });
    setEditError('');
    setIsEditing(true);
  };

  const handleResetCorrection = () => {
    if (!editingQuestion) return;
    const defaultQuestion = datasets[currentSubject].find(
      (question) => question.id === editingQuestion.id,
    );
    if (!defaultQuestion) return;

    setEditingQuestion({
      ...defaultQuestion,
      options: defaultQuestion.options.map((option) => ({ ...option })),
    });
    setEditError('');
  };

  const handleSaveCorrection = () => {
    if (!editingQuestion) return;
    if (!editingQuestion.question.trim()) {
      setEditError('Enter a question before saving.');
      return;
    }
    if (editingQuestion.options.some((option) => !option.text.trim())) {
      setEditError('Every answer must contain text.');
      return;
    }
    if (!editingQuestion.options.some((option) => option.is_correct)) {
      setEditError('Mark at least one answer as correct.');
      return;
    }

    const correctedQuestion: Question = {
      ...editingQuestion,
      question: editingQuestion.question.trim(),
      options: editingQuestion.options.map((option) => ({
        ...option,
        text: option.text.trim(),
      })),
    };

    setQuestions((previousQuestions) => ({
      ...previousQuestions,
      [currentSubject]: previousQuestions[currentSubject].map((question) =>
        question.id === correctedQuestion.id ? correctedQuestion : question,
      ),
    }));

    setStats((previousStats) => ({
      ...previousStats,
      [currentSubject]: Object.fromEntries(
        Object.entries(previousStats[currentSubject]).filter(
          ([questionId]) => questionId !== correctedQuestion.id,
        ),
      ),
    }));

    setSelectedLabels([]);
    setIsEvaluated(false);
    closeEditMode();
  };

  const handleChangeQuestionText = (text: string) => {
    setEditingQuestion((prev) => (prev ? { ...prev, question: text } : prev));
  };

  const handleToggleOptionCorrect = (optionIndex: number, isCorrect: boolean) => {
    setEditingQuestion((prev) => {
      if (!prev) return prev;
      const options = prev.options.map((option, index) =>
        index === optionIndex ? { ...option, is_correct: isCorrect } : option,
      );
      return { ...prev, options };
    });
  };

  const handleChangeOptionText = (optionIndex: number, text: string) => {
    setEditingQuestion((prev) => {
      if (!prev) return prev;
      const options = prev.options.map((option, index) =>
        index === optionIndex ? { ...option, text } : option,
      );
      return { ...prev, options };
    });
  };

  const handleSelectQuestionFromHistory = useCallback(
    (index: number) => {
      setQuestionMode('all');
      setCurrentIndex(index);
      restoreQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [restoreQuestion],
  );

  const handleToggleExpandHistory = useCallback((id: string) => {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Aggregated stats calculations
  const { answeredQuestionsCount, correctAnswersCount, incorrectAnswersCount } = useMemo(() => {
    let answered = 0;
    let correct = 0;
    let incorrect = 0;
    for (const question of activeQuestions) {
      const qStats = getQuestionStats(stats, currentSubject, question.id);
      if (qStats?.lastResult === 'correct' || qStats?.lastResult === 'incorrect') {
        answered++;
      }
      correct += qStats?.correct ?? 0;
      incorrect += qStats?.incorrect ?? 0;
    }
    return {
      answeredQuestionsCount: answered,
      correctAnswersCount: correct,
      incorrectAnswersCount: incorrect,
    };
  }, [activeQuestions, currentSubject, stats]);

  const totalAttempts = correctAnswersCount + incorrectAnswersCount;
  const correctPercentage = totalAttempts
    ? Math.round((correctAnswersCount / totalAttempts) * 100)
    : 0;
  const incorrectPercentage = totalAttempts
    ? Math.round((incorrectAnswersCount / totalAttempts) * 100)
    : 0;

  const questionCounts: Record<Subject, number> = {
    Biology: questions.Biology.length,
    Chemistry: questions.Chemistry.length,
  };

  return (
    <div className="app-shell min-h-screen w-full bg-slate-100 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <div className="app-layout grid w-full items-start lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,1fr)]">
        <div className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          <SubjectSelector
            currentSubject={currentSubject}
            questionCounts={questionCounts}
            onSelectSubject={handleSubjectChange}
          />

          <QuestionControls
            questionMode={questionMode}
            onModeChange={handleQuestionModeChange}
            revisionCount={revisionQuestions.length}
            subject={currentSubject}
            questionId={currentQuestion.id}
            currentIndex={currentIndex}
            copyStatus={copyStatus}
            onCopy={handleCopyCard}
            isEditing={isEditing}
            onToggleEdit={handleOpenCorrection}
            isFoxActive={isFoxActive}
            onToggleFox={handleFoxToggle}
            randomNext={randomNext}
            onToggleRandomNext={handleRandomNextToggle}
            randomRangeStart={randomRangeStart}
            randomRangeEnd={randomRangeEnd}
            randomRangeMax={Math.max(questionsInMode.length, 1)}
            onRandomRangeStartChange={handleRandomRangeStartChange}
            onRandomRangeEndChange={handleRandomRangeEndChange}
            fourAnswersOnly={fourAnswersOnly}
            onToggleFourAnswers={handleFourAnswersToggle}
          />

          <QuestionCard
            currentQuestion={currentQuestion}
            displayedOptions={displayedOptions}
            selectedLabels={selectedLabels}
            isEvaluated={isEvaluated}
            onToggleOption={handleToggleOption}
            isEditing={isEditing}
            editingQuestion={editingQuestion}
            onChangeQuestionText={handleChangeQuestionText}
            onToggleOptionCorrect={handleToggleOptionCorrect}
            onChangeOptionText={handleChangeOptionText}
            editError={editError}
            onResetCorrection={handleResetCorrection}
            onCancelCorrection={closeEditMode}
            onSaveCorrection={handleSaveCorrection}
            onPrev={handlePrev}
            isPrevDisabled={currentIndex === 0}
            onNext={handleNext}
            isNextDisabled={
              (!randomNext && currentIndex === questionsInMode.length - 1) ||
              (randomNext && randomRangeStart === randomRangeEnd)
            }
            onCheckAnswer={handleCheckAnswer}
            onTryAgain={handleTryAgain}
            copyPulseKey={copyPulseKey}
          />
        </div>

        <QuestionHistory
          activeQuestions={activeQuestions}
          stats={stats}
          currentSubject={currentSubject}
          currentQuestionId={currentQuestion.id}
          answeredQuestionsCount={answeredQuestionsCount}
          correctAnswersCount={correctAnswersCount}
          incorrectAnswersCount={incorrectAnswersCount}
          totalAttempts={totalAttempts}
          correctPercentage={correctPercentage}
          incorrectPercentage={incorrectPercentage}
          historySearch={historySearch}
          onHistorySearchChange={setHistorySearch}
          historySort={historySort}
          onHistorySortChange={setHistorySort}
          expandedHistoryIds={expandedHistoryIds}
          onToggleExpandHistory={handleToggleExpandHistory}
          onSelectQuestionByIndex={handleSelectQuestionFromHistory}
        />
      </div>
    </div>
  );
}
