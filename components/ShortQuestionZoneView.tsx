import React, { useState } from 'react';
import { ActiveModule, ShortQuestion } from '../types';
import FuturisticButton from './common/FuturisticButton';
import GlassCard from './common/GlassCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useLearningContext } from '../contexts/LearningContext';
import { generateShortQuestions } from '../services/geminiService';
import ProcessingView from './ProcessingView';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const NoContextState = ({onSetActiveModule}: {onSetActiveModule: (module: ActiveModule) => void;}): JSX.Element => {
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

const ShortQuestionDisplay = ({ questions }: { questions: ShortQuestion[] }): JSX.Element => {
    return (
        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
                {questions.map((q, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <GlassCard className="!bg-slate-900/70">
                            <div className="flex justify-between items-start">
                                <p className="text-xl font-semibold text-white mb-3 pr-4">
                                    {index + 1}. {q.questionText}
                                </p>
                                <span className="text-sm font-bold bg-sky-500/20 text-sky-300 py-1 px-3 rounded-full">2 Marks</span>
                            </div>
                            <details className="bg-slate-800/50 rounded-lg group">
                                <summary className="p-3 font-semibold text-sky-300 cursor-pointer list-none">
                                    Show Answer Guide
                                </summary>
                                <div className="p-3 border-t border-slate-700/50">
                                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                                        {q.answerGuide.map((point, i) => (
                                            <li key={i}>{point}</li>
                                        ))}
                                    </ul>
                                </div>
                            </details>
                        </GlassCard>
                    </motion.div>
                ))}
            </AnimatePresence>
             <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }`}</style>
        </div>
    );
};

interface ShortQuestionZoneViewProps {
    onSetActiveModule: (module: ActiveModule) => void;
}

const ShortQuestionZoneView = ({ onSetActiveModule }: ShortQuestionZoneViewProps): JSX.Element => {
    const { t, language } = useLanguage();
    const { learningContext, sessionTitle } = useLearningContext();
    const { authState } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [questions, setQuestions] = useState<ShortQuestion[] | null>(null);
    const [questionCount, setQuestionCount] = useState(10);

    const handleGenerate = async () => {
        if (!learningContext) return;
        setIsLoading(true);
        setError(null);
        setQuestions(null);
        try {
            const result = await generateShortQuestions(learningContext, language, authState.user, questionCount);
            setQuestions(result);
        } catch(e) {
            setError(t('error.shortQuestionGeneration'));
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

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
             <div className="mb-6">
                <h1 className="text-4xl font-bold text-white">{t('short_question_zone_title')}</h1>
                <p className="text-slate-400 mt-1">{t('dashboard_session_hub', { title: sessionTitle })}</p>
            </div>

            {isLoading && (
                 <ProcessingView 
                    title={t('short_question_generating')}
                    subtitle={t('processing_subtitle')}
                    statusMessages={t('processing_status_notes').slice(0,4)} // Reuse some relevant status
                />
            )}
            
            {!isLoading && !questions && (
                <GlassCard className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">{t('short_question_zone_title')}</h2>
                    <p className="text-slate-400 mb-6">{t('short_question_zone_subtitle')}</p>
                    
                    <div className="max-w-md mx-auto mb-6">
                        <label htmlFor="question-count-slider" className="block mb-3 text-lg font-medium text-slate-200">
                           {t('short_question_num_questions')}: <span className="font-bold text-sky-400">{questionCount}</span>
                        </label>
                        <input
                            id="question-count-slider"
                            type="range"
                            min="10"
                            max="300"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                         <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                            <span>10</span>
                            <span>300</span>
                        </div>
                    </div>

                    <FuturisticButton onClick={handleGenerate} disabled={isLoading}>
                        {t('short_question_generate_button')}
                    </FuturisticButton>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </GlassCard>
            )}

            {!isLoading && questions && (
                <div>
                    <div className="text-center mb-6">
                        <FuturisticButton onClick={handleGenerate} disabled={isLoading} variant="secondary">
                           {t('short_question_generate_button')} again
                        </FuturisticButton>
                    </div>
                    <ShortQuestionDisplay questions={questions} />
                </div>
            )}
        </div>
    );
}

export default ShortQuestionZoneView;