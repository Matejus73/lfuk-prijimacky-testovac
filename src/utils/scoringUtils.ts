import type {
  AnswerResult,
  ForcedKnowledgeState,
  KnowledgeState,
  Question,
  QuestionStats,
  StatsByQuestion,
} from '../types.ts';
import { roundStat } from './questionUtils.ts';

export const INITIAL_MASTERY = 0.35;
export const ALPHA_CORRECT = 0.48;
export const ALPHA_INCORRECT = 0.50;
export const INCORRECT_MIN_WEIGHT = 0.5;
export const KNOWS_THRESHOLD = 0.80;
export const ALMOST_THRESHOLD = 0.40;

export interface KnowledgeSummary {
  total: number;
  knowsCount: number;
  almostCount: number;
  doesntKnowCount: number;
  unansweredCount: number;
  answeredCount: number;
  revisionCount: number;
  totalAttempts: number;
  averageMasteryPercentage: number;
}

export const clampMastery = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.min(Math.max(value, 0), 1);
  return Math.round(clamped * 10000) / 10000;
};

export const getRealKnowledgeState = (questionStats?: QuestionStats): KnowledgeState => {
  if (!questionStats || questionStats.attempts <= 0) {
    return 'unanswered';
  }
  if (questionStats.mastery >= KNOWS_THRESHOLD) {
    return 'knows';
  }
  if (questionStats.mastery >= ALMOST_THRESHOLD) {
    return 'almost';
  }
  return 'doesnt-know';
};

export const getKnowledgeState = (questionStats?: QuestionStats): KnowledgeState => {
  if (questionStats?.forcedState) {
    return questionStats.forcedState;
  }
  return getRealKnowledgeState(questionStats);
};

export const getKnowledgeLabel = (state: KnowledgeState): string => {
  switch (state) {
    case 'knows':
      return 'Knows';
    case 'almost':
      return 'Almost knows';
    case 'doesnt-know':
      return "Doesn't know";
    case 'unanswered':
      return 'Never answered';
  }
};

export const getMasteryPercentage = (questionStats?: QuestionStats): number => {
  if (!questionStats || questionStats.attempts <= 0) return 0;
  return Math.round(clampMastery(questionStats.mastery) * 100);
};

export const needsRevision = (questionStats?: QuestionStats): boolean => {
  const state = getKnowledgeState(questionStats);
  return state === 'doesnt-know' || state === 'almost';
};

export const setQuestionForcedState = (
  previous: QuestionStats | undefined,
  forcedState: ForcedKnowledgeState | undefined,
): QuestionStats | undefined => {
  if (!forcedState) {
    if (!previous) return undefined;
    const { forcedState: _removed, ...rest } = previous;
    if (
      rest.attempts <= 0 &&
      rest.correct === 0 &&
      rest.incorrect === 0 &&
      !rest.lastResult &&
      rest.lastAnswer.length === 0
    ) {
      return undefined;
    }
    return rest;
  }

  return {
    correct: previous?.correct ?? 0,
    incorrect: previous?.incorrect ?? 0,
    attempts: previous?.attempts ?? 0,
    streak: previous?.streak ?? 0,
    mastery: previous?.mastery ?? 0,
    lastAnswer: previous?.lastAnswer ? [...previous.lastAnswer] : [],
    ...(previous?.lastResult ? { lastResult: previous.lastResult } : {}),
    forcedState,
  };
};

