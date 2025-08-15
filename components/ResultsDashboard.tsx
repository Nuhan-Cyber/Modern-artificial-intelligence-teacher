import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { QuizResult, QuizQuestion, ActiveModule } from '../types';
import FuturisticButton from './common/FuturisticButton';
import GlassCard from './common/GlassCard';
import { CheckCircleIcon } from './common/icons/CheckCircleIcon';
import { XCircleIcon } from './common/icons/XCircleIcon';
import { SparklesIcon } from './common/icons/SparklesIcon';
import { useLanguage } from '../contexts/LanguageContext';
import { evaluateAnswer } from '../services/geminiService';
import { useLearningContext } from '../contexts/LearningContext';
import { useAuth } from '../contexts/AuthContext';

interface ResultsDashboardProps {
  result: QuizResult;
  questions: QuizQuestion[];
  onTryAgain: () => void;
  onBackToQuizZone: () => void;
  onSetActiveModule: (module: ActiveModule) => void;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string; }> = ({ isOpen, onClose, children, title }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl content-enter" onClick={e => e.stopPropagation()}>
                <GlassCard className="border-sky-500/50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-white">{title}</h2>
                        <button onClick={onClose} className="text-slate-400 text-3xl hover:text-white">&times;</button>
                    </div>
                    {children}
                </GlassCard>
            </div>
        </div>
    );
};

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, questions, onTryAgain, onBackToQuizZone, onSetActiveModule }) => {
  const { score, answers, totalQuestions, unansweredQuestions, conceptGaps } = result;
  const { t, language } = useLanguage();
  const { setInitialTutorMessage } = useLearningContext();
  const { authState } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);
  const [userExplanation, setUserExplanation] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const correctAnswersCount = answers.filter(a => a.isCorrect).length;
  const incorrectAnswersCount = answers.length - correctAnswersCount;

  const pieData = [
    { name: t('results_correct'), value: correctAnswersCount },
    { name: t('results_incorrect'), value: incorrectAnswersCount },
    { name: t('results_unanswered'), value: unansweredQuestions },
  ].filter(item => item.value > 0);

  const COLORS = ['#22c55e', '#ef4444', '#64748b'];
  
  const allQuestionsWithAnswers = useMemo(() => {
    return questions.map((q, index) => {
      const userAnswer = answers.find(a => a.questionIndex === index);
      return {
        ...q,
        userAnswer: userAnswer?.answer,
        isCorrect: userAnswer?.isCorrect
      };
    });
  }, [answers, questions]);

  const handleOpenModal = (question: QuizQuestion) => {
    setSelectedQuestion(question);
    setUserExplanation('');
    setFeedback('');
    setIsModalOpen(true);
  };

  const handleDiscussConcept = (concept: string) => {
    const prompt = t('tutor_concept_prompt', { concept });
    setInitialTutorMessage(prompt);
    onSetActiveModule('tutor_zone');
  };

  const handleGetFeedback = async () => {
    if (!selectedQuestion || !userExplanation) return;
    setIsLoadingFeedback(true);
    try {
        const userAnswer = answers.find(a => questions[a.questionIndex] === selectedQuestion)?.answer || '';
        const aiFeedback = await evaluateAnswer(selectedQuestion, userAnswer, userExplanation, language, authState.user);
        setFeedback(aiFeedback);
    } catch (error) {
        console.error("Error getting feedback:", error);
        setFeedback(t('error.invalidData'));
    } finally {
        setIsLoadingFeedback(false);
    }
  };

  return (
    <>
    <GlassCard>
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold text-white mb-2">{t('results_title')}</h1>
        <p className={`text-7xl font-bold my-4 ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
          {score}%
        </p>
        <p className="text-xl text-slate-300">{t('results_subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center mb-10">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '0.5rem' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4 text-lg">
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg">
                <CheckCircleIcon className="w-8 h-8 text-green-400" />
                <div>
                    <span className="font-bold text-white">{correctAnswersCount}</span>
                    <span className="text-slate-300"> {t('results_correct_answers')}</span>
                </div>
            </div>
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg">
                <XCircleIcon className="w-8 h-8 text-red-400" />
                 <div>
                    <span className="font-bold text-white">{incorrectAnswersCount}</span>
                    <span className="text-slate-300"> {t('results_incorrect_answers')}</span>
                </div>
            </div>
             <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.546-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <div>
                    <span className="font-bold text-white">{unansweredQuestions}</span>
                    <span className="text-slate-300"> {t('results_unanswered_questions')}</span>
                </div>
            </div>
        </div>
      </div>
      
      {conceptGaps && conceptGaps.length > 0 && (
          <div className="mb-10">
              <GlassCard className="border-sky-500/30">
                  <h2 className="text-2xl font-bold text-white mb-2">{t('results_concept_gaps_title')}</h2>
                  <p className="text-slate-400 mb-4">{t('results_concept_gaps_desc')}</p>
                  <div className="space-y-3">
                      {conceptGaps.map((gap, index) => (
                          <div key={index} className="bg-slate-900/60 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                  <h3 className="font-semibold text-sky-300 text-lg">{gap.concept}</h3>
                                  <p className="text-slate-300 text-sm">{gap.suggestion}</p>
                              </div>
                              <FuturisticButton onClick={() => handleDiscussConcept(gap.concept)} variant="secondary" className="!px-3 !py-2 !text-sm !transform-none active:scale-100">
                                  {t('results_discuss_with_tutor')}
                              </FuturisticButton>
                          </div>
                      ))}
                  </div>
              </GlassCard>
          </div>
      )}

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-4">{t('results_review_title')}</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          {allQuestionsWithAnswers.map((q, index) => (
            <div key={index} className={`bg-slate-900/60 p-4 rounded-lg border-l-4 ${q.isCorrect === true ? 'border-green-500' : q.isCorrect === false ? 'border-red-500' : 'border-slate-500'}`}>
              <p className="font-semibold text-white text-lg mb-2">{q.questionText}</p>
              {q.userAnswer ? (
                <>
                    <p className={`text-sm ${q.isCorrect ? 'text-green-300' : 'text-red-300'}`}>{t('results_your_answer')} {q.userAnswer}</p>
                    {q.isCorrect === false && <p className="text-sm text-sky-300">{t('results_correct_answer')} {q.correctAnswer}</p>}
                </>
              ) : (
                <p className="text-sm text-slate-400">{t('results_correct_answer')} {q.correctAnswer}</p>
              )}
              <p className="text-sm text-slate-400 mt-2"><strong>{t('results_explanation')}</strong> {q.explanation}</p>
              <div className="mt-3 text-right">
                  <button onClick={() => handleOpenModal(q)} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300 transition-colors">
                      <SparklesIcon className="w-5 h-5" />
                      {t('results_analyze_reasoning')}
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <FuturisticButton onClick={onTryAgain} variant="secondary">{t('results_try_again_button')}</FuturisticButton>
        <FuturisticButton onClick={onBackToQuizZone}>{t('results_back_button')}</FuturisticButton>
      </div>
       <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: #1e293b;
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #475569;
                border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #64748b;
            }
       `}</style>
    </GlassCard>

    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t('modal_explain_title')}>
        <div>
            <p className="text-slate-300 mb-4">{t('modal_explain_prompt')}</p>
            <div className="bg-slate-900/50 p-3 rounded-md mb-4">
                <p className="font-semibold text-white">{selectedQuestion?.questionText}</p>
                <p className="text-sm text-amber-300 mt-1">{t('results_your_answer')} {answers.find(a => questions[a.questionIndex] === selectedQuestion)?.answer}</p>
            </div>
            
            <textarea
                value={userExplanation}
                onChange={e => setUserExplanation(e.target.value)}
                className="w-full p-2 bg-slate-800/80 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow h-28 resize-none"
                placeholder={t('modal_your_explanation_label')}
                disabled={isLoadingFeedback || !!feedback}
            />
            
            {!feedback && (
                <div className="text-center mt-4">
                    <FuturisticButton onClick={handleGetFeedback} disabled={isLoadingFeedback || !userExplanation}>
                        {isLoadingFeedback ? t('modal_loading') : t('modal_get_feedback_button')}
                    </FuturisticButton>
                </div>
            )}
            
            {isLoadingFeedback && !feedback && (
                <div className="text-center text-slate-300 mt-4">{t('modal_loading')}</div>
            )}

            {feedback && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-sky-300 mb-2">{t('modal_ai_feedback_title')}</h3>
                    <div className="bg-slate-900/50 p-3 rounded-md text-slate-200" dangerouslySetInnerHTML={{ __html: feedback.replace(/\n/g, '<br />') }}></div>
                </div>
            )}
             <div className="text-center mt-6">
                <FuturisticButton onClick={() => setIsModalOpen(false)} variant="secondary">{t('modal_close')}</FuturisticButton>
            </div>
        </div>
    </Modal>
    </>
  );
};

export default ResultsDashboard;
