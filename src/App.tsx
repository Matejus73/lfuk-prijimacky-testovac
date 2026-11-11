import { useEffect, useState } from 'react';
import bioData from './data/OtazkyBio.json';
import chemData from './data/OtazkyChem.json';
import type { AllStats, AnswerResult, Question, QuestionStats, Subject } from './types';

// Map subjects to their respective data arrays
const datasets: Record<Subject, Question[]> = {
  Biology: bioData as Question[],
  Chemistry: chemData as Question[],
};

const STATS_STORAGE_KEY = 'testovac-question-stats';
const QUESTIONS_STORAGE_KEY = 'testovac-questions';
const FOUR_ANSWERS_STORAGE_KEY = 'testovac-four-answers';
type HistorySort = 'ascending' | 'descending' | 'most-wrong' | 'most-correct';
type QuestionMode = 'all' | 'revision';
type EditableQuestion = Question & { options: Question['options'] };

const emptyStats = (): AllStats => ({
  Biology: {},
  Chemistry: {},
});

const loadStats = (): AllStats => {
  const defaults = emptyStats();
  let savedStats: string | null = null;

  try {
    savedStats = localStorage.getItem(STATS_STORAGE_KEY);
  } catch {
    return defaults;
  }

  if (!savedStats) return defaults;

  try {
    const parsed = JSON.parse(savedStats) as Partial<AllStats>;
    return {
      Biology: parsed.Biology ?? {},
      Chemistry: parsed.Chemistry ?? {},
    };
  } catch {
    return defaults;
  }
};

const loadQuestions = (): Record<Subject, Question[]> => {
  const defaults = {
    Biology: datasets.Biology,
    Chemistry: datasets.Chemistry,
  };
  let savedQuestions: string | null = null;

  try {
    savedQuestions = localStorage.getItem(QUESTIONS_STORAGE_KEY);
  } catch {
    return defaults;
  }

  if (!savedQuestions) return defaults;

  try {
    const parsed = JSON.parse(savedQuestions) as Partial<Record<Subject, Question[]>>;
    if (!Array.isArray(parsed.Biology) || !Array.isArray(parsed.Chemistry)) return defaults;
    return {
      Biology: parsed.Biology,
      Chemistry: parsed.Chemistry,
    };
  } catch {
    return defaults;
  }
};

const getQuestionStats = (
  stats: AllStats,
  subject: Subject,
  questionId: string,
): QuestionStats | undefined => stats[subject][questionId];

const areAnswersEqual = (selectedLabels: string[], correctLabels: string[]) =>
  selectedLabels.length === correctLabels.length &&
  selectedLabels.every((label) => correctLabels.includes(label));

const shuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

const getRandomOptionLabels = (question: Question) =>
  shuffle(question.options).slice(0, Math.min(4, question.options.length)).map((option) => option.label);

const getInitialRandomOptionLabels = (questionSet: Record<Subject, Question[]>) =>
  Object.fromEntries(
    (Object.keys(questionSet) as Subject[]).flatMap((subject) =>
      questionSet[subject].map((question) => [
        `${subject}:${question.id}`,
        getRandomOptionLabels(question),
      ]),
    ),
  ) as Record<string, string[]>;

