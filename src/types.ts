export interface Option {
  label: string;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  subject: string;
  question: string;
  options: Option[];
}

export type Subject = 'Biology' | 'Chemistry';

export type AnswerResult = 'correct' | 'incorrect' | 'unanswered';
export type KnowledgeState = 'knows' | 'almost' | 'doesnt-know' | 'unanswered';
export type ForcedKnowledgeState = Exclude<KnowledgeState, 'unanswered'>;

export interface QuestionStats {
  correct: number;
  incorrect: number;
  attempts: number;
  streak: number;
  mastery: number;
  lastAnswer: string[];
  lastResult?: AnswerResult;
  forcedState?: ForcedKnowledgeState;
}

export type StatsByQuestion = Record<string, QuestionStats>;
export type AllStats = Record<Subject, StatsByQuestion>;

export type HistorySort = 'ascending' | 'descending' | 'least-known' | 'most-known';
export type QuestionMode = 'all' | 'revision';
export type EditableQuestion = Question & { options: Question['options'] };
export type CopyStatus = 'idle' | 'copied' | 'failed';

export interface OptionEditDiff {
  isCorrectEdited: boolean;
  isTextEdited: boolean;
  isEdited: boolean;
}

export interface QuestionEditDiff {
  isEdited: boolean;
  isQuestionTextEdited: boolean;
  editedOptions: Record<string, OptionEditDiff>;
}
