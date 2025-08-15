import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import { useAuth } from '../contexts/AuthContext';

const AuthView: React.FC = () => {
  const { t } = useLanguage();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [curriculum, setCurriculum] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      login(email, password);
    } else {
      signup({ name, email, country, curriculum });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md content-enter">
        <GlassCard>
          <div className="text-center mb-8">
            <h1 className="text-5xl font-extrabold text-white mb-2">{isLogin ? t('login_title') : t('signup_button')}</h1>
            <p className="text-lg text-slate-300">{t('login_subtitle')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-lg" placeholder={t('login_username_placeholder')} />
                <select required value={country} onChange={e => setCountry(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-lg">
                    <option value="">{t('auth_country_placeholder')}</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="China">China</option>
                    <option value="India">India</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Other">Other</option>
                </select>
                <input required value={curriculum} onChange={e => setCurriculum(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-lg" placeholder={t('auth_curriculum_placeholder')} />
                </>
            )}
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-lg" placeholder={t('login_email_placeholder')} />
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border-2 border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition-all duration-300 text-lg" placeholder={t('login_password_placeholder')} />
            
            <div className="pt-2">
              <FuturisticButton type="submit" className="w-full">
                {isLogin ? t('login_button') : t('signup_button')}
              </FuturisticButton>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
              {isLogin ? t('auth_switch_to_signup') : t('auth_switch_to_login')}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthView;
