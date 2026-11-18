import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  FOUR_ANSWERS_STORAGE_KEY,
  QUESTIONS_STORAGE_KEY,
  STATS_COLLAPSED_STORAGE_KEY,
  STATS_STORAGE_KEY,
} from '../src/constants/storage.ts';
import bioData from '../src/data/OtazkyBio.json' with { type: 'json' };
import chemData from '../src/data/OtazkyChem.json' with { type: 'json' };
import type { AllStats, Question, QuestionStats, Subject } from '../src/types.ts';
import {
  areAnswersEqual,
  formatQuestionForClipboard,
  getInitialRandomOptionLabels,
  getQuestionEditDiff,
  getQuestionStats,
  getRandomOptionLabels,
  getReshuffledOptionLabels,
  roundStat,
  shuffle,
} from '../src/utils/questionUtils.ts';
import {
  compareByKnowledge,
  getKnowledgeState,
  getKnowledgeSummary,
  getMasteryPercentage,
  getRealKnowledgeState,
  needsRevision,
  normalizeQuestionStats,
  recordQuestionAttempt,
  setQuestionForcedState,
} from '../src/utils/scoringUtils.ts';
import {
  emptyStats,
  loadStoredFourAnswers,
  loadStoredQuestions,
  loadStoredStatsCollapsed,
  loadStoredStats,
  saveStoredFourAnswers,
  saveStoredQuestions,
  saveStoredStatsCollapsed,
  saveStoredStats,
} from '../src/utils/storageUtils.ts';

const sampleQuestion: Question = {
  id: 'BIO_1',
  subject: 'Biology',
  question: 'Which organelle produces ATP via oxidative phosphorylation?',
  options: [
    { label: 'a', text: 'Golgi apparatus', is_correct: false },
    { label: 'b', text: 'Mitochondrion', is_correct: true },
    { label: 'c', text: 'Lysosome', is_correct: false },
    { label: 'd', text: 'Ribosome', is_correct: false },
    { label: 'e', text: 'Peroxisome', is_correct: false },
    { label: 'f', text: 'Endoplasmic reticulum', is_correct: false },
    { label: 'g', text: 'Nucleolus', is_correct: false },
    { label: 'h', text: 'Centrosome', is_correct: false },
  ],
};

const sampleDatasets: Record<Subject, Question[]> = {
  Biology: [sampleQuestion],
  Chemistry: [
    {
      id: 'CHEM_1',
      subject: 'Chemistry',
      question: 'Which element has atomic number 6?',
      options: [
        { label: 'a', text: 'Carbon', is_correct: true },
        { label: 'b', text: 'Nitrogen', is_correct: false },
        { label: 'c', text: 'Oxygen', is_correct: false },
        { label: 'd', text: 'Boron', is_correct: false },
        { label: 'e', text: 'Helium', is_correct: false },
        { label: 'f', text: 'Lithium', is_correct: false },
        { label: 'g', text: 'Beryllium', is_correct: false },
        { label: 'h', text: 'Fluorine', is_correct: false },
      ],
    },
  ],
};

class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

