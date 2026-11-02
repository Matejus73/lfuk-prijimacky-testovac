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

export interface QuestionStats {
    correct: number;
    incorrect: number;
    lastAnswer: string[];
    lastResult?: AnswerResult;
}

export type StatsByQuestion = Record<string, QuestionStats>;
export type AllStats = Record<Subject, StatsByQuestion>;