export const recordQuestionAttempt = (
  previous: QuestionStats | undefined,
  params: {
    isCorrect: boolean;
    selectedLabels: string[];
    weight?: number;
  },
): QuestionStats => {
  const weight = Math.min(Math.max(params.weight ?? 1, 0), 1);
  const prevAttempts = previous?.attempts ?? 0;
  const baseMastery = prevAttempts > 0 ? clampMastery(previous?.mastery ?? INITIAL_MASTERY) : INITIAL_MASTERY;

  const effectiveAlpha = params.isCorrect
    ? ALPHA_CORRECT * weight
    : ALPHA_INCORRECT * (INCORRECT_MIN_WEIGHT + (1 - INCORRECT_MIN_WEIGHT) * weight);

  const nextMastery = clampMastery(
    params.isCorrect
      ? (1 - effectiveAlpha) * baseMastery + effectiveAlpha
      : (1 - effectiveAlpha) * baseMastery,
  );

  const prevStreak = previous?.streak ?? 0;
  const nextStreak = params.isCorrect
    ? prevStreak > 0
      ? prevStreak + 1
      : 1
    : prevStreak < 0
      ? prevStreak - 1
      : -1;

  return {
    correct: roundStat((previous?.correct ?? 0) + (params.isCorrect ? weight : 0)),
    incorrect: roundStat((previous?.incorrect ?? 0) + (params.isCorrect ? 0 : weight)),
    attempts: prevAttempts + 1,
    streak: nextStreak,
    mastery: nextMastery,
    lastAnswer: [...params.selectedLabels],
    lastResult: params.isCorrect ? 'correct' : 'incorrect',
    ...(previous?.forcedState ? { forcedState: previous.forcedState } : {}),
  };
};

const isValidAnswerResult = (value: unknown): value is AnswerResult =>
  value === 'correct' || value === 'incorrect' || value === 'unanswered';

const isValidForcedState = (value: unknown): value is ForcedKnowledgeState =>
  value === 'knows' || value === 'almost' || value === 'doesnt-know';

export const normalizeQuestionStats = (raw: unknown): QuestionStats | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const record = raw as Partial<QuestionStats>;

  const correct =
    typeof record.correct === 'number' && Number.isFinite(record.correct) && record.correct >= 0
      ? roundStat(record.correct)
      : 0;
  const incorrect =
    typeof record.incorrect === 'number' && Number.isFinite(record.incorrect) && record.incorrect >= 0
      ? roundStat(record.incorrect)
      : 0;
  const lastAnswer = Array.isArray(record.lastAnswer)
    ? record.lastAnswer.filter((item): item is string => typeof item === 'string')
    : [];
  const lastResult = isValidAnswerResult(record.lastResult) ? record.lastResult : undefined;
  const forcedState = isValidForcedState(record.forcedState) ? record.forcedState : undefined;

  if (
    typeof record.attempts === 'number' &&
    Number.isFinite(record.attempts) &&
    record.attempts >= 0 &&
    typeof record.mastery === 'number' &&
    Number.isFinite(record.mastery)
  ) {
    const attempts = Math.round(record.attempts);
    const streak =
      typeof record.streak === 'number' && Number.isFinite(record.streak)
        ? Math.round(record.streak)
        : 0;

    return {
      correct,
      incorrect,
      attempts,
      streak,
      mastery: attempts > 0 ? clampMastery(record.mastery) : 0,
      lastAnswer,
      ...(lastResult ? { lastResult } : {}),
      ...(forcedState ? { forcedState } : {}),
    };
  }

  // Migrate legacy stats entries that predate attempts / streak / mastery
  if (
    lastResult === 'unanswered' ||
    (correct === 0 && incorrect === 0 && lastResult !== 'correct' && lastResult !== 'incorrect')
  ) {
    return {
      correct: 0,
      incorrect: 0,
      attempts: 0,
      streak: 0,
      mastery: 0,
      lastAnswer,
      ...(lastResult ? { lastResult } : {}),
      ...(forcedState ? { forcedState } : {}),
    };
  }

  const attempts = Math.max(1, Math.round(correct + incorrect));
  const base = (correct + INITIAL_MASTERY) / (correct + incorrect + 1);
  const bias = lastResult === 'correct' ? 0.04 : -0.08;
  const mastery = clampMastery(Math.min(0.98, Math.max(0.05, base + bias)));
  const streak = lastResult === 'correct' ? 1 : lastResult === 'incorrect' ? -1 : 0;

  return {
    correct,
    incorrect,
    attempts,
    streak,
    mastery,
    lastAnswer,
    ...(lastResult ? { lastResult } : {}),
    ...(forcedState ? { forcedState } : {}),
  };
};