describe('questionUtils', () => {
  it('areAnswersEqual compares answer sets regardless of order', () => {
    assert.equal(areAnswersEqual(['a', 'c'], ['c', 'a']), true);
    assert.equal(areAnswersEqual(['a'], ['a', 'b']), false);
    assert.equal(areAnswersEqual(['a', 'b'], ['a', 'c']), false);
    assert.equal(areAnswersEqual([], []), true);
  });

  it('roundStat prevents floating-point drift on fractional scores', () => {
    assert.equal(roundStat(0.1 + 0.2), 0.3);
    assert.equal(roundStat(0.5 + 0.5 + 0.5), 1.5);
  });

  it('shuffle preserves elements without mutating input array', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = [...original];
    const shuffled = shuffle(original);
    assert.deepEqual(original, copy);
    assert.deepEqual([...shuffled].sort((a, b) => a - b), original);
  });

  it('getRandomOptionLabels always returns 4 labels and includes at least one correct option', () => {
    const correctPositions = new Set<number>();
    for (let run = 0; run < 100; run += 1) {
      const labels = getRandomOptionLabels(sampleQuestion);
      assert.equal(labels.length, 4);
      assert.equal(new Set(labels).size, 4);
      assert.equal(
        labels.includes('b'),
        true,
        '4-option subset must always include the single correct option',
      );
      correctPositions.add(labels.indexOf('b'));
    }
    assert.ok(correctPositions.size > 1, 'correct option should not be pinned to one slot');
  });

  it('getRandomOptionLabels changes order when previousLabels matches', () => {
    const fourOptionQuestion: Question = {
      ...sampleQuestion,
      options: sampleQuestion.options.slice(0, 4),
    };
    let prev = getRandomOptionLabels(fourOptionQuestion);
    for (let run = 0; run < 20; run += 1) {
      const next = getRandomOptionLabels(fourOptionQuestion, prev);
      assert.equal(next.length, 4);
      assert.notDeepEqual(next, prev);
      prev = next;
    }
  });

  it('getRandomOptionLabels picks a different subset when more than 4 options exist', () => {
    let prev = getRandomOptionLabels(sampleQuestion);
    for (let run = 0; run < 40; run += 1) {
      const next = getRandomOptionLabels(sampleQuestion, prev);
      assert.equal(next.length, 4);
      assert.notDeepEqual([...next].sort(), [...prev].sort());
      prev = next;
    }
  });

  it('getReshuffledOptionLabels preserves all labels and avoids repeating previous order', () => {
    let prev = sampleQuestion.options.map((option) => option.label);
    for (let run = 0; run < 20; run += 1) {
      const next = getReshuffledOptionLabels(sampleQuestion, prev);
      assert.equal(next.length, sampleQuestion.options.length);
      assert.deepEqual([...next].sort(), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
      assert.notDeepEqual(next, prev);
      prev = next;
    }
  });

  it('getRandomOptionLabels handles questions with no marked correct answers gracefully', () => {
    const ungradedQuestion: Question = {
      ...sampleQuestion,
      options: sampleQuestion.options.map((opt) => ({ ...opt, is_correct: false })),
    };
    const labels = getRandomOptionLabels(ungradedQuestion);
    assert.equal(labels.length, 4);
    assert.equal(new Set(labels).size, 4);
  });

  it('getInitialRandomOptionLabels builds solvable 4-option subsets across full Biology and Chemistry datasets', () => {
    const fullDatasets: Record<Subject, Question[]> = {
      Biology: bioData as Question[],
      Chemistry: chemData as Question[],
    };
    const initial = getInitialRandomOptionLabels(fullDatasets);
    assert.equal(Object.keys(initial).length, 2000);

    for (const subject of ['Biology', 'Chemistry'] as Subject[]) {
      for (const question of fullDatasets[subject]) {
        const labels = initial[`${subject}:${question.id}`];
        assert.equal(labels.length, 4);
        const hasAnyCorrect = question.options.some((opt) => opt.is_correct);
        if (hasAnyCorrect) {
          const displayedCorrect = question.options.filter(
            (opt) => labels.includes(opt.label) && opt.is_correct,
          );
          assert.ok(
            displayedCorrect.length >= 1,
            `${subject}:${question.id} must have at least 1 correct option in 4-answers mode`,
          );
        }
      }
    }
  });

  it('getQuestionEditDiff tracks edited question text, option correctness, and option text', () => {
    const uneditedDiff = getQuestionEditDiff(sampleQuestion, sampleQuestion);
    assert.equal(uneditedDiff.isEdited, false);
    assert.equal(uneditedDiff.isQuestionTextEdited, false);
    assert.equal(uneditedDiff.editedOptions.a.isEdited, false);

    const whitespaceOnlyQuestion: Question = {
      ...sampleQuestion,
      question: `  ${sampleQuestion.question}  `,
      options: sampleQuestion.options.map((option) => ({
        ...option,
        text: ` ${option.text} `,
      })),
    };
    assert.equal(getQuestionEditDiff(whitespaceOnlyQuestion, sampleQuestion).isEdited, false);

    const titleEdited: Question = {
      ...sampleQuestion,
      question: 'Which organelle synthesizes ATP?',
    };
    const titleDiff = getQuestionEditDiff(titleEdited, sampleQuestion);
    assert.equal(titleDiff.isEdited, true);
    assert.equal(titleDiff.isQuestionTextEdited, true);
    assert.equal(titleDiff.editedOptions.b.isEdited, false);

    const correctnessEdited: Question = {
      ...sampleQuestion,
      options: sampleQuestion.options.map((option) =>
        option.label === 'a' ? { ...option, is_correct: true } : option,
      ),
    };
    const correctnessDiff = getQuestionEditDiff(correctnessEdited, sampleQuestion);
    assert.equal(correctnessDiff.isEdited, true);
    assert.equal(correctnessDiff.isQuestionTextEdited, false);
    assert.equal(correctnessDiff.editedOptions.a.isCorrectEdited, true);
    assert.equal(correctnessDiff.editedOptions.a.isTextEdited, false);
    assert.equal(correctnessDiff.editedOptions.b.isEdited, false);

    const textEdited: Question = {
      ...sampleQuestion,
      options: sampleQuestion.options.map((option) =>
        option.label === 'c' ? { ...option, text: 'Lysozome (edited)' } : option,
      ),
    };
    const textDiff = getQuestionEditDiff(textEdited, sampleQuestion);
    assert.equal(textDiff.isEdited, true);
    assert.equal(textDiff.editedOptions.c.isCorrectEdited, false);
    assert.equal(textDiff.editedOptions.c.isTextEdited, true);
    assert.equal(textDiff.editedOptions.c.isEdited, true);

    assert.deepEqual(getQuestionEditDiff(sampleQuestion, undefined), {
      isEdited: false,
      isQuestionTextEdited: false,
      editedOptions: {},
    });
  });

  it('getQuestionStats retrieves subject question stats safely', () => {
    const stats: AllStats = {
      Biology: {
        BIO_1: {
          correct: 2,
          incorrect: 1,
          attempts: 3,
          streak: 1,
          mastery: 0.65,
          lastAnswer: ['b'],
          lastResult: 'correct',
        },
      },
      Chemistry: {},
    };
    assert.deepEqual(getQuestionStats(stats, 'Biology', 'BIO_1')?.lastAnswer, ['b']);
    assert.equal(getQuestionStats(stats, 'Biology', 'BIO_999'), undefined);
  });

  it('formatQuestionForClipboard formats question, selected options, and result', () => {
    const formatted = formatQuestionForClipboard(
      'Biology',
      sampleQuestion,
      ['b', 'd'],
      'incorrect',
    );
    assert.ok(formatted.includes('Biology - BIO_1'));
    assert.ok(formatted.includes(sampleQuestion.question));
    assert.ok(formatted.includes('[ ] a) Golgi apparatus'));
    assert.ok(formatted.includes('[x] b) Mitochondrion'));
    assert.ok(formatted.includes('[x] d) Ribosome'));
    assert.ok(formatted.includes('My last answer: b, d'));
    assert.ok(formatted.includes('Result: incorrect'));
  });
});

