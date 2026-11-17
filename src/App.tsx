import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QuestionHistory } from './components/history/QuestionHistory.tsx';
import { QuestionCard } from './components/question/QuestionCard.tsx';
import { QuestionControls } from './components/question/QuestionControls.tsx';
import { SubjectSelector } from './components/question/SubjectSelector.tsx';
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
  getRandomOptionLabels,
  roundStat,
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
  const [randomOptionLabels, setRandomOptionLabels] = useState<Record<string, string[]>>(() =>
    getInitialRandomOptionLabels(questions),
  );
  const [questionMode, setQuestionMode] = useState<QuestionMode>('all');
  const [randomNext, setRandomNext] = useState(false);
  const [randomRange, setRandomRange] = useState({ start: 1, end: datasets.Biology.length });

  // Active question set and revision filter
  const activeQuestions = questions[currentSubject];
  const revisionQuestions = useMemo(
    () =>
      activeQuestions.filter(
        (question) => (getQuestionStats(stats, currentSubject, question.id)?.incorrect ?? 0) > 0,
      ),
    [activeQuestions, currentSubject, stats],
  );

  const effectiveQuestionMode: QuestionMode =
    questionMode === 'revision' && revisionQuestions.length === 0 ? 'all' : questionMode;
  const questionsInMode =
    effectiveQuestionMode === 'revision' ? revisionQuestions : activeQuestions;

  const randomRangeMax = Math.max(questionsInMode.length, 1);
  const randomRangeStart = Math.min(Math.max(randomRange.start, 1), randomRangeMax);
  const randomRangeEnd = Math.min(
    Math.max(randomRange.end, randomRangeStart),
    Math.max(questionsInMode.length, randomRangeStart),
  );

  // Question navigation and answer states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const safeCurrentIndex = Math.min(
    currentIndex,
    Math.max(questionsInMode.length - 1, 0),
  );

  const [selectedLabels, setSelectedLabels] = useState<string[]>(() => {
    const initialStats = getQuestionStats(stats, 'Biology', questions.Biology[0].id);
    return initialStats?.lastResult === 'correct' || initialStats?.lastResult === 'incorrect'
      ? initialStats.lastAnswer
      : [];
  });
  const [isEvaluated, setIsEvaluated] = useState<boolean>(() => {
    const initialResult = getQuestionStats(stats, 'Biology', questions.Biology[0].id)?.lastResult;
    return initialResult === 'correct' || initialResult === 'incorrect';
  });

  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [copyPulseKey, setCopyPulseKey] = useState<number>(0);
  const copyPulseIdRef = useRef(0);
  const copyPulseTimerRef = useRef<number | null>(null);
  const copyStatusTimerRef = useRef<number | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySort>('ascending');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<EditableQuestion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const editExitTimerRef = useRef<number | null>(null);
  const [editError, setEditError] = useState('');

  const currentQuestion = questionsInMode[safeCurrentIndex] ?? activeQuestions[0];
  const displayedOptions = useMemo(() => {
    if (!fourAnswersOnly) {
      return currentQuestion.options;
    }
    const labels = randomOptionLabels[`${currentSubject}:${currentQuestion.id}`] ?? [];
    return currentQuestion.options.filter((option) => labels.includes(option.label));
  }, [currentQuestion, currentSubject, fourAnswersOnly, randomOptionLabels]);

  // Persist state updates to localStorage (skipping redundant initial mount write)
  const didMountStatsRef = useRef(false);
  useEffect(() => {
    if (!didMountStatsRef.current) {
      didMountStatsRef.current = true;
      return;
    }
    saveStoredStats(stats);
  }, [stats]);

  const didMountQuestionsRef = useRef(false);
  useEffect(() => {
    if (!didMountQuestionsRef.current) {
      didMountQuestionsRef.current = true;
      return;
    }
    saveStoredQuestions(questions);
  }, [questions]);

  const didMountFourAnswersRef = useRef(false);
  useEffect(() => {
    if (!didMountFourAnswersRef.current) {
      didMountFourAnswersRef.current = true;
      return;
    }
    saveStoredFourAnswers(fourAnswersOnly);
  }, [fourAnswersOnly]);

  // Clean up pending timers on unmount
  useEffect(
    () => () => {
      if (copyPulseTimerRef.current !== null) {
        window.clearTimeout(copyPulseTimerRef.current);
      }
      if (copyStatusTimerRef.current !== null) {
        window.clearTimeout(copyStatusTimerRef.current);
      }
      if (editExitTimerRef.current !== null) {
        window.clearTimeout(editExitTimerRef.current);
      }
    },
    [],
  );

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

  const handleSubjectChange = useCallback(
    (subject: Subject) => {
      setCurrentSubject(subject);
      setCurrentIndex(0);
      restoreQuestion();
    },
    [restoreQuestion],
  );

  const handleQuestionModeChange = useCallback(
    (mode: QuestionMode) => {
      setQuestionMode(mode);
      setCurrentIndex(0);
      restoreQuestion();
    },
    [restoreQuestion],
  );

  const handleFourAnswersToggle = useCallback(() => {
    setFourAnswersOnly((prev) => !prev);
    restoreQuestion();
  }, [restoreQuestion]);

  const handleRandomNextToggle = useCallback(() => {
    setRandomNext((prev) => !prev);
  }, []);

  const handleRandomRangeStartChange = useCallback(
    (value: number) => {
      if (!Number.isFinite(value)) return;
      const start = Math.min(Math.max(Math.round(value), 1), randomRangeEnd);
      setRandomRange((previous) => ({ start, end: Math.max(previous.end, start) }));
    },
    [randomRangeEnd],
  );

  const handleRandomRangeEndChange = useCallback(
    (value: number) => {
      if (!Number.isFinite(value)) return;
      const end = Math.min(
        Math.max(Math.round(value), randomRangeStart),
        Math.max(questionsInMode.length, randomRangeStart),
      );
      setRandomRange((previous) => ({ start: Math.min(previous.start, end), end }));
    },
    [questionsInMode.length, randomRangeStart],
  );

  const handleToggleOption = useCallback(
    (label: string) => {
      if (isEvaluated) return;
      setSelectedLabels((prev) =>
        prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label],
      );
    },
    [isEvaluated],
  );

  const handleNext = useCallback(() => {
    if (questionsInMode.length <= 1) return;

    let nextIndex: number;
    if (randomNext) {
      const startIdx = randomRangeStart - 1;
      const endIdx = randomRangeEnd - 1;
      const totalInRange = endIdx - startIdx + 1;
      const isCurrentInRange = safeCurrentIndex >= startIdx && safeCurrentIndex <= endIdx;
      const availableCount = totalInRange - (isCurrentInRange ? 1 : 0);
      if (availableCount <= 0) return;

      const offset = Math.floor(Math.random() * availableCount);
      const candidate = startIdx + offset;
      nextIndex =
        isCurrentInRange && candidate >= safeCurrentIndex ? candidate + 1 : candidate;
    } else {
      nextIndex = safeCurrentIndex + 1;
    }

    if (nextIndex < 0 || nextIndex >= questionsInMode.length) return;
    setCurrentIndex(nextIndex);
    restoreQuestion();
  }, [
    questionsInMode.length,
    randomNext,
    randomRangeEnd,
    randomRangeStart,
    restoreQuestion,
    safeCurrentIndex,
  ]);

  const handlePrev = useCallback(() => {
    if (safeCurrentIndex > 0) {
      setCurrentIndex(safeCurrentIndex - 1);
      restoreQuestion();
    }
  }, [restoreQuestion, safeCurrentIndex]);

  const handleCheckAnswer = useCallback(() => {
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
        correct: roundStat(
          (previousQuestionStats?.correct ?? 0) + (result === 'correct' ? scoreWeight : 0),
        ),
        incorrect: roundStat(
          (previousQuestionStats?.incorrect ?? 0) + (result === 'incorrect' ? scoreWeight : 0),
        ),
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
  }, [currentQuestion.id, currentQuestion.options.length, currentSubject, displayedOptions, selectedLabels]);

  const handleTryAgain = useCallback(() => {
    setSelectedLabels([]);
    setIsEvaluated(false);
  }, []);

  const handleCopyCard = useCallback(async () => {
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

    if (copyStatusTimerRef.current !== null) {
      window.clearTimeout(copyStatusTimerRef.current);
    }
    copyStatusTimerRef.current = window.setTimeout(() => {
      copyStatusTimerRef.current = null;
      setCopyStatus('idle');
    }, 2000);
  }, [currentQuestion, currentSubject, selectedLabels, stats]);

  const handleSaveCorrection = useCallback(() => {
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

    const questionKey = `${currentSubject}:${correctedQuestion.id}`;
    setRandomOptionLabels((prev) => ({
      ...prev,
      [questionKey]: getRandomOptionLabels(correctedQuestion),
    }));

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

    if (questionMode === 'revision' && revisionQuestions.length <= 1) {
      setQuestionMode('all');
      setCurrentIndex(0);
    }

    setSelectedLabels([]);
    setIsEvaluated(false);
    closeEditMode();
  }, [closeEditMode, currentSubject, editingQuestion, questionMode, revisionQuestions.length]);

  const handleOpenCorrection = useCallback(() => {
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
  }, [closeEditMode, currentQuestion, editingQuestion, handleSaveCorrection, isEditing]);

  const handleResetCorrection = useCallback(() => {
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
  }, [currentSubject, editingQuestion]);

  const handleChangeQuestionText = useCallback((text: string) => {
    setEditingQuestion((prev) => (prev ? { ...prev, question: text } : prev));
  }, []);

  const handleToggleOptionCorrect = useCallback((optionIndex: number, isCorrect: boolean) => {
    setEditingQuestion((prev) => {
      if (!prev) return prev;
      const options = prev.options.map((option, index) =>
        index === optionIndex ? { ...option, is_correct: isCorrect } : option,
      );
      return { ...prev, options };
    });
  }, []);

  const handleChangeOptionText = useCallback((optionIndex: number, text: string) => {
    setEditingQuestion((prev) => {
      if (!prev) return prev;
      const options = prev.options.map((option, index) =>
        index === optionIndex ? { ...option, text } : option,
      );
      return { ...prev, options };
    });
  }, []);

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
      correctAnswersCount: roundStat(correct),
      incorrectAnswersCount: roundStat(incorrect),
    };
  }, [activeQuestions, currentSubject, stats]);

  const totalAttempts = roundStat(correctAnswersCount + incorrectAnswersCount);
  const correctPercentage = totalAttempts
    ? Math.round((correctAnswersCount / totalAttempts) * 100)
    : 0;
  const incorrectPercentage = totalAttempts ? 100 - correctPercentage : 0;

  const questionCounts = useMemo<Record<Subject, number>>(
    () => ({
      Biology: questions.Biology.length,
      Chemistry: questions.Chemistry.length,
    }),
    [questions.Biology.length, questions.Chemistry.length],
  );

  const totalInRange = randomRangeEnd - randomRangeStart + 1;
  const isCurrentInRange =
    safeCurrentIndex >= randomRangeStart - 1 && safeCurrentIndex <= randomRangeEnd - 1;
  const availableRandomCount = totalInRange - (isCurrentInRange ? 1 : 0);
  const isNextDisabled = randomNext
    ? availableRandomCount <= 0
    : safeCurrentIndex >= questionsInMode.length - 1;

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
            questionMode={effectiveQuestionMode}
            onModeChange={handleQuestionModeChange}
            revisionCount={revisionQuestions.length}
            subject={currentSubject}
            currentIndex={safeCurrentIndex}
            copyStatus={copyStatus}
            onCopy={handleCopyCard}
            isEditing={isEditing}
            onToggleEdit={handleOpenCorrection}
            randomNext={randomNext}
            onToggleRandomNext={handleRandomNextToggle}
            randomRangeStart={randomRangeStart}
            randomRangeEnd={randomRangeEnd}
            randomRangeMax={randomRangeMax}
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
            isPrevDisabled={safeCurrentIndex === 0}
            onNext={handleNext}
            isNextDisabled={isNextDisabled}
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
