import type {
  AllStats,
  AnswerResult,
  Question,
  QuestionEditDiff,
  QuestionStats,
  Subject,
} from '../types.ts';

export const getQuestionStats = (
  stats: AllStats,
  subject: Subject,
  questionId: string,
): QuestionStats | undefined => stats[subject]?.[questionId];

export const roundStat = (value: number): number => Math.round(value * 100) / 100;

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

const haveSameLabelSet = (left: string[], right: string[]): boolean => {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((label) => rightSet.has(label));
};

const pickFourOptionLabels = (question: Question): string[] => {
  const targetCount = Math.min(4, question.options.length);
  if (targetCount === 0) return [];

  const shuffled = shuffle(question.options);
  const picked = shuffled.slice(0, targetCount);

  if (!picked.some((option) => option.is_correct)) {
    const correctOptions = shuffled.slice(targetCount).filter((option) => option.is_correct);
    if (correctOptions.length > 0) {
      const replaceIndex = Math.floor(Math.random() * picked.length);
      picked[replaceIndex] = correctOptions[0];
    }
  }

  return picked.map((option) => option.label);
};

export const getRandomOptionLabels = (
  question: Question,
  previousLabels?: string[],
): string[] => {
  const targetCount = Math.min(4, question.options.length);
  if (targetCount === 0) return [];

  let labels = pickFourOptionLabels(question);

  if (
    previousLabels &&
    previousLabels.length === labels.length &&
    question.options.length > targetCount
  ) {
    for (let attempt = 0; attempt < 11 && haveSameLabelSet(labels, previousLabels); attempt += 1) {
      labels = pickFourOptionLabels(question);
    }
  }

  if (
    previousLabels &&
    labels.length > 1 &&
    previousLabels.length === labels.length &&
    labels.every((label, index) => label === previousLabels[index])
  ) {
    return [...labels.slice(1), labels[0]];
  }

  return labels;
};

export const getReshuffledOptionLabels = (
  question: Question,
  previousLabels?: string[],
): string[] => {
  const labels = question.options.map((option) => option.label);
  if (labels.length <= 1) return labels;

  const next = shuffle(labels);
  if (
    previousLabels &&
    previousLabels.length === next.length &&
    next.every((label, index) => label === previousLabels[index])
  ) {
    return [...next.slice(1), next[0]];
  }

  return next;
};

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

export const getQuestionEditDiff = (
  question: Question,
  originalQuestion?: Question,
): QuestionEditDiff => {
  if (!originalQuestion) {
    return {
      isEdited: false,
      isQuestionTextEdited: false,
      editedOptions: {},
    };
  }

  const isQuestionTextEdited = question.question.trim() !== originalQuestion.question.trim();
  const originalByLabel = new Map(
    originalQuestion.options.map((option) => [option.label, option] as const),
  );
  const editedOptions: QuestionEditDiff['editedOptions'] = {};
  let hasEditedOption = false;

  for (const option of question.options) {
    const originalOption = originalByLabel.get(option.label);
    const isCorrectEdited = originalOption ? option.is_correct !== originalOption.is_correct : true;
    const isTextEdited = originalOption ? option.text.trim() !== originalOption.text.trim() : true;
    const isEdited = isCorrectEdited || isTextEdited;
    if (isEdited) {
      hasEditedOption = true;
    }
    editedOptions[option.label] = {
      isCorrectEdited,
      isTextEdited,
      isEdited,
    };
  }

  return {
    isEdited: isQuestionTextEdited || hasEditedOption,
    isQuestionTextEdited,
    editedOptions,
  };
};

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
