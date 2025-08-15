import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import { useAuth } from '../contexts/AuthContext';

const VerificationView: React.FC = () => {
  const { t } = useLanguage();
  const { verifyEmail } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6 && /^\d+$/.test(code)) {
        verifyEmail(code);
    } else {
        setError(t('verify_error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md content-enter">
        <GlassCard>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-white mb-2">{t('verify_title')}</h1>
            <p className="text-lg text-slate-300">{t('verify_subtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="sr-only">
                {t('verify_code_placeholder')}
              </label>
              <input
                id="code"
                name="code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                className="w-full text-center tracking-[1em] px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-2xl font-bold"
                placeholder="------"
              />
               {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
            </div>
            <div>
              <FuturisticButton type="submit" disabled={!code.trim() || code.length < 6} className="w-full">
                {t('verify_button')}
              </FuturisticButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default VerificationView;
