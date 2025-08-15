import { Chat } from '@google/genai';

export type Language = 'bn' | 'en' | 'zh';

export enum View {
  Auth,
  VerifyEmail,
  Onboarding,
  Dashboard
}

export type ActiveModule = 
  | 'dashboard'
  | 'upload'
  | 'quiz_zone'
  | 'notes_zone'
  | 'flashcards_zone'
  | 'tutor_zone'
  | 'routine_maker'
  | 'advanced_calculator'
  | 'profile'
  | 'settings'
  | 'short_question_zone'
  | 'creative_question_zone';


export type TabType = 'quiz' | 'notes' | 'tutor' | 'image' | 'flashcards';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Creative' | 'Mixed';
export type QuizType = 'MCQ' | 'Timeline' | 'OneMistake' | 'Classic' | 'GeneralKnowledge';

export type TutorModel = 'default' | 'math' | 'english' | 'science' | 'bangla_grammar' | 'english_grammar';

export interface QuizQuestion {
  questionText: string;
  questionType: QuizType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  sourceReference?: string;
  difficulty: QuizDifficulty;
}

export interface QuizGenerationOptions {
    numberOfQuestions: number;
    difficulty: QuizDifficulty;
    type: QuizType;
}

export interface NoteConcept {
  concept: string;
  points: string[];
}

export interface NoteDefinition {
    term: string;
    definition: string;
}

export interface NotePerson {
    name: string;
    significance: string;
}

export interface NoteDate {
    date: string;
    event: string;
}

export interface NoteLocation {
    name: string;
    significance: string;
}

export interface MemorizationKey {
    type: 'Fact' | 'Definition' | 'Date' | 'Person' | 'Formula';
    key: string;
    value: string;
}

export interface Notes {
  summary: string;
  keyConcepts: NoteConcept[];
  memorizationKeys: MemorizationKey[];
  definitions: NoteDefinition[];
  examples: string[];
  keyPeople: NotePerson[];
  keyDates: NoteDate[];
  keyLocations: NoteLocation[];
  studyQuestions: string[];
}

export interface UserAnswer {
  questionIndex: number;
  answer: string;
  isCorrect: boolean;
}

export interface ConceptGap {
    concept: string;
    suggestion: string;
}

export interface QuizResult {
  score: number;
  answers: UserAnswer[];
  totalQuestions: number;
  unansweredQuestions: number;
  conceptGaps?: ConceptGap[];
}

export interface ChartData {
    type: 'pie' | 'bar' | 'line';
    data: any[];
    dataKey: string;
    nameKey?: string;
    additionalKeys?: { key: string, color: string }[];
}

export interface GroundingSource {
    uri: string;
    title: string;
    [key: string]: any;
}

export interface ChatMessagePart {
    text?: string;
    imageData?: string;
    chartData?: ChartData;
    flowchartHtml?: string;
}
export interface TutorDefinition {
    term: string;
    definition: string;
}

export interface TutorVocabulary {
    word: string;
    meaning: string;
}

export interface TutorFormula {
    name: string;
    formula: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: ChatMessagePart[];
    sources?: GroundingSource[];
    definitions?: TutorDefinition[];
    vocabulary?: TutorVocabulary[];
    formulas?: TutorFormula[];
}

export interface TutorState {
    chat: Chat | null;
    history: ChatMessage[];
    isLoading: boolean;
}

export interface ImageGeneratorState {
    isGenerating: boolean;
    generatedImage: string | null;
    error: string | null;
}

export interface Flashcard {
    term: string;
    definition: string;
}

export interface UserProfile {
  name: string;
  email: string;
  country: string;
  curriculum: string;
  // Onboarding answers
  learningStyle: 'visual' | 'text' | 'interactive' | null;
  subjects: string[];
  goals: string;
}

export interface ScheduledTask {
  time: string; // e.g., "09:00 AM"
  subject: string;
  task: string;
  duration: number; // in minutes
  type: 'study' | 'break' | 'custom';
}

export interface ToDoItem {
    id: number;
    text: string;
    completed: boolean;
}

export interface UserStats {
    quizzesTaken: number;
    totalCorrect: number;
    totalIncorrect: number;
    // Add other stats as needed, e.g., time studied
}

export interface ProcessingViewProps {
    title: string;
    subtitle: string;
    statusMessages: string[];
    totalSteps?: number;
    statusMessageTemplate?: string;
    duration?: number;
}

export interface ShortQuestion {
    questionText: string;
    subject: string; 
    answerGuide: string[];
}

export interface CreativeQuestion {
    subject: string;
    stem: string;
    questions: {
        level: 'ক' | 'খ' | 'গ' | 'ঘ';
        text: string;
        marks: number;
    }[];
    answerSet?: {
        level: 'ক' | 'খ' | 'গ' | 'ঘ';
        answer: string;
    }[];
}

// --- Centralized State for a Learning Session ---
export interface LearningContextState {
    learningContext: string | null;
    notes: Notes | null;
    quiz: QuizQuestion[] | null;
    flashcards: Flashcard[] | null;
    tutorState: TutorState;
    sessionTitle: string | null;
    initialTutorMessage: string | null;
    tutorModel: TutorModel;
}