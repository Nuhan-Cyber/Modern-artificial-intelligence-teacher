import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useLearningContext } from '../contexts/LearningContext';
import FileUploadView from './FileUploadView';
import ProcessingView from './ProcessingView';
import { analyzeContent } from '../services/geminiService';
import { ActiveModule } from '../types';
import { useUserStats } from '../contexts/UserStatsContext';
import { useAuth } from '../contexts/AuthContext';

interface DashboardViewProps {
  onSelectModule: (module: ActiveModule) => void;
}

type Step = 'idle' | 'uploading' | 'processing';

const SessionHub: React.FC<{onSelectModule: (module: ActiveModule) => void}> = ({ onSelectModule }) => {
    const { t } = useLanguage();
    const { sessionTitle } = useLearningContext();
    return (
        <GlassCard className="!bg-slate-950/50 border-sky-500/30">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white">{t('dashboard_session_hub', {title: sessionTitle})}</h2>
                <p className="text-slate-400 mt-2 mb-6">{t('dashboard_session_hub_desc')}</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <FuturisticButton onClick={() => onSelectModule('quiz_zone')} variant="secondary">{t('dashboard_generate_quiz')}</FuturisticButton>
                    <FuturisticButton onClick={() => onSelectModule('notes_zone')} variant="secondary">{t('dashboard_generate_notes')}</FuturisticButton>
                    <FuturisticButton onClick={() => onSelectModule('flashcards_zone')} variant="secondary">{t('dashboard_generate_flashcards')}</FuturisticButton>
                </div>
            </div>
        </GlassCard>
    )
}

const DashboardView: React.FC<DashboardViewProps> = ({ onSelectModule }) => {
  const { t, language } = useLanguage();
  const { authState } = useAuth();
  const { learningContext, setLearningContext } = useLearningContext();
  const { stats, loadStats } = useUserStats();
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState<string|null>(null);
  
  useEffect(() => {
    if (authState.user) {
      loadStats(authState.user.name);
    }
  }, [authState.user, loadStats]);

  const handleAnalysisStart = async (files: File[]) => {
    setStep('processing');
    setError(null);
    try {
      const {context, title} = await analyzeContent(files, language, authState.user);
      setLearningContext(context, title);
      setStep('idle'); // Go back to idle, which will now show the session hub
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? err.message : t('error.unknownAnalysis'));
      setStep('uploading');
    }
  };

  const totalAnswered = stats.totalCorrect + stats.totalIncorrect;
  const accuracyPercentage = totalAnswered > 0 ? Math.round((stats.totalCorrect / totalAnswered) * 100) : 0;

  const accuracyData = [ 
      { name: t('results_correct'), value: stats.totalCorrect }, 
      { name: t('results_incorrect'), value: stats.totalIncorrect },
  ];
  
  const weeklyActivityData = [ { day: 'Mon', hours: 2 }, { day: 'Tue', hours: 3 }, { day: 'Wed', hours: 1.5 }, { day: 'Thu', hours: 4 }, { day: 'Fri', hours: 2.5 }, { day: 'Sat', hours: 5 }, { day: 'Sun', hours: 1 },];

  const COLORS = ['#0ea5e9', '#475569'];

  const renderTopSection = () => {
    if (step === 'uploading') {
        return <FileUploadView onFilesSubmit={handleAnalysisStart} isLoading={false} error={error} />;
    }
    if (step === 'processing') {
        return <ProcessingView 
            title={t('processing_title')}
            subtitle={t('processing_subtitle')}
            statusMessages={t('processing_status')}
        />;
    }
    if (learningContext) {
        return <SessionHub onSelectModule={onSelectModule} />;
    }
    return (
        <GlassCard className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">{t('dashboard_no_session_title')}</h2>
            <p className="text-slate-400 mb-6">{t('dashboard_no_session_desc')}</p>
            <FuturisticButton onClick={() => setStep('uploading')}>{t('dashboard_start_session')}</FuturisticButton>
        </GlassCard>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 content-enter">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">{t('dashboard_greeting', {userName: authState.user?.name || ''})}</h1>
        <p className="text-slate-400 mt-1">{t('dashboard_motivation')}</p>
      </div>

      <div className="mb-8">
          {renderTopSection()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <GlassCard>
            <h3 className="text-lg font-bold text-white mb-2">{t('dashboard_accuracy')}</h3>
            <p className="text-4xl font-bold text-sky-400">{accuracyPercentage}%</p>
        </GlassCard>
         <GlassCard>
            <h3 className="text-lg font-bold text-white mb-2">{t('dashboard_quizzes_taken')}</h3>
            <p className="text-4xl font-bold text-sky-400">{stats.quizzesTaken}</p>
        </GlassCard>
         <GlassCard>
            <h3 className="text-lg font-bold text-white mb-2">{t('dashboard_engagement_score')}</h3>
            <p className="text-4xl font-bold text-sky-400">82</p>
             <p className="text-sm text-slate-400">Based on recent activity</p>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2">
            <h3 className="text-xl font-bold text-white mb-4">{t('dashboard_weekly_activity')}</h3>
            <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="day" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8"/>
                        <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '0.5rem' }}/>
                        <Legend />
                        <Bar dataKey="hours" fill="#0ea5e9" name="Study Hours" barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-xl font-bold text-white mb-4">{t('dashboard_performance_overview')}</h3>
             <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={accuracyData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} label={({ name, value }) => `${name}: ${value}`}>
                            {accuracyData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                        </Pie>
                         <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid #334155', borderRadius: '0.5rem' }}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </GlassCard>
      </div>
    </div>
  );
};

export default DashboardView;
