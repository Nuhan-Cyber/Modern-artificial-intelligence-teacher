import React, { useState } from 'react';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import { QuizGenerationOptions, QuizDifficulty, QuizType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface QuizSetupViewProps {
    onQuizStart: (options: QuizGenerationOptions) => void;
    isGeneratingQuiz: boolean;
    error: string | null;
}

const QuizSetupView: React.FC<QuizSetupViewProps> = ({ onQuizStart, isGeneratingQuiz, error }) => {
    const [numberOfQuestions, setNumberOfQuestions] = React.useState(10);
    const [difficulty, setDifficulty] = React.useState<QuizDifficulty>('Mixed');
    const [type, setType] = React.useState<QuizType>('MCQ');
    const { t } = useLanguage();

    const difficultyOptions: {value: QuizDifficulty, label: string}[] = [
        { value: 'Easy', label: t('difficulty.easy') },
        { value: 'Medium', label: t('difficulty.medium') },
        { value: 'Creative', label: t('difficulty.creative') },
        { value: 'Mixed', label: t('difficulty.mixed') }
    ];

     const typeOptions: {value: QuizType, label: string}[] = [
        { value: 'MCQ', label: t('question_types.MCQ') },
        { value: 'GeneralKnowledge', label: t('question_types.GeneralKnowledge') },
        { value: 'Timeline', label: t('question_types.Timeline') },
        { value: 'OneMistake', label: t('question_types.OneMistake') }
    ];


    const handleStart = () => {
        onQuizStart({ numberOfQuestions, difficulty, type });
    };
    
    const OptionSelector: React.FC<{label: string, value: string, options: {value: string, label: string}[], onChange: (value: any) => void}> = ({label, value, options, onChange}) => (
        <div className="w-full mb-6">
            <label className="block mb-3 text-lg font-medium text-slate-200">{label}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-900/50 rounded-lg p-2">
                {options.map(opt => (
                    <button 
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`w-full py-3 text-sm font-bold rounded-md transition-all duration-200 ${value === opt.value ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/80'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <GlassCard>
            <div className="text-center">
                <h1 className="text-4xl font-bold text-white mb-2">{t('quiz_zone_title')}</h1>
                <p className="text-lg text-slate-300 mb-8">{t('quiz_zone_subtitle')}</p>
            </div>
            {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-4 text-center">{error}</div>}
            <div className="w-full max-w-2xl mx-auto">
                 <OptionSelector 
                    label={t('quiz_setup_q_type')}
                    value={type}
                    options={typeOptions}
                    onChange={setType}
                />
                 <OptionSelector 
                    label={t('quiz_setup_difficulty')}
                    value={difficulty}
                    options={difficultyOptions}
                    onChange={setDifficulty}
                />
                <div className="w-full mb-6">
                    <label htmlFor="question-count-slider" className="block mb-3 text-lg font-medium text-slate-200">
                        {t('quiz_setup_num_questions')}: <span className="font-bold text-sky-400">{numberOfQuestions}</span>
                    </label>
                    <input
                        id="question-count-slider"
                        type="range"
                        min="10"
                        max="300"
                        value={numberOfQuestions}
                        onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1 px-1">
                        <span>10</span>
                        <span>300</span>
                    </div>
                </div>
             </div>
             <div className="text-center mt-8">
                <FuturisticButton onClick={handleStart} disabled={isGeneratingQuiz}>
                    {isGeneratingQuiz ? t('quiz_setup_loading') : t('quiz_setup_button')}
                </FuturisticButton>
            </div>
        </GlassCard>
    );
};

export default QuizSetupView;