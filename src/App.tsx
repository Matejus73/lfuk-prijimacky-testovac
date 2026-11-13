import { useEffect, useState } from 'react';
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

  // Active question set and revision filter
  const activeQuestions = questions[currentSubject];
  const revisionQuestions = activeQuestions
    .map((question, index) => ({
      question,
      index,
      incorrect: getQuestionStats(stats, currentSubject, question.id)?.incorrect ?? 0,
    }))
    .filter(({ incorrect }) => incorrect > 0);
  const questionsInMode =
    questionMode === 'revision'
      ? revisionQuestions.map(({ question }) => question)
      : activeQuestions;

  // Question navigation and answer states
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    () => getQuestionStats(stats, 'Biology', questions.Biology[0].id)?.lastAnswer ?? [],
  );
  const [isEvaluated, setIsEvaluated] = useState<boolean>(
    () => Boolean(getQuestionStats(stats, 'Biology', questions.Biology[0].id)?.lastResult),
  );
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
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

  const restoreQuestion = () => {
    setSelectedLabels([]);
    setIsEvaluated(false);
  };

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
    if (editingQuestion) {
      const hasChanges =
        editingQuestion.question !== currentQuestion.question ||
        editingQuestion.options.some((option, index) => {
          const originalOption = currentQuestion.options[index];
          return (
            option.text !== originalOption.text || option.is_correct !== originalOption.is_correct
          );
        });

      if (!hasChanges) {
        setEditingQuestion(null);
      } else {
        handleSaveCorrection();
      }
      return;
    }

    setEditingQuestion({
      ...currentQuestion,
      options: currentQuestion.options.map((option) => ({ ...option })),
    });
    setEditError('');
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
    setEditingQuestion(null);
    setEditError('');
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

  const handleSelectQuestionFromHistory = (index: number) => {
    setQuestionMode('all');
    setCurrentIndex(index);
    restoreQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleExpandHistory = (id: string) => {
    setExpandedHistoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Aggregated stats calculations
  const answeredQuestionsCount = activeQuestions.filter((question) =>
    ['correct', 'incorrect'].includes(
      getQuestionStats(stats, currentSubject, question.id)?.lastResult ?? '',
    ),
  ).length;

  const correctAnswersCount = activeQuestions.reduce(
    (total, question) =>
      total + (getQuestionStats(stats, currentSubject, question.id)?.correct ?? 0),
    0,
  );

  const incorrectAnswersCount = activeQuestions.reduce(
    (total, question) =>
      total + (getQuestionStats(stats, currentSubject, question.id)?.incorrect ?? 0),
    0,
  );

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
    <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-5 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden lg:p-6">
      <div className="grid w-full items-start gap-4 lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,1fr)]">
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
            currentIndex={currentIndex}
            copyStatus={copyStatus}
            onCopy={handleCopyCard}
            isEditing={Boolean(editingQuestion)}
            onToggleEdit={handleOpenCorrection}
            randomNext={randomNext}
            onToggleRandomNext={handleRandomNextToggle}
            fourAnswersOnly={fourAnswersOnly}
            onToggleFourAnswers={handleFourAnswersToggle}
          />

          <QuestionCard
            currentQuestion={currentQuestion}
            displayedOptions={displayedOptions}
            selectedLabels={selectedLabels}
            isEvaluated={isEvaluated}
            onToggleOption={handleToggleOption}
            editingQuestion={editingQuestion}
            onChangeQuestionText={handleChangeQuestionText}
            onToggleOptionCorrect={handleToggleOptionCorrect}
            onChangeOptionText={handleChangeOptionText}
            editError={editError}
            onResetCorrection={handleResetCorrection}
            onCancelCorrection={() => setEditingQuestion(null)}
            onSaveCorrection={handleSaveCorrection}
            onPrev={handlePrev}
            isPrevDisabled={currentIndex === 0}
            onNext={handleNext}
            isNextDisabled={!randomNext && currentIndex === questionsInMode.length - 1}
            onCheckAnswer={handleCheckAnswer}
            onTryAgain={handleTryAgain}
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