const KNOWLEDGE_TIER_ORDER: Record<ForcedKnowledgeState, number> = {
  'doesnt-know': 0,
  almost: 1,
  knows: 2,
};

export const compareByKnowledge = (
  leftStats: QuestionStats | undefined,
  rightStats: QuestionStats | undefined,
  leftIndex: number,
  rightIndex: number,
  direction: 'least-known' | 'most-known',
): number => {
  const leftState = getKnowledgeState(leftStats);
  const rightState = getKnowledgeState(rightStats);
  const leftCategorized = leftState !== 'unanswered';
  const rightCategorized = rightState !== 'unanswered';

  // Keep categorized/answered questions ranked ahead of unseen ones so struggling/mastered items surface first
  if (leftCategorized !== rightCategorized) {
    return leftCategorized ? -1 : 1;
  }
  if (leftState === 'unanswered' || rightState === 'unanswered') {
    return leftIndex - rightIndex;
  }

  const tierDiff =
    direction === 'least-known'
      ? KNOWLEDGE_TIER_ORDER[leftState] - KNOWLEDGE_TIER_ORDER[rightState]
      : KNOWLEDGE_TIER_ORDER[rightState] - KNOWLEDGE_TIER_ORDER[leftState];
  if (tierDiff !== 0) {
    return tierDiff;
  }

  const leftMastery = (leftStats?.attempts ?? 0) > 0 ? clampMastery(leftStats?.mastery ?? 0) : 0;
  const rightMastery = (rightStats?.attempts ?? 0) > 0 ? clampMastery(rightStats?.mastery ?? 0) : 0;
  const masteryDiff =
    direction === 'least-known' ? leftMastery - rightMastery : rightMastery - leftMastery;
  if (Math.abs(masteryDiff) > 1e-6) {
    return masteryDiff;
  }

  const leftStreak = leftStats?.streak ?? 0;
  const rightStreak = rightStats?.streak ?? 0;
  const streakDiff =
    direction === 'least-known' ? leftStreak - rightStreak : rightStreak - leftStreak;
  if (streakDiff !== 0) {
    return streakDiff;
  }

  const attemptsDiff = (rightStats?.attempts ?? 0) - (leftStats?.attempts ?? 0);
  if (attemptsDiff !== 0) {
    return attemptsDiff;
  }

  return leftIndex - rightIndex;
};

export const getKnowledgeSummary = (
  questions: Question[],
  statsByQuestion: StatsByQuestion | undefined,
): KnowledgeSummary => {
  let knowsCount = 0;
  let almostCount = 0;
  let doesntKnowCount = 0;
  let unansweredCount = 0;
  let totalAttempts = 0;
  let realAnsweredCount = 0;
  let masterySum = 0;

  for (const question of questions) {
    const qStats = statsByQuestion?.[question.id];
    const state = getKnowledgeState(qStats);
    switch (state) {
      case 'knows':
        knowsCount += 1;
        break;
      case 'almost':
        almostCount += 1;
        break;
      case 'doesnt-know':
        doesntKnowCount += 1;
        break;
      case 'unanswered':
        unansweredCount += 1;
        break;
    }
    if ((qStats?.attempts ?? 0) > 0) {
      realAnsweredCount += 1;
      masterySum += clampMastery(qStats?.mastery ?? 0);
    }
    totalAttempts += qStats?.attempts ?? 0;
  }

  const answeredCount = knowsCount + almostCount + doesntKnowCount;
  const revisionCount = doesntKnowCount + almostCount;
  const averageMasteryPercentage =
    realAnsweredCount > 0 ? Math.round((masterySum / realAnsweredCount) * 100) : 0;

  return {
    total: questions.length,
    knowsCount,
    almostCount,
    doesntKnowCount,
    unansweredCount,
    answeredCount,
    revisionCount,
    totalAttempts,
    averageMasteryPercentage,
  };
};

