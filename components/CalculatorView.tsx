import React, { useState } from 'react';
import GlassCard from './common/GlassCard';
import { useLanguage } from '../contexts/LanguageContext';

declare const math: any;

const CalculatorView: React.FC = () => {
    const { t } = useLanguage();
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const handleButtonClick = (value: string) => {
        if (value === 'C') {
            setInput('');
            setResult('');
        } else if (value === 'DEL') {
            setInput(prev => prev.slice(0, -1));
        } else if (value === '=') {
            try {
                if (input.trim() === '') {
                    setResult('');
                    return;
                }
                const evalResult = math.evaluate(input);
                setResult(String(evalResult));
            } catch (error) {
                setResult('Error');
            }
        } else {
            setInput(prev => prev + value);
        }
    };
    
    const buttons: {display: string, value: string, className?: string}[] = [
        { display: '(', value: '(', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        { display: ')', value: ')', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        { display: '%', value: '%', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        { display: 'C', value: 'C', className: 'bg-red-800/80 hover:bg-red-700 text-red-300' },
        
        { display: '7', value: '7' }, { display: '8', value: '8' }, { display: '9', value: '9' },
        { display: '÷', value: '/', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        
        { display: '4', value: '4' }, { display: '5', value: '5' }, { display: '6', value: '6' },
        { display: '×', value: '*', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        
        { display: '1', value: '1' }, { display: '2', value: '2' }, { display: '3', value: '3' },
        { display: '-', value: '-', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        
        { display: '0', value: '0' }, { display: '.', value: '.' },
        { display: '=', value: '=', className: 'bg-sky-600 hover:bg-sky-500 text-white' },
        { display: '+', value: '+', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        
        { display: 'sin', value: 'sin(', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300 text-base' },
        { display: 'cos', value: 'cos(', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300 text-base' },
        { display: 'tan', value: 'tan(', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300 text-base' },
        { display: '√', value: 'sqrt(', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },

        { display: 'log', value: 'log(', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300 text-base' },
        { display: '^', value: '^', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        { display: 'π', value: 'pi', className: 'bg-slate-700/80 hover:bg-slate-700 text-sky-300' },
        { display: 'DEL', value: 'DEL', className: 'bg-slate-700/80 hover:bg-slate-700 text-red-400' },
    ];
    
    const displayInput = input
        .replace(/\*/g, '×')
        .replace(/\//g, '÷');

    return (
        <div className="w-full max-w-sm mx-auto p-4 sm:p-6 lg:p-8 content-enter">
            <div className="mb-6 text-center">
                <h1 className="text-4xl font-bold text-white">{t('calculator_title')}</h1>
                <p className="text-slate-400 mt-1">{t('calculator_subtitle')}</p>
            </div>
            <GlassCard className="!p-4">
                {/* Display */}
                <div className="bg-slate-900/70 rounded-lg p-4 mb-4 text-right">
                    <div className="h-8 text-slate-400 text-xl truncate">{displayInput || '0'}</div>
                    <div className="h-12 text-white font-bold text-4xl truncate">{result}</div>
                </div>

                {/* Buttons Grid */}
                <div className="grid grid-cols-4 gap-2">
                    {buttons.map(btn => (
                        <button
                            key={btn.display}
                            onClick={() => handleButtonClick(btn.value)}
                            className={`p-4 rounded-lg text-xl font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500
                                ${btn.className || 'bg-slate-800/80 hover:bg-slate-800 text-white'}
                            `}
                        >
                            {btn.display}
                        </button>
                    ))}
                </div>
            </GlassCard>
        </div>
    );
};

export default CalculatorView;