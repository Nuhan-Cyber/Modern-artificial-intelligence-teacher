import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingViewProps } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ProcessingView = ({ title, subtitle, statusMessages, totalSteps, statusMessageTemplate, duration }: ProcessingViewProps): JSX.Element => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const { t } = useLanguage();
  
  const finalStatusMessageTemplate = statusMessageTemplate || t('processing_status_quiz_template');

  useEffect(() => {
    const totalDuration = duration || (totalSteps || statusMessages.length) * 1500;
    const stepDuration = totalDuration / (totalSteps || statusMessages.length);

    let stepInterval: any;

    if (totalSteps && statusMessageTemplate) {
        // Simulation for counted progress
        let currentStep = 0;
        stepInterval = setInterval(() => {
            currentStep++;
            if (currentStep <= totalSteps) {
                setCurrentMessageIndex(currentStep);
            } else {
                clearInterval(stepInterval);
            }
        }, stepDuration);
    } else {
        // Cycle through predefined messages
        stepInterval = setInterval(() => {
            setCurrentMessageIndex(prev => (prev + 1) % statusMessages.length);
        }, stepDuration);
    }
    
    // Smooth progress bar
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newProgress = Math.min((elapsedTime / totalDuration) * 100, 99);
      setProgress(newProgress);
      if (newProgress >= 99) {
        clearInterval(progressInterval);
      }
    }, 100);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [statusMessages.length, totalSteps, statusMessageTemplate, duration]);
  
  const displayedMessage = totalSteps 
    ? finalStatusMessageTemplate.replace('{current}', String(currentMessageIndex)).replace('{total}', String(totalSteps))
    : statusMessages[currentMessageIndex % statusMessages.length];

  return (
    <div className="w-full max-w-2xl mx-auto text-center p-8 glass-card-bg rounded-2xl">
      <div className="relative w-24 h-24 mx-auto mb-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 border-4 border-sky-500/50 rounded-full"
            style={{
              animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
              animationDelay: `${i * 0.3}s`,
              opacity: 1 - i * 0.3,
            }}
          ></div>
        ))}
        <div className="absolute inset-0 flex items-center justify-center text-sky-300 font-bold text-2xl">
            AI
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } }`}</style>

      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-300 mb-8">{subtitle}</p>
      
      <div className="w-full bg-slate-800/70 rounded-full h-2.5 mb-4 overflow-hidden">
        <div
          className="bg-gradient-to-r from-sky-600 to-cyan-400 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="h-12 flex items-center justify-center">
        <AnimatePresence mode="wait">
            <motion.p
              key={displayedMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
              className="text-lg text-sky-300 font-medium"
            >
              <span className="flex items-center gap-2">
                 <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {displayedMessage}
              </span>
            </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProcessingView;
