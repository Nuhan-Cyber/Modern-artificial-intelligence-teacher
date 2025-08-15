import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    onToggleSidebar: () => void;
}

const HamburgerIcon: React.FC<{onClick: () => void}> = ({onClick}) => (
    <button onClick={onClick} className="p-2 rounded-md hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    </button>
);


const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const { t } = useLanguage();
    const { authState } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);
    
    return (
        <header className="sticky top-0 z-30 bg-slate-950/50 backdrop-blur-lg border-b border-slate-800/60">
             <div className="w-full max-w-[100rem] mx-auto flex justify-between items-center p-4">
                <div className="flex items-center gap-4">
                    <HamburgerIcon onClick={onToggleSidebar} />
                    <h1 className="text-xl font-bold text-white hidden sm:block">
                        {t('header_title')}
                    </h1>
                </div>
                <div className="flex items-center gap-x-6">
                    <div className="text-md font-semibold text-slate-200">
                        {t('header_greeting', {userName: authState.user?.name || ''})}
                    </div>
                     <div className="hidden sm:block text-right">
                        <div className="text-xl font-bold text-white tracking-wider tabular-nums">
                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