export default function App() {
  // 1. Current selected subject
  const [currentSubject, setCurrentSubject] = useState<Subject>('Biology');
  const [questions, setQuestions] = useState<Record<Subject, Question[]>>(() => loadQuestions());
  const [stats, setStats] = useState<AllStats>(() => loadStats());
  const [fourAnswersOnly, setFourAnswersOnly] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FOUR_ANSWERS_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [randomOptionLabels] = useState<Record<string, string[]>>(() =>
    getInitialRandomOptionLabels(questions),
  );
  const [questionMode, setQuestionMode] = useState<QuestionMode>('all');
  const [randomNext, setRandomNext] = useState(false);

  // Active question set based on subject choice
  const activeQuestions = questions[currentSubject];
  const revisionQuestions = activeQuestions
    .map((question, index) => ({
      question,
      index,
      incorrect: getQuestionStats(stats, currentSubject, question.id)?.incorrect ?? 0,
    }))
    .filter(({ incorrect }) => incorrect > 0);
  const questionsInMode = questionMode === 'revision'
    ? revisionQuestions.map(({ question }) => question)
    : activeQuestions;

  // 2. Question index and answer states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    () => getQuestionStats(stats, 'Biology', questions.Biology[0].id)?.lastAnswer ?? [],
  );
  const [isEvaluated, setIsEvaluated] = useState<boolean>(
    () => Boolean(getQuestionStats(stats, 'Biology', questions.Biology[0].id)?.lastResult),
  );
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [historySearch, setHistorySearch] = useState('');
  const [historySort, setHistorySort] = useState<HistorySort>('ascending');
  const [expandedHistoryIds, setExpandedHistoryIds] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<EditableQuestion | null>(null);
  const [editError, setEditError] = useState('');

  const currentQuestion = questionsInMode[currentIndex] ?? activeQuestions[0];
  const displayedOptions = fourAnswersOnly
    ? currentQuestion.options.filter((option) =>
      (randomOptionLabels[`${currentSubject}:${currentQuestion.id}`] ?? []).includes(option.label),
    )
    : currentQuestion.options;

  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // Persistence can be unavailable in private browsing or restricted storage contexts.
    }
  }, [stats]);

  useEffect(() => {
    try {
      localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
    } catch {
      // Persistence can be unavailable in private browsing or restricted storage contexts.
    }
  }, [questions]);

  useEffect(() => {
    try {
      localStorage.setItem(FOUR_ANSWERS_STORAGE_KEY, String(fourAnswersOnly));
    } catch {
      // Persistence can be unavailable in private browsing or restricted storage contexts.
    }
  }, [fourAnswersOnly]);

  const restoreQuestion = () => {
    setSelectedLabels([]);
    setIsEvaluated(false);
  };

  // Handle switching subjects and reset progress
  const handleSubjectChange = (subject: Subject) => {
    setCurrentSubject(subject);
    setCurrentIndex(0);
    restoreQuestion();
  };

  const handleQuestionModeChange = (mode: QuestionMode) => {
    setQuestionMode(mode);
    setCurrentIndex(0);
    setSelectedLabels([]);
    setIsEvaluated(false);
  };

  const handleFourAnswersToggle = () => {
    setFourAnswersOnly((previousValue) => !previousValue);
    setSelectedLabels([]);
    setIsEvaluated(false);
  };

  const handleRandomNextToggle = () => {
    setRandomNext((previousValue) => !previousValue);
  };

  const handleToggleOption = (label: string) => {
    if (isEvaluated) return;
    setSelectedLabels((prev) =>
        prev.includes(label)
            ? prev.filter((item) => item !== label)
            : [...prev, label]
    );
  };

  const handleNext = () => {
    if (questionsInMode.length > 1) {
      const availableIndexes = questionsInMode
        .map((_, index) => index)
        .filter((index) => index !== currentIndex);
      const nextIndex = randomNext
        ? availableIndexes[Math.floor(Math.random() * availableIndexes.length)]
        : currentIndex + 1;
      if (nextIndex >= questionsInMode.length) return;
      setCurrentIndex(nextIndex);
      restoreQuestion();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      setCurrentIndex(previousIndex);
      restoreQuestion();
    }
  };

  const handleCheckAnswer = () => {
    const correctLabels = displayedOptions
      .filter((option) => option.is_correct)
      .map((option) => option.label);
    const scoreWeight = displayedOptions.length / currentQuestion.options.length;
    const result: AnswerResult = selectedLabels.length === 0
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
    const answerText = selectedLabels.length ? selectedLabels.join(', ') : 'No answer';
    const resultText = getQuestionStats(stats, currentSubject, currentQuestion.id)?.lastResult;
    const cardText = [
      `${currentSubject} - ${currentQuestion.id}`,
      currentQuestion.question,
      '',
      ...currentQuestion.options.map((option) =>
        `${selectedLabels.includes(option.label) ? '[x]' : '[ ]'} ${option.label}) ${option.text}`,
      ),
      '',
      `My last answer: ${answerText}`,
      ...(resultText ? [`Result: ${resultText}`] : []),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(cardText);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }

    window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const handleOpenCorrection = () => {
    setEditingQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map((option) => ({ ...option })),
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
        Object.entries(previousStats[currentSubject]).filter(([questionId]) =>
          questionId !== correctedQuestion.id,
        ),
      ),
    }));
    setSelectedLabels([]);
    setIsEvaluated(false);
    setEditingQuestion(null);
    setEditError('');
  };

  const answeredQuestions = activeQuestions.filter((question) =>
    ['correct', 'incorrect'].includes(
      getQuestionStats(stats, currentSubject, question.id)?.lastResult ?? '',
    ),
  ).length;
  const correctAnswers = activeQuestions.reduce(
    (total, question) => total + (getQuestionStats(stats, currentSubject, question.id)?.correct ?? 0),
    0,
  );
  const incorrectAnswers = activeQuestions.reduce(
    (total, question) => total + (getQuestionStats(stats, currentSubject, question.id)?.incorrect ?? 0),
    0,
  );
  const totalAttempts = correctAnswers + incorrectAnswers;
  const correctPercentage = totalAttempts ? Math.round((correctAnswers / totalAttempts) * 100) : 0;
  const incorrectPercentage = totalAttempts ? Math.round((incorrectAnswers / totalAttempts) * 100) : 0;
  const normalizedHistorySearch = historySearch.trim().toLocaleLowerCase();
  const filteredHistoryQuestions = activeQuestions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) =>
      `${question.id} ${question.question}`.toLocaleLowerCase().includes(normalizedHistorySearch),
    )
    .sort((left, right) => {
      const leftStats = getQuestionStats(stats, currentSubject, left.question.id);
      const rightStats = getQuestionStats(stats, currentSubject, right.question.id);

      if (historySort === 'most-wrong') {
        return (rightStats?.incorrect ?? 0) - (leftStats?.incorrect ?? 0);
      }
      if (historySort === 'most-correct') {
        return (rightStats?.correct ?? 0) - (leftStats?.correct ?? 0);
      }

      const questionOrder = left.index - right.index;
      return historySort === 'ascending' ? questionOrder : -questionOrder;
    });
  return (
      <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-5 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:p-6">

        <div className="grid w-full items-start gap-4 lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,1fr)]">
          <div className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
            {/* Subject Switcher Bar */}
            <div className="mb-4 flex w-full flex-wrap gap-2">
              {(['Biology', 'Chemistry'] as Subject[]).map((subject) => (
                  <button
                      key={subject}
                      onClick={() => handleSubjectChange(subject)}
                      className={`min-w-[9rem] flex-1 rounded-lg py-3 text-base font-semibold transition ${
                          currentSubject === subject
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-white text-gray-700 border hover:bg-gray-50'
                      }`}
                  >
                    {subject} ({questions[subject].length})
                  </button>
              ))}
            </div>

            {/* Question Controls */}
            <div className="mb-3 space-y-3 rounded-xl bg-white p-3 shadow-md sm:p-4">
              <div className="flex rounded-lg bg-gray-100 p-1">
                {(['all', 'revision'] as QuestionMode[]).map((mode) => (
                  <button
                      key={mode}
                      onClick={() => handleQuestionModeChange(mode)}
                      disabled={mode === 'revision' && revisionQuestions.length === 0}
                      className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                        questionMode === mode
                          ? mode === 'revision' ? 'bg-rose-600 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40'
                      }`}
                  >
                    {mode === 'all' ? 'All questions' : `Revision (${revisionQuestions.length})`}
                  </button>
                ))}
              </div>
              <div className="relative flex min-h-9 items-center justify-center">
                <span className="text-sm font-bold tracking-wide text-gray-700">
                  {currentSubject === 'Biology' ? 'BIO' : 'CHEM'} {currentIndex + 1}
                </span>
                <div className="absolute left-0 flex shrink-0 items-center gap-1">
                  <button
                      onClick={handleCopyCard}
                      title={copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy question card'}
                      aria-label={copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy question card'}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 transition hover:bg-gray-50"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="10" height="10" rx="1" />
                      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
                    </svg>
                  </button>
                  <button
                      onClick={handleOpenCorrection}
                      title="Correct this question"
                      aria-label="Correct this question"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 transition hover:bg-amber-100"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
                    </svg>
                  </button>
                </div>
                <div className="absolute right-0 flex shrink-0 items-center gap-1">
                  <span className="text-xs font-semibold text-gray-500">Random:</span>
                  <button
                      type="button"
                      role="switch"
                      aria-checked={randomNext}
                      onClick={handleRandomNextToggle}
                      title={randomNext ? 'Next question is random' : 'Next question follows order'}
                      aria-label={randomNext ? 'Next question is random' : 'Next question follows order'}
                      className={`relative h-6 w-11 rounded-full text-[10px] font-bold transition ${
                        randomNext ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                      }`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">{randomNext ? 'on' : 'off'}</span>
                  </button>
                  <span className="text-xs font-semibold text-gray-500">Answers:</span>
                  <button
                      type="button"
                      role="switch"
                      aria-checked={fourAnswersOnly}
                      onClick={handleFourAnswersToggle}
                      title={fourAnswersOnly ? 'Show all answers' : 'Show 4 random answers'}
                      aria-label={fourAnswersOnly ? 'Show all answers' : 'Show 4 random answers'}
                      className={`relative h-6 w-11 rounded-full text-[10px] font-bold transition ${
                        fourAnswersOnly ? 'bg-blue-600' : 'bg-gray-300 text-gray-700'
                      }`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center">{fourAnswersOnly ? '4' : 'all'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Question Card */}
          <div
              className="flex h-[calc(100dvh-8rem)] min-h-0 min-w-0 flex-col rounded-xl bg-white p-4 shadow-md sm:p-6 lg:h-auto lg:flex-1"
          >

          {/* Header / Meta */}
          <div className="hidden">
            {(['all', 'revision'] as QuestionMode[]).map((mode) => (
              <button
                  key={mode}
                  onClick={() => handleQuestionModeChange(mode)}
                  disabled={mode === 'revision' && revisionQuestions.length === 0}
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
                    questionMode === mode
                      ? mode === 'revision' ? 'bg-rose-600 text-white shadow-sm' : 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40'
                  }`}
              >
                {mode === 'all'
                  ? 'All questions'
                  : `Revision (${revisionQuestions.length})`}
              </button>
            ))}
          </div>

          <div className="hidden">
            <span className="text-sm font-bold tracking-wide text-gray-700">
              {currentSubject === 'Biology' ? 'BIO' : 'CHEM'} {currentIndex + 1}
            </span>
          <div className="absolute left-0 flex shrink-0 items-center gap-1">
            <button
                onClick={handleCopyCard}
                title={copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy question card'}
                aria-label={copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy question card'}
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-gray-600 transition hover:bg-gray-50"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="10" height="10" rx="1" />
                <path d="M5 15V5a1 1 0 0 1 1-1h10" />
              </svg>
            </button>
            <button
                onClick={handleOpenCorrection}
                title="Correct this question"
                aria-label="Correct this question"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 transition hover:bg-amber-100"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
              </svg>
            </button>
          </div>
          <div className="absolute right-0 flex shrink-0 items-center gap-1">
            <span className="text-xs font-semibold text-gray-500">Random:</span>
            <button
                type="button"
                role="switch"
                aria-checked={randomNext}
                onClick={handleRandomNextToggle}
                title={randomNext ? 'Next question is random' : 'Next question follows order'}
                aria-label={randomNext ? 'Next question is random' : 'Next question follows order'}
                className={`relative h-6 w-11 rounded-full text-[10px] font-bold transition ${
                  randomNext ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-700'
                }`}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {randomNext ? 'on' : 'off'}
              </span>
            </button>
            <span className="text-xs font-semibold text-gray-500">Answers:</span>
            <button
                type="button"
                role="switch"
                aria-checked={fourAnswersOnly}
                onClick={handleFourAnswersToggle}
                title={fourAnswersOnly ? 'Show all answers' : 'Show 4 random answers'}
                aria-label={fourAnswersOnly ? 'Show all answers' : 'Show 4 random answers'}
                className={`relative h-6 w-11 rounded-full text-[10px] font-bold transition ${
                  fourAnswersOnly ? 'bg-blue-600' : 'bg-gray-300'
                }`}
            >
              <span className="absolute inset-0 flex items-center justify-center">
                {fourAnswersOnly ? '4' : 'all'}
              </span>
            </button>
          </div>
          </div>

          {/* Question Text */}
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options List */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {displayedOptions.map((option) => {
              const isChecked = selectedLabels.includes(option.label);

              let borderClass = 'border-gray-200 hover:border-blue-400';
              let bgClass = 'bg-white';

              if (isEvaluated) {
                if (option.is_correct) {
                  borderClass = 'border-emerald-500';
                  bgClass = 'bg-emerald-50 text-emerald-900';
                } else if (isChecked && !option.is_correct) {
                  borderClass = 'border-rose-500';
                  bgClass = 'bg-rose-50 text-rose-900';
                }
              } else if (isChecked) {
                borderClass = 'border-blue-500';
                bgClass = 'bg-blue-50';
              }

              return (
                  <label
                      key={option.label}
                      className={`flex items-start p-3.5 border-2 rounded-lg cursor-pointer transition ${borderClass} ${bgClass}`}
                  >
                    <input
                        type="checkbox"
                        disabled={isEvaluated}
                        checked={isChecked}
                        onChange={() => handleToggleOption(option.label)}
                        className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 font-semibold text-gray-700 uppercase">
                  {option.label})
                </span>
                    <span className="ml-2 text-gray-800 leading-snug">
                  {option.text}
                </span>
                  </label>
              );
            })}
          </div>

          {/* Navigation & Action Controls */}
          <div className="mt-auto flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-white pb-1 pt-4">
            <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                title="Previous question"
                aria-label="Previous question"
                className="flex h-10 w-10 items-center justify-center rounded-lg border text-xl font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {!isEvaluated ? (
                  <button
                      onClick={handleCheckAnswer}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Check Answer
                  </button>
              ) : (
                  <div className="flex gap-2">
                  <button
                      onClick={handleTryAgain}
                      className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Try Again
                  </button>
                  </div>
              )}
            </div>

            <button
                onClick={handleNext}
                disabled={!randomNext && currentIndex === questionsInMode.length - 1}
                title="Next question"
                aria-label="Next question"
                className="flex h-10 w-10 items-center justify-center rounded-lg border text-xl font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>
          </div>

          </div>
          </div>

        {/* Persistent Progress */}
        <div className="min-h-0 min-w-0 rounded-xl bg-white p-4 shadow-md sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden">
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
              <span className="font-bold">{activeQuestions.length - answeredQuestions}</span> unanswered
            </div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <span className="font-bold">{correctAnswers}</span> correct
            </div>
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
              <span className="font-bold">{incorrectAnswers}</span> incorrect
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-600">
              <span>Answer accuracy</span>
              <span>{totalAttempts} graded attempts</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-gray-200">
              {correctPercentage > 0 && (
                <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${correctPercentage}%` }}
                    title={`${correctPercentage}% correct`}
                />
              )}
              {incorrectPercentage > 0 && (
                <div
                    className="bg-rose-500 transition-all"
                    style={{ width: `${incorrectPercentage}%` }}
                    title={`${incorrectPercentage}% incorrect`}
                />
              )}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-600">
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />Correct {correctPercentage}%</span>
              <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />Incorrect {incorrectPercentage}%</span>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-3">Question history</h2>
          <label className="mb-4 block">
            <span className="sr-only">Search question history</span>
            <input
                type="search"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search by question ID or text..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <div className="mb-4 flex items-center gap-2">
            <label htmlFor="history-sort" className="text-sm font-semibold text-gray-600">
              Sort:
            </label>
            <select
                id="history-sort"
                value={historySort}
                onChange={(event) => setHistorySort(event.target.value as HistorySort)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="ascending">Question order (ascending)</option>
              <option value="descending">Question order (descending)</option>
              <option value="most-wrong">Most incorrect answers</option>
              <option value="most-correct">Most correct answers</option>
            </select>
          </div>
          <div className="min-h-0 max-h-[70vh] space-y-2 overflow-y-auto pr-2 lg:flex-1 lg:max-h-none">
            {filteredHistoryQuestions.map(({ question, index }) => {
              const questionStats = getQuestionStats(stats, currentSubject, question.id);
              const lastAnswerText = questionStats?.lastAnswer.length
                ? questionStats.lastAnswer.join(', ')
                : 'No answer';
              const isHistoryExpanded = expandedHistoryIds.has(question.id);

              return (
                <div
                    key={question.id}
                    className={`rounded-lg border-2 transition hover:border-blue-400 ${
                      questionStats?.lastResult === 'correct'
                        ? `border-emerald-300 bg-emerald-50${question.id === currentQuestion.id ? ' ring-2 ring-inset ring-blue-400' : ''}`
                        : questionStats?.lastResult === 'incorrect'
                          ? question.id === currentQuestion.id
                            ? 'border-rose-300 bg-gray-100 ring-2 ring-inset ring-blue-400'
                            : 'border-rose-300 bg-rose-50'
                          : question.id === currentQuestion.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                    }`}
                >
                  <div className="flex items-center">
                    <button
                        type="button"
                        onClick={() => {
                          setQuestionMode('all');
                          setCurrentIndex(index);
                          setSelectedLabels([]);
                          setIsEvaluated(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="min-w-0 flex-1 p-3 text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-gray-800">
                          {index + 1}. {question.id}
                        </span>
                        <span className="text-xs text-gray-500">
                          {questionStats?.lastResult && questionStats.lastResult !== 'unanswered'
                            ? `${questionStats.correct} correct / ${questionStats.incorrect} incorrect`
                            : 'Not answered'}
                        </span>
                      </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                          setExpandedHistoryIds((previousIds) => {
                            const nextIds = new Set(previousIds);
                            if (nextIds.has(question.id)) {
                              nextIds.delete(question.id);
                            } else {
                              nextIds.add(question.id);
                            }
                            return nextIds;
                          });
                        }}
                        aria-label={`${isHistoryExpanded ? 'Collapse' : 'Expand'} ${question.id} answer`}
                        aria-expanded={isHistoryExpanded}
                        className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-lg text-gray-600 transition hover:bg-white"
                    >
                      {isHistoryExpanded ? '⌃' : '⌄'}
                    </button>
                  </div>
                  {isHistoryExpanded && (
                    <div className="border-t border-gray-200/80 px-3 pb-3 pt-2">
                      <p className="mb-2 text-sm text-gray-600">
                        Last answer: <span className="font-semibold text-gray-800">{lastAnswerText}</span>
                      </p>
                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const wasSelected = questionStats?.lastAnswer.includes(option.label) ?? false;
                          const optionStyle = wasSelected
                            ? option.is_correct
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-rose-400 bg-rose-50'
                            : option.is_correct && questionStats?.lastResult
                              ? 'border-emerald-300 bg-emerald-50/50'
                              : 'border-gray-200 bg-white';

                          return (
                            <label
                                key={option.label}
                                className={`flex items-start rounded-md border p-2 text-sm ${optionStyle}`}
                            >
                              <input
                                  type="checkbox"
                                  checked={wasSelected}
                                  disabled
                                  readOnly
                                  className="mt-0.5 h-4 w-4 rounded text-blue-600"
                              />
                              <span className="ml-2 font-semibold text-gray-700">{option.label})</span>
                              <span className="ml-2 text-gray-700">{option.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredHistoryQuestions.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
                No questions match “{historySearch}”.
              </p>
            )}
          </div>
        </div>

          {editingQuestion && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4">
              <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="correction-title"
                  className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 id="correction-title" className="text-xl font-bold text-gray-900">
                      Correct {editingQuestion.id}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Update the question, answer text, and which answers are correct.
                    </p>
                  </div>
                  <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      aria-label="Close correction editor"
                      className="rounded-lg px-2 py-1 text-xl text-gray-500 hover:bg-gray-100"
                  >
                    ×
                  </button>
                </div>
                <label className="mb-4 block">
                  <span className="mb-1 block text-sm font-semibold text-gray-700">Question</span>
                  <textarea
                      value={editingQuestion.question}
                      onChange={(event) =>
                        setEditingQuestion((previousQuestion) =>
                          previousQuestion
                            ? { ...previousQuestion, question: event.target.value }
                            : previousQuestion,
                        )
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <fieldset className="space-y-3">
                  <legend className="mb-2 text-sm font-semibold text-gray-700">
                    Answers (check every correct answer)
                  </legend>
                  {editingQuestion.options.map((option, optionIndex) => (
                    <div key={option.label} className="flex items-start gap-3">
                      <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(event) =>
                            setEditingQuestion((previousQuestion) => {
                              if (!previousQuestion) return previousQuestion;
                              const options = previousQuestion.options.map((currentOption, index) =>
                                index === optionIndex
                                  ? { ...currentOption, is_correct: event.target.checked }
                                  : currentOption,
                              );
                              return { ...previousQuestion, options };
                            })
                          }
                          aria-label={`Mark answer ${option.label} as correct`}
                          className="mt-2 h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mt-1.5 w-5 font-semibold uppercase text-gray-700">
                        {option.label})
                      </span>
                      <textarea
                          value={option.text}
                          onChange={(event) =>
                            setEditingQuestion((previousQuestion) => {
                              if (!previousQuestion) return previousQuestion;
                              const options = previousQuestion.options.map((currentOption, index) =>
                                index === optionIndex
                                  ? { ...currentOption, text: event.target.value }
                                  : currentOption,
                              );
                              return { ...previousQuestion, options };
                            })
                          }
                          rows={2}
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  ))}
                </fieldset>
                {editError && (
                  <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                    {editError}
                  </p>
                )}
                <div className="mt-6 flex justify-end gap-2">
                  <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                      type="button"
                      onClick={handleSaveCorrection}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save correction
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}