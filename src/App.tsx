import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { QuestionHistory } from './components/history/QuestionHistory.tsx';
import { QuestionCard } from './components/question/QuestionCard.tsx';
import { QuestionControls } from './components/question/QuestionControls.tsx';
import { SubjectSelector } from './components/question/SubjectSelector.tsx';
import bioData from './data/OtazkyBio.json';
import chemData from './data/OtazkyChem.json';
import type {
  AllStats,
  CopyStatus,
  EditableQuestion,
  ForcedKnowledgeState,
  HistorySort,
  Option,
  Question,
  QuestionMode,
  Subject,
} from './types.ts';
import {
  areAnswersEqual,
  formatQuestionForClipboard,
  getInitialRandomOptionLabels,
  getQuestionEditDiff,
  getQuestionStats,
  getRandomOptionLabels,
  getReshuffledOptionLabels,
} from './utils/questionUtils.ts';
import {
  getKnowledgeSummary,
  needsRevision,
  recordQuestionAttempt,
  setQuestionForcedState,
} from './utils/scoringUtils.ts';
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

const SECTION_CYCLE: Array<ForcedKnowledgeState | undefined> = [
  undefined,
  'knows',
  'almost',
  'doesnt-know',
];

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
  const [allOptionOrders, setAllOptionOrders] = useState<Record<string, string[]>>({});
  const [questionMode, setQuestionMode] = useState<QuestionMode>('all');
  const [revisionPinnedQuestionId, setRevisionPinnedQuestionId] = useState<string | null>(null);
  const [randomNext, setRandomNext] = useState(false);
  const [randomRange, setRandomRange] = useState({ start: 1, end: datasets.Biology.length });

  // Active question set and revision filter (Doesn't know + Almost knows)
  const activeQuestions = questions[currentSubject];
  const revisionQuestions = useMemo(
    () =>
      activeQuestions.filter((question) =>
        needsRevision(getQuestionStats(stats, currentSubject, question.id)),
      ),
    [activeQuestions, currentSubject, stats],
  );

  const revisionQuestionsWithPin = useMemo(
    () =>
      revisionPinnedQuestionId
        ? activeQuestions.filter(
            (question) =>
              question.id === revisionPinnedQuestionId ||
              needsRevision(getQuestionStats(stats, currentSubject, question.id)),
          )
        : revisionQuestions,
    [activeQuestions, currentSubject, revisionPinnedQuestionId, revisionQuestions, stats],
  );

  const effectiveQuestionMode: QuestionMode =
    questionMode === 'revision' && revisionQuestionsWithPin.length === 0 ? 'all' : questionMode;
  const isRevisionMode = effectiveQuestionMode === 'revision';
  const questionsInMode = isRevisionMode ? revisionQuestionsWithPin : activeQuestions;

  const randomRangeMax = Math.max(questionsInMode.length, 1);
  const randomRangeStart = isRevisionMode
    ? 1
    : Math.min(Math.max(randomRange.start, 1), randomRangeMax);
  const randomRangeEnd = isRevisionMode
    ? randomRangeMax
    : Math.min(
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
  const questionStageRef = useRef<HTMLDivElement>(null);
  const appLayoutRef = useRef<HTMLDivElement>(null);
  const copyPulseIdRef = useRef(0);
  const copyPulseTimerRef = useRef<number | null>(null);
  const copyStatusTimerRef = useRef<number | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySort>('ascending');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<EditableQuestion | null>(null);
  const [editingForcedState, setEditingForcedState] = useState<ForcedKnowledgeState | undefined>(
    undefined,
  );
  const [isEditing, setIsEditing] = useState(false);
  const editExitTimerRef = useRef<number | null>(null);
  const [editError, setEditError] = useState('');

  const currentQuestion = questionsInMode[safeCurrentIndex] ?? activeQuestions[0];
  const currentQuestionStats = getQuestionStats(stats, currentSubject, currentQuestion.id);
  const currentQuestionNumber = useMemo(() => {
    const index = activeQuestions.findIndex((question) => question.id === currentQuestion.id);
    return index >= 0 ? index + 1 : safeCurrentIndex + 1;
  }, [activeQuestions, currentQuestion.id, safeCurrentIndex]);

  const originalCurrentQuestion = useMemo(
    () => datasets[currentSubject].find((question) => question.id === currentQuestion.id),
    [currentQuestion.id, currentSubject],
  );

  const currentQuestionEditDiff = useMemo(
    () =>
      getQuestionEditDiff(
        isEditing && editingQuestion ? editingQuestion : currentQuestion,
        originalCurrentQuestion,
      ),
    [currentQuestion, editingQuestion, isEditing, originalCurrentQuestion],
  );

  const currentQuestionKey = `${currentSubject}:${currentQuestion.id}`;

  const orderedAllOptions = useMemo(() => {
    const customOrder = allOptionOrders[currentQuestionKey];
    if (!customOrder) {
      return currentQuestion.options;
    }
    const optionByLabel = new Map(
      currentQuestion.options.map((option) => [option.label, option] as const),
    );
    const ordered = customOrder
      .map((label) => optionByLabel.get(label))
      .filter((option): option is Option => Boolean(option));
    const seen = new Set(ordered.map((option) => option.label));
    const remaining = currentQuestion.options.filter((option) => !seen.has(option.label));
    return [...ordered, ...remaining];
  }, [allOptionOrders, currentQuestion.options, currentQuestionKey]);

  const displayedOptions = useMemo(() => {
    if (!fourAnswersOnly) {
      return orderedAllOptions;
    }
    const optionByLabel = new Map(
      orderedAllOptions.map((option) => [option.label, option] as const),
    );
    const labels = randomOptionLabels[currentQuestionKey] ?? [];
    const picked = labels
      .map((label) => optionByLabel.get(label))
      .filter((option): option is Option => Boolean(option));
    return picked.length > 0 ? picked : orderedAllOptions.slice(0, 4);
  }, [currentQuestionKey, fourAnswersOnly, orderedAllOptions, randomOptionLabels]);

  const normalModeOptions = useMemo(() => {
    if (!fourAnswersOnly) {
      return orderedAllOptions;
    }
    const visibleSet = new Set(displayedOptions.map((option) => option.label));
    return [
      ...displayedOptions,
      ...orderedAllOptions.filter((option) => !visibleSet.has(option.label)),
    ];
  }, [displayedOptions, fourAnswersOnly, orderedAllOptions]);

  // Keep desktop progress bar vertically centered with the top-right toggles
  useLayoutEffect(() => {
    const updateStatsBarAlignment = () => {
      const layoutEl = appLayoutRef.current;
      const stageEl = questionStageRef.current;
      if (!layoutEl || !stageEl) return;

      const statsHeaderEl = layoutEl.querySelector<HTMLElement>('.stats-header');
      const barEl = layoutEl.querySelector<HTMLElement>('.accuracy-bar-wrap');
      if (!statsHeaderEl || !barEl) return;

      if (window.innerWidth < 1024) {
        if (barEl.style.getPropertyValue('--stats-bar-offset')) {
          barEl.style.removeProperty('--stats-bar-offset');
        }
        return;
      }

      const toggleEls = stageEl.querySelectorAll<HTMLElement>('.toggle-switch-btn');
      if (toggleEls.length === 0) return;

      let minTop = Number.POSITIVE_INFINITY;
      let maxBottom = Number.NEGATIVE_INFINITY;
      for (const toggleEl of toggleEls) {
        const rect = toggleEl.getBoundingClientRect();
        if (rect.height === 0) continue;
        minTop = Math.min(minTop, rect.top);
        maxBottom = Math.max(maxBottom, rect.bottom);
      }
      if (!Number.isFinite(minTop) || !Number.isFinite(maxBottom)) return;

      const togglesMidY = (minTop + maxBottom) / 2;
      const statsTop = statsHeaderEl.getBoundingClientRect().top;
      const barHeight = barEl.getBoundingClientRect().height;
      const offset = Math.max(0, Math.round((togglesMidY - barHeight / 2 - statsTop) * 2) / 2);
      const nextValue = `${offset}px`;
      if (barEl.style.getPropertyValue('--stats-bar-offset') !== nextValue) {
        barEl.style.setProperty('--stats-bar-offset', nextValue);
      }
    };

    updateStatsBarAlignment();

    const layoutEl = appLayoutRef.current;
    const headerEl = questionStageRef.current?.querySelector<HTMLElement>('.question-header-bar');
    const controlsEl = questionStageRef.current?.querySelector<HTMLElement>('.question-controls');
    const observer = new ResizeObserver(updateStatsBarAlignment);
    if (layoutEl) observer.observe(layoutEl);
    if (headerEl) observer.observe(headerEl);
    if (controlsEl) observer.observe(controlsEl);
    window.addEventListener('resize', updateStatsBarAlignment);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateStatsBarAlignment);
    };
  }, []);

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
      setEditingForcedState(undefined);
    }, 220);
  }, []);

  const restoreQuestion = useCallback(() => {
    setRevisionPinnedQuestionId(null);
    setSelectedLabels([]);
    setIsEvaluated(false);
    if (editExitTimerRef.current !== null) {
      window.clearTimeout(editExitTimerRef.current);
      editExitTimerRef.current = null;
    }
    setIsEditing(false);
    setEditError('');
    setEditingQuestion(null);
    setEditingForcedState(undefined);
    if (copyPulseTimerRef.current !== null) {
      window.clearTimeout(copyPulseTimerRef.current);
      copyPulseTimerRef.current = null;
    }
    setCopyPulseKey(0);
    if (copyStatusTimerRef.current !== null) {
      window.clearTimeout(copyStatusTimerRef.current);
      copyStatusTimerRef.current = null;
    }
    setCopyStatus('idle');
  }, []);

  const randomizeQuestionOptions = useCallback((subject: Subject, question: Question) => {
    const questionKey = `${subject}:${question.id}`;
    setRandomOptionLabels((prev) => ({
      ...prev,
      [questionKey]: getRandomOptionLabels(question, prev[questionKey]),
    }));
    setAllOptionOrders((prev) => ({
      ...prev,
      [questionKey]: getReshuffledOptionLabels(
        question,
        prev[questionKey] ?? question.options.map((option) => option.label),
      ),
    }));
  }, []);

  const randomizeIfAnswered = useCallback(
    (subject: Subject, question: Question | undefined) => {
      if (!question) return;
      const targetStats = getQuestionStats(stats, subject, question.id);
      if (targetStats?.lastResult === 'correct' || targetStats?.lastResult === 'incorrect') {
        randomizeQuestionOptions(subject, question);
      }
    },
    [randomizeQuestionOptions, stats],
  );

  const handleSubjectChange = useCallback(
    (subject: Subject) => {
      if (subject === currentSubject) return;
      const targetActiveQuestions = questions[subject];
      const targetRevisionQuestions =
        questionMode === 'revision'
          ? targetActiveQuestions.filter((question) =>
              needsRevision(getQuestionStats(stats, subject, question.id)),
            )
          : targetActiveQuestions;
      const targetList =
        questionMode === 'revision' && targetRevisionQuestions.length > 0
          ? targetRevisionQuestions
          : targetActiveQuestions;
      randomizeIfAnswered(subject, targetList[0]);
      setCurrentSubject(subject);
      setCurrentIndex(0);
      restoreQuestion();
    },
    [currentSubject, questionMode, questions, randomizeIfAnswered, restoreQuestion, stats],
  );

  const handleQuestionModeChange = useCallback(
    (mode: QuestionMode) => {
      const targetList =
        mode === 'revision' && revisionQuestions.length > 0
          ? revisionQuestions
          : activeQuestions;
      randomizeIfAnswered(currentSubject, targetList[0]);
      setQuestionMode(mode);
      setCurrentIndex(0);
      restoreQuestion();
    },
    [activeQuestions, currentSubject, randomizeIfAnswered, restoreQuestion, revisionQuestions],
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
    const targetQuestion = questionsInMode[nextIndex];
    let resolvedIndex = nextIndex;
    if (effectiveQuestionMode === 'revision' && revisionPinnedQuestionId) {
      const unpinnedIdx = revisionQuestions.findIndex(
        (question) => question.id === targetQuestion.id,
      );
      resolvedIndex = unpinnedIdx >= 0 ? unpinnedIdx : 0;
    }

    randomizeIfAnswered(currentSubject, targetQuestion);
    setCurrentIndex(resolvedIndex);
    restoreQuestion();
  }, [
    currentSubject,
    effectiveQuestionMode,
    questionsInMode,
    randomizeIfAnswered,
    randomNext,
    randomRangeEnd,
    randomRangeStart,
    restoreQuestion,
    revisionPinnedQuestionId,
    revisionQuestions,
    safeCurrentIndex,
  ]);

  const handlePrev = useCallback(() => {
    if (safeCurrentIndex > 0) {
      const prevIndex = safeCurrentIndex - 1;
      const targetQuestion = questionsInMode[prevIndex];
      let resolvedIndex = prevIndex;
      if (effectiveQuestionMode === 'revision' && revisionPinnedQuestionId) {
        const unpinnedIdx = revisionQuestions.findIndex(
          (question) => question.id === targetQuestion.id,
        );
        resolvedIndex = unpinnedIdx >= 0 ? unpinnedIdx : 0;
      }

      randomizeIfAnswered(currentSubject, targetQuestion);
      setCurrentIndex(resolvedIndex);
      restoreQuestion();
    }
  }, [
    currentSubject,
    effectiveQuestionMode,
    questionsInMode,
    randomizeIfAnswered,
    restoreQuestion,
    revisionPinnedQuestionId,
    revisionQuestions,
    safeCurrentIndex,
  ]);

  const handleCheckAnswer = useCallback(() => {
    const correctLabels = displayedOptions
      .filter((option) => option.is_correct)
      .map((option) => option.label);
    const scoreWeight = displayedOptions.length / currentQuestion.options.length;
    const isCorrect =
      selectedLabels.length > 0 && areAnswersEqual(selectedLabels, correctLabels);

    const previousQuestionStats = getQuestionStats(
      stats,
      currentSubject,
      currentQuestion.id,
    );
    const nextQuestionStats = recordQuestionAttempt(previousQuestionStats, {
      isCorrect,
      selectedLabels,
      weight: scoreWeight,
    });

    if (effectiveQuestionMode === 'revision' && !needsRevision(nextQuestionStats)) {
      setRevisionPinnedQuestionId(currentQuestion.id);
    }

    setStats((previousStats) => ({
      ...previousStats,
      [currentSubject]: {
        ...previousStats[currentSubject],
        [currentQuestion.id]: nextQuestionStats,
      },
    }));
    setIsEvaluated(true);
  }, [
    currentQuestion.id,
    currentQuestion.options.length,
    currentSubject,
    displayedOptions,
    effectiveQuestionMode,
    selectedLabels,
    stats,
  ]);

  const handleTryAgain = useCallback(() => {
    randomizeQuestionOptions(currentSubject, currentQuestion);
    setSelectedLabels([]);
    setIsEvaluated(false);
  }, [currentQuestion, currentSubject, randomizeQuestionOptions]);

  const handleCopyCard = useCallback(async () => {
    const stageEl = questionStageRef.current;
    const cardEl = stageEl?.querySelector<HTMLElement>('.question-card');
    const activeTabEl = stageEl?.querySelector<HTMLElement>('.subject-tab-active');
    if (cardEl && activeTabEl) {
      const cardRect = cardEl.getBoundingClientRect();
      const tabRect = activeTabEl.getBoundingClientRect();
      const originX = cardRect.left + cardRect.width / 2 - tabRect.left;
      activeTabEl.style.setProperty('--copy-tab-origin-x', `${originX}px`);
    }

    const nextPulse = ++copyPulseIdRef.current;
    setCopyPulseKey(nextPulse);
    if (copyPulseTimerRef.current !== null) {
      window.clearTimeout(copyPulseTimerRef.current);
    }
    copyPulseTimerRef.current = window.setTimeout(() => {
      copyPulseTimerRef.current = null;
      setCopyPulseKey((current) => (current === nextPulse ? 0 : current));
    }, 1200);

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

    const trimmedQuestion = editingQuestion.question.trim();
    const trimmedOptions = editingQuestion.options.map((option) => ({
      ...option,
      text: option.text.trim(),
    }));
    const hasContentChanges =
      trimmedQuestion !== currentQuestion.question ||
      trimmedOptions.some((option, index) => {
        const originalOption = currentQuestion.options[index];
        return (
          option.text !== originalOption.text || option.is_correct !== originalOption.is_correct
        );
      });

    if (hasContentChanges) {
      const correctedQuestion: Question = {
        ...editingQuestion,
        question: trimmedQuestion,
        options: trimmedOptions,
      };

      const questionKey = `${currentSubject}:${correctedQuestion.id}`;
      setRandomOptionLabels((prev) => ({
        ...prev,
        [questionKey]: getRandomOptionLabels(correctedQuestion),
      }));
      setAllOptionOrders((prev) => {
        if (!(questionKey in prev)) return prev;
        const next = { ...prev };
        delete next[questionKey];
        return next;
      });

      setQuestions((previousQuestions) => ({
        ...previousQuestions,
        [currentSubject]: previousQuestions[currentSubject].map((question) =>
          question.id === correctedQuestion.id ? correctedQuestion : question,
        ),
      }));

      const nextQuestionStats = setQuestionForcedState(undefined, editingForcedState);
      setStats((previousStats) => {
        const nextSubjectStats = { ...previousStats[currentSubject] };
        if (nextQuestionStats) {
          nextSubjectStats[correctedQuestion.id] = nextQuestionStats;
        } else {
          delete nextSubjectStats[correctedQuestion.id];
        }
        return {
          ...previousStats,
          [currentSubject]: nextSubjectStats,
        };
      });

      setRevisionPinnedQuestionId(null);
      if (
        questionMode === 'revision' &&
        !needsRevision(nextQuestionStats) &&
        revisionQuestions.length <= 1
      ) {
        setQuestionMode('all');
        setCurrentIndex(0);
      }

      setSelectedLabels([]);
      setIsEvaluated(false);
    } else {
      const previousQuestionStats = getQuestionStats(stats, currentSubject, currentQuestion.id);
      const nextQuestionStats = setQuestionForcedState(previousQuestionStats, editingForcedState);

      setStats((previousStats) => {
        const nextSubjectStats = { ...previousStats[currentSubject] };
        if (nextQuestionStats) {
          nextSubjectStats[currentQuestion.id] = nextQuestionStats;
        } else {
          delete nextSubjectStats[currentQuestion.id];
        }
        return {
          ...previousStats,
          [currentSubject]: nextSubjectStats,
        };
      });

      if (effectiveQuestionMode === 'revision') {
        if (!needsRevision(nextQuestionStats)) {
          setRevisionPinnedQuestionId(currentQuestion.id);
        } else if (revisionPinnedQuestionId === currentQuestion.id) {
          setRevisionPinnedQuestionId(null);
        }
      }
    }

    closeEditMode();
  }, [
    closeEditMode,
    currentQuestion.id,
    currentQuestion.options,
    currentQuestion.question,
    currentSubject,
    editingForcedState,
    editingQuestion,
    effectiveQuestionMode,
    questionMode,
    revisionPinnedQuestionId,
    revisionQuestions.length,
    stats,
  ]);

  const handleOpenCorrection = useCallback(() => {
    if (isEditing && editingQuestion) {
      const hasContentChanges =
        editingQuestion.question !== currentQuestion.question ||
        editingQuestion.options.some((option, index) => {
          const originalOption = currentQuestion.options[index];
          return (
            option.text !== originalOption.text || option.is_correct !== originalOption.is_correct
          );
        });
      const hasForcedStateChange = editingForcedState !== currentQuestionStats?.forcedState;

      if (!hasContentChanges && !hasForcedStateChange) {
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
    setEditingForcedState(currentQuestionStats?.forcedState);
    setEditError('');
    setIsEditing(true);
  }, [
    closeEditMode,
    currentQuestion,
    currentQuestionStats?.forcedState,
    editingForcedState,
    editingQuestion,
    handleSaveCorrection,
    isEditing,
  ]);

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
    setEditingForcedState(undefined);
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

  const handleCycleEditingForcedState = useCallback(() => {
    setEditingForcedState((prev) => {
      const currentIdx = SECTION_CYCLE.indexOf(prev);
      return SECTION_CYCLE[(currentIdx + 1) % SECTION_CYCLE.length];
    });
  }, []);

  const handleSelectQuestionFromHistory = useCallback(
    (index: number) => {
      randomizeIfAnswered(currentSubject, activeQuestions[index]);
      setQuestionMode('all');
      setCurrentIndex(index);
      restoreQuestion();
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    },
    [activeQuestions, currentSubject, randomizeIfAnswered, restoreQuestion],
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

  // Aggregated knowledge stats calculations
  const knowledgeSummary = useMemo(
    () => getKnowledgeSummary(activeQuestions, stats[currentSubject]),
    [activeQuestions, currentSubject, stats],
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
      <div
        ref={appLayoutRef}
        className="app-layout grid w-full items-start lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(18.5rem,0.78fr)]"
      >
        <div ref={questionStageRef} className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          <div className="question-header-bar">
            <SubjectSelector
              currentSubject={currentSubject}
              onSelectSubject={handleSubjectChange}
              questionNumber={currentQuestionNumber}
              isEditing={isEditing}
              isRevision={isRevisionMode}
              isCopied={copyStatus === 'copied'}
              copyPulseKey={copyPulseKey}
              randomNext={randomNext}
              randomRangeStart={randomRangeStart}
              randomRangeEnd={randomRangeEnd}
              randomRangeMax={randomRangeMax}
              onRandomRangeStartChange={handleRandomRangeStartChange}
              onRandomRangeEndChange={handleRandomRangeEndChange}
            />
            <QuestionControls
              questionMode={effectiveQuestionMode}
              onModeChange={handleQuestionModeChange}
              revisionCount={revisionQuestions.length}
              randomNext={randomNext}
              onToggleRandomNext={handleRandomNextToggle}
              fourAnswersOnly={fourAnswersOnly}
              onToggleFourAnswers={handleFourAnswersToggle}
            />
          </div>

          <QuestionCard
            currentSubject={currentSubject}
            currentQuestion={currentQuestion}
            questionStats={currentQuestionStats}
            displayedOptions={displayedOptions}
            orderedOptions={normalModeOptions}
            selectedLabels={selectedLabels}
            isEvaluated={isEvaluated}
            onToggleOption={handleToggleOption}
            copyStatus={copyStatus}
            onCopy={handleCopyCard}
            isEditing={isEditing}
            onToggleEdit={handleOpenCorrection}
            editingQuestion={editingQuestion}
            editingForcedState={editingForcedState}
            editDiff={currentQuestionEditDiff}
            onChangeQuestionText={handleChangeQuestionText}
            onToggleOptionCorrect={handleToggleOptionCorrect}
            onChangeOptionText={handleChangeOptionText}
            onCycleEditingForcedState={handleCycleEditingForcedState}
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
          knowledgeSummary={knowledgeSummary}
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
