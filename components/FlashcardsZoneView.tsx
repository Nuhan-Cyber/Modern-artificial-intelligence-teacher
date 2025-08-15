import React, { useState, useMemo, useEffect } from 'react';
import { ActiveModule, Flashcard } from '../types';
import FuturisticButton from './common/FuturisticButton';
import GlassCard from './common/GlassCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useLearningContext } from '../contexts/LearningContext';
import { generateFlashcards } from '../services/geminiService';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SpeakerIcon } from './common/icons/SpeakerIcon';
import ProcessingView from './ProcessingView';
import { useAuth } from '../contexts/AuthContext';

const NoContextState: React.FC<{onSetActiveModule: (module: ActiveModule) => void;}> = ({onSetActiveModule}) => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <GlassCard>
                <h2 className="text-3xl font-bold text-white mb-4">{t('zone_no_context_title')}</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">{t('zone_no_context_desc')}</p>
                <FuturisticButton onClick={() => onSetActiveModule('dashboard')}>{t('zone_back_to_dashboard')}</FuturisticButton>
            </GlassCard>
        </div>
    )
}

const FlashcardsDisplay: React.FC<{initialFlashcards: Flashcard[]}> = ({ initialFlashcards }) => {
    const [flashcards, setFlashcards] = useState(initialFlashcards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const { t } = useLanguage();
    const { speak, cancel, isSpeaking } = useTextToSpeech();

    const currentCard = useMemo(() => flashcards[currentIndex], [flashcards, currentIndex]);

    useEffect(() => { cancel(); }, [currentIndex, isFlipped, cancel]);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => (prev + 1) % flashcards.length), 150);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 150);
    };

    const handleShuffle = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
            setCurrentIndex(0);
        }, 150);
    };

    const handleSpeechRequest = (e: React.MouseEvent, text: string) => {
        e.stopPropagation();
        if (isSpeaking) cancel();
        else speak(text);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[500px]">
            <style>{`.flashcard-container { perspective: 1000px; } .flashcard { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.6s; } .flashcard.flipped { transform: rotateY(180deg); } .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; } .card-face-back { transform: rotateY(180deg); }`}</style>
            <div className="flashcard-container w-full max-w-2xl h-80 mb-6">
                <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                    <div className="card-face glass-card-bg rounded-2xl">
                        <button onClick={(e) => handleSpeechRequest(e, currentCard.term)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/50 transition-colors" aria-label={t('tts_read_aloud')}><SpeakerIcon className="w-6 h-6 text-slate-400"/></button>
                        <h2 className="text-3xl font-bold text-sky-300">{currentCard.term}</h2>
                        <p className="absolute bottom-4 text-xs text-slate-500">{t('flashcards_flip')}</p>
                    </div>
                    <div className="card-face glass-card-bg rounded-2xl card-face-back">
                        <button onClick={(e) => handleSpeechRequest(e, currentCard.definition)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/50 transition-colors" aria-label={t('tts_read_aloud')}><SpeakerIcon className="w-6 h-6 text-slate-400"/></button>
                        <p className="text-xl text-slate-200 leading-relaxed overflow-y-auto">{currentCard.definition}</p>
                        <p className="absolute bottom-4 text-xs text-slate-500">{t('flashcards_flip')}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-between w-full max-w-2xl">
                 <FuturisticButton onClick={handlePrev} variant="secondary" className="!p-3" aria-label="Previous Card"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></FuturisticButton>
                <div className="text-center">
                    <p className="font-bold text-white text-lg">{currentIndex + 1} / {flashcards.length}</p>
                    <button onClick={handleShuffle} className="mt-1 text-sm text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 mx-auto"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5v5M4 20L20 4M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>{t('flashcards_shuffle')}</button>
                </div>
                <FuturisticButton onClick={handleNext} variant="secondary" className="!p-3" aria-label="Next Card"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></FuturisticButton>
            </div>
        </div>
    );
};

const FlashcardsZoneView: React.FC<{onSetActiveModule: (module: ActiveModule) => void;}> = ({ onSetActiveModule }) => {
    const { t, language } = useLanguage();
    const { learningContext, flashcards, setFlashcards, sessionTitle } = useLearningContext();
    const { authState } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const handleGenerateFlashcards = async () => {
        if (!learningContext) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateFlashcards(learningContext, language, authState.user);
            setFlashcards(result);
        } catch(e) {
            setError(t('error.flashcardGeneration'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    if (!learningContext) {
        return (
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              <NoContextState onSetActiveModule={onSetActiveModule} />
          </div>
        );
    }
    
    if (isLoading) {
        return (
             <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
                <ProcessingView 
                    title={t('flashcards_zone_generating')}
                    subtitle={t('processing_subtitle')}
                    statusMessages={t('processing_status_cards')}
                />
            </div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-white">{t('flashcards_zone_title')}</h1>
                <p className="text-slate-400 mt-1">{t('dashboard_session_hub', { title: sessionTitle })}</p>
            </div>
            
            {!flashcards && (
                 <GlassCard className="text-center">
                    <FuturisticButton onClick={handleGenerateFlashcards} disabled={isLoading}>
                        {isLoading ? t('flashcards_zone_generating') : t('flashcards_zone_generate_button')}
                    </FuturisticButton>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </GlassCard>
            )}

            {flashcards && flashcards.length > 0 && <FlashcardsDisplay initialFlashcards={flashcards} />}
        </div>
    );
}

export default FlashcardsZoneView;
