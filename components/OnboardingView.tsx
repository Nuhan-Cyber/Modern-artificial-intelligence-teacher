import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import ProcessingView from './ProcessingView';

const OnboardingView: React.FC = () => {
  const { t } = useLanguage();
  const { authState, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [preferences, setPreferences] = useState({
    learningStyle: authState.user?.learningStyle || null,
    subjects: authState.user?.subjects || [],
    goals: authState.user?.goals || '',
  });

  const handleNext = () => setStep(prev => prev + 1);

  const handleFinish = () => {
    setIsOptimizing(true);
    // Simulate a 2-minute (120,000 ms) optimization process
    setTimeout(() => {
        completeOnboarding(preferences);
    }, 120000); 
  };

  const updatePreference = <K extends keyof typeof preferences>(key: K, value: (typeof preferences)[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };
  
  if (isOptimizing) {
    return (
       <div className="min-h-screen flex items-center justify-center p-4">
          <ProcessingView 
            title={t('onboarding_optimizing_title')}
            subtitle={t('onboarding_optimizing_subtitle')}
            statusMessages={t('onboarding_optimizing_status')}
            duration={120000}
          />
       </div>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div key="step1" className="content-enter">
            <h2 className="text-2xl font-bold text-white mb-4">{t('onboarding_q1')}</h2>
            <div className="space-y-4">
              {([
                { key: 'visual', label: t('onboarding_q1_op1') },
                { key: 'text', label: t('onboarding_q1_op2') },
                { key: 'interactive', label: t('onboarding_q1_op3') },
              ] as const).map(option => (
                <button
                  key={option.key}
                  onClick={() => updatePreference('learningStyle', option.key)}
                  className={`w-full text-left p-4 rounded-lg transition-all text-white font-medium text-lg ${
                    preferences.learningStyle === option.key ? 'bg-sky-600 ring-2 ring-sky-400' : 'bg-slate-800/70 hover:bg-slate-700/90'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-8 text-right">
              <FuturisticButton onClick={handleNext} disabled={!preferences.learningStyle}>{t('onboarding_next')}</FuturisticButton>
            </div>
          </div>
        );
      case 2:
        return (
          <div key="step2" className="content-enter">
            <h2 className="text-2xl font-bold text-white mb-4">{t('onboarding_q2')}</h2>
            <p className="text-slate-400 mb-4">Separate subjects with commas.</p>
            <input
              type="text"
              value={preferences.subjects.join(', ')}
              onChange={e => updatePreference('subjects', e.target.value.split(',').map(s => s.trim()))}
              placeholder={t('onboarding_q2_placeholder')}
              className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-lg"
            />
             <div className="mt-8 text-right">
              <FuturisticButton onClick={handleNext} disabled={preferences.subjects.length === 0 || preferences.subjects.some(s => s === '')}>{t('onboarding_next')}</FuturisticButton>
            </div>
          </div>
        );
      case 3:
        return (
          <div key="step3" className="content-enter">
            <h2 className="text-2xl font-bold text-white mb-4">{t('onboarding_q3')}</h2>
             <textarea
                value={preferences.goals}
                onChange={e => updatePreference('goals', e.target.value)}
                placeholder={t('onboarding_q3_placeholder')}
                className="w-full h-32 px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-lg resize-none"
             />
             <div className="mt-8 text-right">
              <FuturisticButton onClick={handleFinish} disabled={!preferences.goals}>{t('onboarding_finish')}</FuturisticButton>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <GlassCard>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-white mb-2">{t('onboarding_welcome', { userName: authState.user?.name || '' })}</h1>
            <p className="text-lg text-slate-300">{t('onboarding_intro')}</p>
          </div>
          
          <div className="w-full bg-slate-800/70 rounded-full h-2.5 mb-8">
            <div className="bg-sky-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          {renderStep()}
        </GlassCard>
      </div>
    </div>
  );
};

export default OnboardingView;
