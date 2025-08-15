import React, { useState, useCallback } from 'react';
import { QuizResult, QuizQuestion, QuizGenerationOptions, QuizType, ActiveModule } from '../types';
import QuizSetupView from './QuizSetupView';
import QuizView from './QuizView';
import ResultsDashboard from './ResultsDashboard';
import { generateQuiz, analyzeQuizResults } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useLearningContext } from '../contexts/LearningContext';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import ProcessingView from './ProcessingView';
import { useUserStats } from '../contexts/UserStatsContext';
import { useAuth } from '../contexts/AuthContext';

type QuizZoneStep = 'setup' | 'generating' | 'quiz' | 'results';

interface QuizZoneViewProps {
  onSetActiveModule: (module: ActiveModule) => void;
}

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

const QuizZoneView: React.FC<QuizZoneViewProps> = ({ onSetActiveModule }) => {
  const [step, setStep] = useState<QuizZoneStep>('setup');
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { authState } = useAuth();
  const { learningContext, quiz, setQuiz, sessionTitle } = useLearningContext();
  const { updateStats } = useUserStats();
  const [currentQuizType, setCurrentQuizType] = useState<QuizType>('MCQ');
  const [quizOptions, setQuizOptions] = useState<QuizGenerationOptions | null>(null);

  const handleQuizStart = async (options: QuizGenerationOptions) => {
    if (!learningContext) return;
    setQuizOptions(options);
    setStep('generating');
    setError(null);
    setCurrentQuizType(options.type);
    try {
      const generatedQuiz = await generateQuiz(learningContext, options, language, authState.user);
      setQuiz(generatedQuiz);
      setStep('quiz');
    } catch (err) {
       console.error("Quiz generation failed:", err);
       setError(err instanceof Error ? err.message : t('error.quizGeneration'));
       setStep('setup');
    }
  };

  const handleQuizComplete = useCallback(async (result: Omit<QuizResult, 'unansweredQuestions' | 'conceptGaps'>) => {
    const unansweredQuestions = result.totalQuestions - result.answers.length;
    let finalResult: QuizResult = { ...result, unansweredQuestions };
    
    // Update user stats
    const correctCount = result.answers.filter(a => a.isCorrect).length;
    const incorrectCount = result.answers.length - correctCount;
    updateStats({ correct: correctCount, incorrect: incorrectCount });

    try {
        if(quiz) {
            const gaps = await analyzeQuizResults(quiz, result.answers, language, authState.user);
            finalResult.conceptGaps = gaps;
        }
    } catch (e) {
        console.error("Failed to analyze quiz results:", e);
        // continue without concept gaps
    }

    setQuizResult(finalResult);
    setStep('results');
  }, [quiz, language, updateStats, authState.user]);

  const handleTryAgain = () => {
    setQuiz(null);
    setQuizResult(null);
    setError(null);
    setQuizOptions(null);
    setStep('setup');
  }

  if (!learningContext) {
      return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <NoContextState onSetActiveModule={onSetActiveModule} />
        </div>
      );
  }

  const renderContent = () => {
    switch (step) {
      case 'setup':
        return <QuizSetupView onQuizStart={handleQuizStart} isGeneratingQuiz={false} error={error} />;
      case 'generating':
        return <ProcessingView 
            title={t('quiz_setup_loading')}
            subtitle={t('processing_subtitle')}
            statusMessages={[]} // Not used in this mode
            totalSteps={quizOptions?.numberOfQuestions}
            statusMessageTemplate={t('processing_status_quiz_template')}
        />;
      case 'quiz':
        return quiz ? <QuizView questions={quiz} quizType={currentQuizType} onQuizComplete={handleQuizComplete} /> : null;
      case 'results':
        return quizResult && quiz ? <ResultsDashboard 
            result={quizResult} 
            questions={quiz} 
            onTryAgain={handleTryAgain} 
            onBackToQuizZone={handleTryAgain}
            onSetActiveModule={onSetActiveModule}
        /> : null;
      default:
        return <QuizSetupView onQuizStart={handleQuizStart} isGeneratingQuiz={false} error={error}/>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
            <h1 className="text-4xl font-bold text-white">{t('quiz_zone_title')}</h1>
            <p className="text-slate-400 mt-1">{t('dashboard_session_hub', { title: sessionTitle })}</p>
        </div>
      <div className="content-enter">
          {renderContent()}
      </div>
    </div>
  );
};

export default QuizZoneView;
