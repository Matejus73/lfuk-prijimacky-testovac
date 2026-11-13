import type { AllStats, AnswerResult, Question, QuestionStats, Subject } from '../types.ts';

export const getQuestionStats = (
  stats: AllStats,
  subject: Subject,
  questionId: string,
): QuestionStats | undefined => stats[subject]?.[questionId];

export const areAnswersEqual = (selectedLabels: string[], correctLabels: string[]): boolean =>
  selectedLabels.length === correctLabels.length &&
  selectedLabels.every((label) => correctLabels.includes(label));

export const shuffle = <T,>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
};

export const getRandomOptionLabels = (question: Question): string[] =>
  shuffle(question.options)
    .slice(0, Math.min(4, question.options.length))
    .map((option) => option.label);

export const getInitialRandomOptionLabels = (
  questionSet: Record<Subject, Question[]>,
): Record<string, string[]> =>
  Object.fromEntries(
    (Object.keys(questionSet) as Subject[]).flatMap((subject) =>
      questionSet[subject].map((question) => [
        `${subject}:${question.id}`,
        getRandomOptionLabels(question),
      ]),
    ),
  );

export const formatQuestionForClipboard = (
  subject: Subject,
  question: Question,
  selectedLabels: string[],
  lastResult?: AnswerResult,
): string => {
  const answerText = selectedLabels.length ? selectedLabels.join(', ') : 'No answer';
  return [
    `${subject} - ${question.id}`,
    question.question,
    '',
    ...question.options.map(
      (option) =>
        `${selectedLabels.includes(option.label) ? '[x]' : '[ ]'} ${option.label}) ${option.text}`,
    ),
    '',
    `My last answer: ${answerText}`,
    ...(lastResult ? [`Result: ${lastResult}`] : []),
  ].join('\n');
};
