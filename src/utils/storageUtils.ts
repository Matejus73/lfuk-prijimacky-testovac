import { FOUR_ANSWERS_STORAGE_KEY, QUESTIONS_STORAGE_KEY, STATS_STORAGE_KEY } from '../constants/storage.ts';
import type { AllStats, Question, StatsByQuestion, Subject } from '../types.ts';
import { normalizeQuestionStats } from './scoringUtils.ts';

export const emptyStats = (): AllStats => ({
  Biology: {},
  Chemistry: {},
});

const normalizeSubjectStats = (raw: unknown): StatsByQuestion => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const result: StatsByQuestion = {};
  for (const [questionId, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalized = normalizeQuestionStats(value);
    if (normalized) {
      result[questionId] = normalized;
    }
  }
  return result;
};

export const loadStoredStats = (): AllStats => {
  const defaults = emptyStats();
  let savedStats: string | null = null;

  try {
    savedStats = localStorage.getItem(STATS_STORAGE_KEY);
  } catch {
    return defaults;
  }

  if (!savedStats) return defaults;

  try {
    const parsed = JSON.parse(savedStats) as Partial<Record<Subject, unknown>>;
    return {
      Biology: normalizeSubjectStats(parsed.Biology),
      Chemistry: normalizeSubjectStats(parsed.Chemistry),
    };
  } catch {
    return defaults;
  }
};

export const saveStoredStats = (stats: AllStats): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage can be unavailable in restricted contexts.
  }
};

export const loadStoredQuestions = (
  defaults: Record<Subject, Question[]>,
): Record<Subject, Question[]> => {
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

export const saveStoredQuestions = (questions: Record<Subject, Question[]>): void => {
  try {
    localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
  } catch {
    // Storage can be unavailable in restricted contexts.
  }
};

export const loadStoredFourAnswers = (): boolean => {
  try {
    return localStorage.getItem(FOUR_ANSWERS_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const saveStoredFourAnswers = (enabled: boolean): void => {
  try {
    localStorage.setItem(FOUR_ANSWERS_STORAGE_KEY, String(enabled));
  } catch {
    // Storage can be unavailable in restricted contexts.
  }
};