describe('scoringUtils', () => {
  it('classifies unanswered, first-try correct as almost, and second correct as knows', () => {
    assert.equal(getKnowledgeState(undefined), 'unanswered');
    assert.equal(needsRevision(undefined), false);

    const firstCorrect = recordQuestionAttempt(undefined, {
      isCorrect: true,
      selectedLabels: ['b'],
      weight: 1,
    });
    assert.equal(getKnowledgeState(firstCorrect), 'almost');
    assert.equal(needsRevision(firstCorrect), true);
    assert.equal(firstCorrect.streak, 1);

    const secondCorrect = recordQuestionAttempt(firstCorrect, {
      isCorrect: true,
      selectedLabels: ['b'],
      weight: 1,
    });
    assert.equal(getKnowledgeState(secondCorrect), 'knows');
    assert.equal(needsRevision(secondCorrect), false);
    assert.equal(secondCorrect.streak, 2);
    assert.ok(getMasteryPercentage(secondCorrect) >= 80);
  });

  it('classifies first-try incorrect as doesnt-know and allows full recovery via streak', () => {
    let qStats = recordQuestionAttempt(undefined, {
      isCorrect: false,
      selectedLabels: ['a'],
      weight: 1,
    });
    assert.equal(getKnowledgeState(qStats), 'doesnt-know');
    assert.equal(needsRevision(qStats), true);
    assert.equal(qStats.streak, -1);

    qStats = recordQuestionAttempt(qStats, { isCorrect: false, selectedLabels: ['c'], weight: 1 });
    assert.equal(getKnowledgeState(qStats), 'doesnt-know');
    assert.equal(qStats.streak, -2);

    // Recovering: 1st right moves out of doesnt-know into almost, 3rd right reaches knows
    qStats = recordQuestionAttempt(qStats, { isCorrect: true, selectedLabels: ['b'], weight: 1 });
    assert.equal(getKnowledgeState(qStats), 'almost');
    assert.equal(qStats.streak, 1);

    qStats = recordQuestionAttempt(qStats, { isCorrect: true, selectedLabels: ['b'], weight: 1 });
    assert.equal(getKnowledgeState(qStats), 'almost');

    qStats = recordQuestionAttempt(qStats, { isCorrect: true, selectedLabels: ['b'], weight: 1 });
    assert.equal(getKnowledgeState(qStats), 'knows');
    assert.equal(needsRevision(qStats), false);
  });

  it('drops a mastered question to almost on a single slip rather than zero', () => {
    let qStats = recordQuestionAttempt(undefined, { isCorrect: true, selectedLabels: ['b'] });
    qStats = recordQuestionAttempt(qStats, { isCorrect: true, selectedLabels: ['b'] });
    assert.equal(getKnowledgeState(qStats), 'knows');

    const slipped = recordQuestionAttempt(qStats, { isCorrect: false, selectedLabels: ['a'] });
    assert.equal(getKnowledgeState(slipped), 'almost');
    assert.equal(needsRevision(slipped), true);
    assert.equal(slipped.streak, -1);
  });

  it('weights 4-answers mode slower on upward mastery while keeping first wrong in doesnt-know', () => {
    const fourCorrect = recordQuestionAttempt(undefined, {
      isCorrect: true,
      selectedLabels: ['b'],
      weight: 0.5,
    });
    const eightCorrect = recordQuestionAttempt(undefined, {
      isCorrect: true,
      selectedLabels: ['b'],
      weight: 1,
    });
    assert.equal(getKnowledgeState(fourCorrect), 'almost');
    assert.ok(fourCorrect.mastery < eightCorrect.mastery);

    const fourWrong = recordQuestionAttempt(undefined, {
      isCorrect: false,
      selectedLabels: ['a'],
      weight: 0.5,
    });
    assert.equal(getKnowledgeState(fourWrong), 'doesnt-know');
  });

  it('ranks questions cleanly by mastery with unanswered placed after answered', () => {
    const makeStats = (mastery: number, streak: number, attempts = 2): QuestionStats => ({
      correct: streak > 0 ? streak : 0,
      incorrect: streak < 0 ? Math.abs(streak) : 0,
      attempts,
      streak,
      mastery,
      lastAnswer: ['b'],
      lastResult: streak > 0 ? 'correct' : 'incorrect',
    });

    const entries = [
      { id: 'Q1', index: 0, stats: undefined },
      { id: 'Q2', index: 1, stats: makeStats(0.9, 3, 3) },
      { id: 'Q3', index: 2, stats: makeStats(0.15, -2, 2) },
      { id: 'Q4', index: 3, stats: makeStats(0.65, 1, 2) },
      { id: 'Q5', index: 4, stats: makeStats(0.65, 2, 3) },
    ];

    const leastKnownOrder = [...entries]
      .sort((a, b) => compareByKnowledge(a.stats, b.stats, a.index, b.index, 'least-known'))
      .map((entry) => entry.id);
    assert.deepEqual(leastKnownOrder, ['Q3', 'Q4', 'Q5', 'Q2', 'Q1']);

    const mostKnownOrder = [...entries]
      .sort((a, b) => compareByKnowledge(a.stats, b.stats, a.index, b.index, 'most-known'))
      .map((entry) => entry.id);
    assert.deepEqual(mostKnownOrder, ['Q2', 'Q5', 'Q4', 'Q3', 'Q1']);
  });

  it('forces a question into any section without changing its real score', () => {
    // Unanswered question forced to orange/almost stays 0 attempts / 0 mastery
    const forcedUnanswered = setQuestionForcedState(undefined, 'almost');
    assert.ok(forcedUnanswered);
    assert.equal(getKnowledgeState(forcedUnanswered), 'almost');
    assert.equal(getRealKnowledgeState(forcedUnanswered), 'unanswered');
    assert.equal(needsRevision(forcedUnanswered), true);
    assert.equal(forcedUnanswered.attempts, 0);
    assert.equal(forcedUnanswered.mastery, 0);
    assert.equal(getMasteryPercentage(forcedUnanswered), 0);

    // Clearing force on an unattempted question removes the placeholder entry cleanly
    assert.equal(setQuestionForcedState(forcedUnanswered, undefined), undefined);

    // Real wrong answer forced into green/knows keeps exact real score and attempts
    const realWrong = recordQuestionAttempt(undefined, {
      isCorrect: false,
      selectedLabels: ['a'],
      weight: 1,
    });
    const forcedGreen = setQuestionForcedState(realWrong, 'knows');
    assert.ok(forcedGreen);
    assert.equal(getKnowledgeState(forcedGreen), 'knows');
    assert.equal(getRealKnowledgeState(forcedGreen), 'doesnt-know');
    assert.equal(needsRevision(forcedGreen), false);
    assert.equal(forcedGreen.mastery, realWrong.mastery);
    assert.equal(forcedGreen.attempts, realWrong.attempts);
    assert.equal(forcedGreen.incorrect, realWrong.incorrect);
    assert.equal(forcedGreen.streak, realWrong.streak);
    assert.equal(forcedGreen.lastResult, 'incorrect');

    // Subsequent real attempts update real mastery underneath while preserving forced section
    const updatedWhileForced = recordQuestionAttempt(forcedGreen, {
      isCorrect: true,
      selectedLabels: ['b'],
      weight: 1,
    });
    assert.equal(getKnowledgeState(updatedWhileForced), 'knows');
    assert.equal(getRealKnowledgeState(updatedWhileForced), 'almost');
    assert.equal(updatedWhileForced.attempts, 2);

    // Un-forcing restores the real state and updated mastery
    const restored = setQuestionForcedState(updatedWhileForced, undefined);
    assert.ok(restored);
    assert.equal(getKnowledgeState(restored), 'almost');
    assert.equal(restored.mastery, updatedWhileForced.mastery);
    assert.equal(restored.attempts, 2);

    // Deck summary counts forced sections while averaging real mastery only over attempted items
    const deck: Question[] = [
      { ...sampleQuestion, id: 'Q1' },
      { ...sampleQuestion, id: 'Q2' },
    ];
    const summary = getKnowledgeSummary(deck, {
      Q1: forcedGreen,
      Q2: forcedUnanswered,
    });
    assert.equal(summary.knowsCount, 1);
    assert.equal(summary.almostCount, 1);
    assert.equal(summary.unansweredCount, 0);
    assert.equal(summary.answeredCount, 2);
    assert.equal(summary.totalAttempts, 1);
    assert.equal(summary.averageMasteryPercentage, Math.round(realWrong.mastery * 100));

    // Ranking puts forced-knows ahead of real-almost in most-known sort
    const realAlmost = recordQuestionAttempt(undefined, {
      isCorrect: true,
      selectedLabels: ['b'],
      weight: 1,
    });
    const sorted = [
      { id: 'Q_ALMOST', index: 0, stats: realAlmost },
      { id: 'Q_FORCED_KNOWS', index: 1, stats: forcedGreen },
      { id: 'Q_UNSEEN', index: 2, stats: undefined },
    ]
      .sort((a, b) => compareByKnowledge(a.stats, b.stats, a.index, b.index, 'most-known'))
      .map((entry) => entry.id);
    assert.deepEqual(sorted, ['Q_FORCED_KNOWS', 'Q_ALMOST', 'Q_UNSEEN']);
  });

  it('migrates legacy stats entries without attempts or mastery', () => {
    const legacyOnceRight = normalizeQuestionStats({
      correct: 1,
      incorrect: 0,
      lastAnswer: ['b'],
      lastResult: 'correct',
    });
    assert.ok(legacyOnceRight);
    assert.equal(getKnowledgeState(legacyOnceRight), 'almost');
    assert.equal(legacyOnceRight.attempts, 1);

    const legacyMastered = normalizeQuestionStats({
      correct: 3,
      incorrect: 0,
      lastAnswer: ['b'],
      lastResult: 'correct',
    });
    assert.ok(legacyMastered);
    assert.equal(getKnowledgeState(legacyMastered), 'knows');

    const legacyWrong = normalizeQuestionStats({
      correct: 0,
      incorrect: 2,
      lastAnswer: ['a'],
      lastResult: 'incorrect',
    });
    assert.ok(legacyWrong);
    assert.equal(getKnowledgeState(legacyWrong), 'doesnt-know');
  });

  it('computes 4-tier knowledge summary accurately', () => {
    const qList: Question[] = [
      { ...sampleQuestion, id: 'Q1' },
      { ...sampleQuestion, id: 'Q2' },
      { ...sampleQuestion, id: 'Q3' },
      { ...sampleQuestion, id: 'Q4' },
    ];
    const q1 = recordQuestionAttempt(
      recordQuestionAttempt(undefined, { isCorrect: true, selectedLabels: ['b'] }),
      { isCorrect: true, selectedLabels: ['b'] },
    );
    const q2 = recordQuestionAttempt(undefined, { isCorrect: true, selectedLabels: ['b'] });
    const q3 = recordQuestionAttempt(undefined, { isCorrect: false, selectedLabels: ['a'] });

    const summary = getKnowledgeSummary(qList, { Q1: q1, Q2: q2, Q3: q3 });
    assert.equal(summary.total, 4);
    assert.equal(summary.knowsCount, 1);
    assert.equal(summary.almostCount, 1);
    assert.equal(summary.doesntKnowCount, 1);
    assert.equal(summary.unansweredCount, 1);
    assert.equal(summary.answeredCount, 3);
    assert.equal(summary.revisionCount, 2);
    assert.equal(summary.totalAttempts, 4);
    assert.equal(
      summary.averageMasteryPercentage,
      Math.round(((q1.mastery + q2.mastery + q3.mastery) / 3) * 100),
    );
  });

});

