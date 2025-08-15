import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QuizQuestion, UserAnswer, QuizResult, QuizType } from '../types';
import FuturisticButton from './common/FuturisticButton';
import GlassCard from './common/GlassCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SpeakerIcon } from './common/icons/SpeakerIcon';

interface QuizViewProps {
  questions: QuizQuestion[];
  quizType: QuizType;
  onQuizComplete: (result: Omit<QuizResult, 'unansweredQuestions' | 'conceptGaps'>) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, quizType, onQuizComplete }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const { t } = useLanguage();
  const { speak, cancel, isSpeaking } = useTextToSpeech();

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = useMemo(() => {
    return userAnswers.find(a => a.questionIndex === currentQuestionIndex)?.answer || null;
  }, [userAnswers, currentQuestionIndex]);

  const finishQuiz = useCallback(() => {
    cancel(); // Stop any speech synthesis on finish
    const finalScore = userAnswers.length > 0 ? (userAnswers.filter(a => a.isCorrect).length / questions.length) * 100 : 0;
    const result = {
      score: Math.round(finalScore),
      answers: userAnswers,
      totalQuestions: questions.length
    };
    onQuizComplete(result);
  }, [questions.length, onQuizComplete, cancel, userAnswers]);
  
  // Stop speech when navigating
  useEffect(() => {
    cancel();
  }, [currentQuestionIndex, cancel]);


  const handleSpeechRequest = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak(currentQuestion.questionText);
    }
  };
  
  const handleOptionSelect = (option: string) => {
    const isCorrect = option === currentQuestion.correctAnswer;
    const newAnswer: UserAnswer = {
        questionIndex: currentQuestionIndex,
        answer: option,
        isCorrect,
    };

    setUserAnswers(prev => {
        const existingAnswerIndex = prev.findIndex(a => a.questionIndex === currentQuestionIndex);
        if (existingAnswerIndex > -1) {
            const updated = [...prev];
            updated[existingAnswerIndex] = newAnswer;
            return updated;
        }
        return [...prev, newAnswer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
    }
  };


  const renderQuestionBody = () => {
    if (['MCQ', 'GeneralKnowledge', 'Classic', 'Timeline'].includes(currentQuestion.questionType)) {
      return (
          <div className="space-y-4">
              {currentQuestion.options?.map((option, index) => (
                  <button
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full text-left p-4 rounded-lg transition-all text-white font-medium text-lg ${
                          selectedOption === option ? 'bg-sky-600 ring-2 ring-sky-400' : 'bg-slate-800/70 hover:bg-slate-700/90'
                      }`}
                  >
                      {option}
                  </button>
              ))}
          </div>
      );
    }
    return <p className="text-slate-400">{t('quiz_unsupported')} {currentQuestion.questionType}</p>;
  }

  return (
    <GlassCard>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-sky-300">{t('quiz_question', {current: currentQuestionIndex + 1, total: questions.length})}</h2>
            <div className="text-md font-semibold text-slate-300">
                {t('results_unanswered')}: {userAnswers.length}/{questions.length}
            </div>
        </div>
        <div className="w-full bg-slate-800/70 rounded-full h-2.5">
            <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
        </div>
      </div>
      
      <div className="flex items-start gap-4 mb-8">
        <p className="text-2xl font-semibold text-white leading-relaxed flex-1">{currentQuestion.questionText}</p>
        <button
            onClick={handleSpeechRequest}
            className={`p-2 rounded-full transition-colors duration-200 flex-shrink-0 ${isSpeaking ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
            aria-label={isSpeaking ? t('tts_stop_reading') : t('tts_read_aloud')}
        >
            <SpeakerIcon className="w-6 h-6" />
        </button>
      </div>

      
      <div className="min-h-[200px]">
        {renderQuestionBody()}
      </div>
      
      <div className="mt-8 flex justify-between items-center">
        <FuturisticButton onClick={handlePrev} disabled={currentQuestionIndex === 0} variant="secondary">
            Previous
        </FuturisticButton>
        <FuturisticButton onClick={finishQuiz}>
            {t('quiz_finish_button')}
        </FuturisticButton>
        <FuturisticButton onClick={handleNext} disabled={currentQuestionIndex === questions.length - 1} variant="secondary">
            Next
        </FuturisticButton>
      </div>
    </GlassCard>
  );
};

export default QuizView;