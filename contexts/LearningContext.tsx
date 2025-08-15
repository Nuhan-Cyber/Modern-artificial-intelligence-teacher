import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { LearningContextState, Notes, QuizQuestion, Flashcard, TutorState, TutorModel } from '../types';
import { createTutorChat } from '../services/geminiService';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';

interface ILearningContext extends LearningContextState {
    setLearningContext: (context: string, title: string) => void;
    setNotes: (notes: Notes | null) => void;
    setQuiz: (quiz: QuizQuestion[] | null) => void;
    setFlashcards: (flashcards: Flashcard[] | null) => void;
    setTutorState: React.Dispatch<React.SetStateAction<TutorState>>;
    setInitialTutorMessage: (message: string | null) => void;
    setTutorModel: (model: TutorModel) => void;
    resetLearningContext: () => void;
    resetTutorChat: () => void;
}

const LearningContext = createContext<ILearningContext | undefined>(undefined);

const initialState: LearningContextState = {
    learningContext: null,
    notes: null,
    quiz: null,
    flashcards: null,
    tutorState: {
        chat: null,
        history: [],
        isLoading: false,
    },
    sessionTitle: null,
    initialTutorMessage: null,
    tutorModel: 'default',
};


export const LearningProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<LearningContextState>(initialState);
    const { language } = useLanguage();
    const { authState } = useAuth();

    const setLearningContext = useCallback((context: string, title: string) => {
        const { chat, initialHistory } = createTutorChat(context, language, authState.user, state.tutorModel);
        setState({
            ...initialState,
            learningContext: context,
            sessionTitle: title,
            tutorState: {
                chat,
                history: initialHistory,
                isLoading: false,
            }
        });
    }, [language, authState.user, state.tutorModel]);

    const setNotes = useCallback((notes: Notes | null) => {
        setState(prev => ({ ...prev, notes }));
    }, []);

    const setQuiz = useCallback((quiz: QuizQuestion[] | null) => {
        setState(prev => ({ ...prev, quiz }));
    }, []);

    const setFlashcards = useCallback((flashcards: Flashcard[] | null) => {
        setState(prev => ({...prev, flashcards}));
    }, []);

    const setTutorState = useCallback((tutorState: React.SetStateAction<TutorState>) => {
        setState(prev => ({...prev, tutorState: typeof tutorState === 'function' ? tutorState(prev.tutorState) : tutorState}));
    }, []);
    
    const setInitialTutorMessage = useCallback((message: string | null) => {
        setState(prev => ({...prev, initialTutorMessage: message}));
    }, []);

    const resetLearningContext = useCallback(() => {
        setState(initialState);
    }, []);

    const resetTutorChat = useCallback(() => {
        // We use a function form of setState to get the latest state
        setState(prevState => {
            const { chat, initialHistory } = createTutorChat(prevState.learningContext, language, authState.user, prevState.tutorModel);
            return {
                ...prevState,
                tutorState: {
                    chat,
                    history: initialHistory,
                    isLoading: false,
                },
                initialTutorMessage: null,
            };
        });
    }, [language, authState.user]);

    const setTutorModel = useCallback((model: TutorModel) => {
        setState(prev => ({ ...prev, tutorModel: model }));
        // Automatically reset the chat to apply the new persona
        resetTutorChat();
    }, [resetTutorChat]);


    return (
        <LearningContext.Provider value={{ 
            ...state, 
            setLearningContext, 
            setNotes, 
            setQuiz,
            setFlashcards,
            setTutorState,
            setInitialTutorMessage,
            setTutorModel,
            resetLearningContext,
            resetTutorChat,
        }}>
            {children}
        </LearningContext.Provider>
    );
};

export const useLearningContext = (): ILearningContext => {
    const context = useContext(LearningContext);
    if (context === undefined) {
        throw new Error('useLearningContext must be used within a LearningProvider');
    }
    return context;
};