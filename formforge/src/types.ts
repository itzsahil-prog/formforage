// Global Types for the application

export type FormTheme = {
  color: string;
  backgroundColor?: string;
  fontFamily?: string;
  bannerImage?: string;
};

export type QuestionType = 
  | 'short_text' 
  | 'long_text' 
  | 'email' 
  | 'number' 
  | 'date' 
  | 'time' 
  | 'dropdown' 
  | 'checkbox' 
  | 'multiple_choice'
  | 'section';

export interface Condition {
  targetQuestionId: string;
  value: string;
  operator: 'equals' | 'not_equals';
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[]; // Used for dropdown, multichoice, checkbox
  condition?: Condition | null;
}

export interface FormResponse {
  id: string;
  submittedAt: string;
  answers: Record<string, any>;
}

export interface Form {
  id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  theme: FormTheme;
  questions: Question[];
  responses: FormResponse[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AppState {
  user: User | null;
  token: string | null;
}