describe('storageUtils', () => {
  const memoryStorage = new MemoryStorage();

  beforeEach(() => {
    memoryStorage.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      value: memoryStorage,
      configurable: true,
      writable: true,
    });
  });

  it('loads and saves stats with normalization and fallback to emptyStats on corrupt data', () => {
    assert.deepEqual(loadStoredStats(), emptyStats());

    const nextStats: AllStats = {
      Biology: {
        BIO_1: {
          correct: 1.5,
          incorrect: 0.5,
          attempts: 2,
          streak: 1,
          mastery: 0.625,
          lastAnswer: ['b'],
          lastResult: 'correct',
          forcedState: 'doesnt-know',
        },
        BIO_2: {
          correct: 0,
          incorrect: 0,
          attempts: 0,
          streak: 0,
          mastery: 0,
          lastAnswer: [],
          forcedState: 'knows',
        },
      },
      Chemistry: {},
    };
    saveStoredStats(nextStats);
    assert.deepEqual(loadStoredStats(), nextStats);

    memoryStorage.setItem(
      STATS_STORAGE_KEY,
      JSON.stringify({
        Biology: {
          BIO_LEGACY: {
            correct: 1,
            incorrect: 0,
            lastAnswer: ['b'],
            lastResult: 'correct',
          },
          BIO_BAD_FORCE: {
            correct: 0,
            incorrect: 1,
            attempts: 1,
            streak: -1,
            mastery: 0.18,
            lastAnswer: ['a'],
            lastResult: 'incorrect',
            forcedState: 'invalid',
          },
        },
      }),
    );
    const migrated = loadStoredStats();
    assert.equal(getKnowledgeState(migrated.Biology.BIO_LEGACY), 'almost');
    assert.equal(migrated.Biology.BIO_BAD_FORCE.forcedState, undefined);
    assert.equal(getKnowledgeState(migrated.Biology.BIO_BAD_FORCE), 'doesnt-know');

    memoryStorage.setItem(STATS_STORAGE_KEY, '{corrupt-json');
    assert.deepEqual(loadStoredStats(), emptyStats());
  });

  it('loads and saves questions with validation fallback', () => {
    assert.deepEqual(loadStoredQuestions(sampleDatasets), sampleDatasets);

    const modified: Record<Subject, Question[]> = {
      ...sampleDatasets,
      Biology: [
        {
          ...sampleQuestion,
          question: 'Updated question text?',
        },
      ],
    };
    saveStoredQuestions(modified);
    assert.equal(
      loadStoredQuestions(sampleDatasets).Biology[0].question,
      'Updated question text?',
    );

    memoryStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify({ Biology: 'invalid' }));
    assert.deepEqual(loadStoredQuestions(sampleDatasets), sampleDatasets);
  });

  it('loads and saves fourAnswersOnly preference', () => {
    assert.equal(loadStoredFourAnswers(), false);
    saveStoredFourAnswers(true);
    assert.equal(memoryStorage.getItem(FOUR_ANSWERS_STORAGE_KEY), 'true');
    assert.equal(loadStoredFourAnswers(), true);
    saveStoredFourAnswers(false);
    assert.equal(loadStoredFourAnswers(), false);
  });

  it('loads and saves statsCollapsed preference', () => {
    assert.equal(loadStoredStatsCollapsed(), false);
    saveStoredStatsCollapsed(true);
    assert.equal(memoryStorage.getItem(STATS_COLLAPSED_STORAGE_KEY), 'true');
    assert.equal(loadStoredStatsCollapsed(), true);
    saveStoredStatsCollapsed(false);
    assert.equal(loadStoredStatsCollapsed(), false);
  });
});
