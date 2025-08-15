import React, { useState } from 'react';
import { ActiveModule, CreativeQuestion } from '../types';
import FuturisticButton from './common/FuturisticButton';
import GlassCard from './common/GlassCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useLearningContext } from '../contexts/LearningContext';
import { generateCreativeQuestion, generateCreativeQuestionAnswer } from '../services/geminiService';
import ProcessingView from './ProcessingView';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface NoContextStateProps {
    onSetActiveModule: (module: ActiveModule) => void;
}

const NoContextState = ({ onSetActiveModule }: NoContextStateProps): JSX.Element => {
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

interface CreativeQuestionDisplayProps {
    cq: CreativeQuestion;
    onGenerateAnswer: () => void;
    isGeneratingAnswer: boolean;
}

const CreativeQuestionDisplay = ({ cq, onGenerateAnswer, isGeneratingAnswer }: CreativeQuestionDisplayProps): JSX.Element => {
    const { t } = useLanguage();
    return (
        <GlassCard className="!bg-slate-900/70">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-sky-300 mb-2">উদ্দীপক (Stimulus)</h3>
                <p className="text-slate-200 leading-relaxed bg-slate-800/50 p-4 rounded-lg">{cq.stem}</p>
            </div>
            <div className="space-y-4 mb-6">
                {cq.questions.map((q, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <span className="flex-shrink-0 text-xl font-bold text-sky-300 bg-slate-800 w-10 h-10 flex items-center justify-center rounded-full">{q.level}</span>
                        <div className="flex-grow pt-1">
                            <p className="text-lg text-white">{q.text}</p>
                        </div>
                        <span className="text-sm font-bold bg-slate-700 text-slate-300 py-1 px-3 rounded-full mt-1">{q.marks}</span>
                    </div>
                ))}
            </div>

            {!cq.answerSet && (
                 <div className="text-center">
                    <FuturisticButton onClick={onGenerateAnswer} disabled={isGeneratingAnswer} variant="secondary">
                       {isGeneratingAnswer ? t('cq_generating_answer') : t('cq_generate_answer')}
                    </FuturisticButton>
                </div>
            )}

            {cq.answerSet && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-2xl font-bold text-white mb-4 border-t border-slate-700 pt-4">{t('cq_model_answer')}</h3>
                    <div className="space-y-4">
                        {cq.answerSet.map((ans, i) => (
                            <div key={i} className="bg-slate-800/60 p-4 rounded-lg">
                                <h4 className="font-bold text-sky-300 text-lg mb-2">উত্তর ({ans.level})</h4>
                                <p className="text-slate-200 whitespace-pre-line leading-relaxed">{ans.answer}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </GlassCard>
    );
};

interface CreativeQuestionZoneViewProps {
    onSetActiveModule: (module: ActiveModule) => void;
}

const CreativeQuestionZoneView = ({ onSetActiveModule }: CreativeQuestionZoneViewProps): JSX.Element => {
    const { t, language } = useLanguage();
    const { learningContext, sessionTitle } = useLearningContext();
    const { authState } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingAnswer, setIsGeneratingAnswer] = useState<number | null>(null);
    const [error, setError] = useState<string|null>(null);
    const [creativeQuestions, setCreativeQuestions] = useState<CreativeQuestion[] | null>(null);
    const [subject, setSubject] = useState('');
    const [questionCount, setQuestionCount] = useState(2);

    const handleGenerate = async () => {
        if (!learningContext || !subject) return;
        setIsLoading(true);
        setError(null);
        setCreativeQuestions(null);
        try {
            const result = await generateCreativeQuestion(learningContext, subject, language, authState.user, questionCount);
            setCreativeQuestions(result);
        } catch(e) {
            setError(t('error.creativeQuestionGeneration'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

     const handleGenerateAnswer = async (index: number) => {
        if (!creativeQuestions) return;
        setIsGeneratingAnswer(index);
        setError(null);
        try {
            const result = await generateCreativeQuestionAnswer(creativeQuestions[index], subject, language, authState.user);
            setCreativeQuestions(prev => {
                if (!prev) return null;
                const newQuestions = [...prev];
                newQuestions[index].answerSet = result;
                return newQuestions;
            });
        } catch (e) {
            setError(t('error.creativeQuestionAnswerGeneration'));
            console.error(e);
        } finally {
            setIsGeneratingAnswer(null);
        }
    };
    
    if (!learningContext) {
        return (
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              <NoContextState onSetActiveModule={onSetActiveModule} />
          </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
             <div className="mb-6">
                <h1 className="text-4xl font-bold text-white">{t('creative_question_zone_title')}</h1>
                <p className="text-slate-400 mt-1">{t('dashboard_session_hub', { title: sessionTitle })}</p>
            </div>

            {isLoading && (
                 <ProcessingView 
                    title={t('creative_question_generating')}
                    subtitle={t('processing_subtitle')}
                    statusMessages={t('processing_status_notes')}
                />
            )}
            
            {!isLoading && !creativeQuestions && (
                <GlassCard className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">{t('creative_question_zone_title')}</h2>
                    <p className="text-slate-400 mb-6">{t('creative_question_zone_subtitle')}</p>
                    <div className="max-w-sm mx-auto mb-4">
                        <label className="block mb-2 font-semibold text-slate-200">{t('creative_question_subject_select')}</label>
                        <input 
                            type="text" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Physics, History, Math, গণিত"
                            className="w-full p-2 bg-slate-900/60 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-center"
                        />
                    </div>
                     <div className="max-w-sm mx-auto mb-6">
                        <label htmlFor="question-count-slider" className="block mb-3 text-lg font-medium text-slate-200">
                           {t('creative_question_num_questions')}: <span className="font-bold text-sky-400">{questionCount}</span>
                        </label>
                        <input
                            id="question-count-slider"
                            type="range"
                            min="2"
                            max="10"
                            value={questionCount}
                            onChange={(e) => setQuestionCount(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                         <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                            <span>2</span>
                            <span>10</span>
                        </div>
                    </div>
                    <FuturisticButton onClick={handleGenerate} disabled={isLoading || !subject}>
                        {t('creative_question_generate_button')}
                    </FuturisticButton>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </GlassCard>
            )}

            {!isLoading && creativeQuestions && (
                <div className="space-y-6">
                    <div className="text-center">
                        <FuturisticButton onClick={() => setCreativeQuestions(null)} disabled={isLoading} variant="secondary">
                           Generate New Questions
                        </FuturisticButton>
                    </div>
                     {error && <p className="text-red-400 my-4 text-center">{error}</p>}
                    <AnimatePresence>
                        {creativeQuestions.map((cq, index) => (
                             <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.15 }}
                            >
                                <CreativeQuestionDisplay 
                                    cq={cq} 
                                    onGenerateAnswer={() => handleGenerateAnswer(index)}
                                    isGeneratingAnswer={isGeneratingAnswer === index}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

export default CreativeQuestionZoneView;