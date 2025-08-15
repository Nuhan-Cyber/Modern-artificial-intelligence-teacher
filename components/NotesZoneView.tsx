import React, { useState, useCallback } from 'react';
import { ActiveModule, Notes } from '../types';
import FuturisticButton from './common/FuturisticButton';
import GlassCard from './common/GlassCard';
import { useLanguage } from '../contexts/LanguageContext';
import { useLearningContext } from '../contexts/LearningContext';
import { generateNotes, optimizeUserNotes } from '../services/geminiService';
import { CalendarIcon } from './common/icons/CalendarIcon';
import { UserIcon } from './common/icons/UserIcon';
import { LocationIcon } from './common/icons/LocationIcon';
import { SpeakerIcon } from './common/icons/SpeakerIcon';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { SparklesIcon } from './common/icons/SparklesIcon';
import ProcessingView from './ProcessingView';
import { exportNotesToDocx } from '../lib/docx-exporter';
import { useAuth } from '../contexts/AuthContext';

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


const NotesDisplay: React.FC<{notes: Notes}> = ({ notes }) => {
    const { t } = useLanguage();

    const DetailSection: React.FC<{title: string; children: React.ReactNode; defaultOpen?: boolean; textForSpeech?: string;}> = ({title, children, defaultOpen = false, textForSpeech}) => {
        const { speak, cancel, isSpeaking } = useTextToSpeech();
        const handleSpeechRequest = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if(isSpeaking) cancel();
            else if (textForSpeech) speak(`${title}. ${textForSpeech}`);
        };

        return (
            <details className="glass-card-bg rounded-lg group" open={defaultOpen}>
                <summary className="p-4 font-semibold text-xl text-white cursor-pointer list-none flex justify-between items-center group-hover:bg-slate-900/60 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        {title}
                        {textForSpeech && (
                             <button onClick={handleSpeechRequest} className={`p-1 rounded-full transition-colors duration-200 ${isSpeaking ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`} aria-label={isSpeaking ? t('tts_stop_reading') : t('tts_read_aloud')}>
                                <SpeakerIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="p-4 border-t border-slate-700/50">{children}</div>
            </details>
        );
    };
  
  return (
      <main className="space-y-6">
        <DetailSection title={t('notes_summary')} defaultOpen textForSpeech={notes.summary}>
          <p className="text-slate-300 leading-relaxed text-lg">{notes.summary}</p>
        </DetailSection>
        
        {notes.memorizationKeys?.length > 0 && (
            <DetailSection title={t('notes_memorization_keys')} defaultOpen textForSpeech={notes.memorizationKeys.map(k => `${k.key}: ${k.value}`).join('. ')}>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {notes.memorizationKeys.map((item, index) => (
                        <div key={index} className="bg-gradient-to-br from-sky-800/50 to-slate-800/50 p-4 rounded-xl border border-sky-700/50 shadow-lg">
                            <p className="font-bold text-sky-300 text-lg">{item.key}</p>
                            <p className="text-slate-200 mt-1">{item.value}</p>
                             <p className="text-xs font-semibold text-sky-500 mt-3 uppercase">{item.type}</p>
                        </div>
                    ))}
                 </div>
            </DetailSection>
        )}

        {notes.keyConcepts?.length > 0 && (
          <DetailSection title={t('notes_key_concepts')} textForSpeech={notes.keyConcepts.map(c => `${c.concept}. ${c.points.join('. ')}`).join('\n')}>
            <div className="space-y-5">{notes.keyConcepts.map((concept, index) => (
              <div key={index} className="bg-slate-900/60 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-sky-300 mb-2">{concept.concept}</h3>
                <ul className="list-disc list-inside space-y-2 pl-4">{concept.points.map((point, pIndex) => (
                  <li key={pIndex} className="text-slate-300 leading-relaxed">{point}</li>
                ))}</ul>
              </div>
            ))}</div>
          </DetailSection>
        )}
        {notes.keyPeople?.length > 0 && (
            <DetailSection title={t('notes_key_people')} textForSpeech={notes.keyPeople.map(p => `${p.name}, ${p.significance}`).join('. ')}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{notes.keyPeople.map((person, index) => (
                    <div key={index} className="bg-slate-900/60 p-4 rounded-lg flex items-start gap-3">
                        <UserIcon className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                        <div><p><strong className="text-yellow-300 text-lg">{person.name}</strong></p><p className="text-slate-300 mt-1">{person.significance}</p></div>
                    </div>
                ))}</div>
            </DetailSection>
        )}
        {notes.keyDates?.length > 0 && (
            <DetailSection title={t('notes_key_dates')} textForSpeech={notes.keyDates.map(d => `${d.date}: ${d.event}`).join('. ')}>
                <div className="space-y-3">{notes.keyDates.map((date, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-slate-900/60 rounded-lg">
                         <CalendarIcon className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                         <div><p className="font-bold text-green-300">{date.date}</p><p className="text-slate-300">{date.event}</p></div>
                    </div>
                ))}</div>
            </DetailSection>
        )}
        {notes.definitions?.length > 0 && (
            <DetailSection title={t('notes_key_definitions')} textForSpeech={notes.definitions.map(d => `${d.term}: ${d.definition}`).join('. ')}>
              <div className="space-y-3">{notes.definitions.map((def, index) => (
                  <div key={index} className="bg-slate-900/60 p-3 rounded-md"><p><strong className="text-fuchsia-400">{def.term}:</strong> <span className="text-slate-300">{def.definition}</span></p></div>
              ))}</div>
            </DetailSection>
        )}
      </main>
  );
};

const MyNotesEditor: React.FC = () => {
    const { t, language } = useLanguage();
    const { authState } = useAuth();
    const [rawNotes, setRawNotes] = useState('');
    const [optimizedNotes, setOptimizedNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const handleOptimize = async () => {
        if (!rawNotes.trim()) return;
        setIsLoading(true);
        setError(null);
        setOptimizedNotes('');
        try {
            const result = await optimizeUserNotes(rawNotes, language, authState.user);
            setOptimizedNotes(result);
        } catch (e) {
            setError(t('error.optimizationError'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const parseMarkdown = (text: string) => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="italic text-sky-300">$1</em>')
          .replace(/(\n\s*(\*|\-|\+)\s.*)+/g, (match) => `<ul class="list-disc list-inside my-2 pl-4">${match.trim().split('\n').map(item => `<li>${item.trim().substring(2)}</li>`).join('')}</ul>`)
          .replace(/\n/g, '<br />');
    };

    return (
        <GlassCard>
            <h3 className="text-2xl font-bold text-white">{t('notes_zone_mynotes_title')}</h3>
            <p className="text-slate-400 mb-4">{t('notes_zone_mynotes_desc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <textarea
                        value={rawNotes}
                        onChange={(e) => setRawNotes(e.target.value)}
                        placeholder={t('notes_zone_mynotes_placeholder')}
                        className="w-full h-64 p-3 bg-slate-900/60 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none transition-shadow resize-none"
                    />
                    <FuturisticButton onClick={handleOptimize} disabled={isLoading || !rawNotes.trim()} className="mt-4 w-full">
                        {isLoading ? t('notes_zone_mynotes_optimizing') : (
                            <span className="flex items-center justify-center gap-2">
                                <SparklesIcon className="w-5 h-5"/> {t('notes_zone_mynotes_optimize_button')}
                            </span>
                        )}
                    </FuturisticButton>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-4 h-80 overflow-y-auto custom-scrollbar">
                    <h4 className="text-xl font-bold text-sky-300 mb-2">{t('notes_zone_optimized_title')}</h4>
                    {error && <p className="text-red-400">{error}</p>}
                    {isLoading && <p className="text-slate-400 animate-pulse">{t('notes_zone_mynotes_optimizing')}</p>}
                    {optimizedNotes && <div className="prose prose-invert text-slate-300" dangerouslySetInnerHTML={{ __html: parseMarkdown(optimizedNotes) }}></div>}
                </div>
            </div>
        </GlassCard>
    )
}

const NotesZoneView: React.FC<{onSetActiveModule: (module: ActiveModule) => void;}> = ({ onSetActiveModule }) => {
    const { t, language } = useLanguage();
    const { learningContext, notes, setNotes, sessionTitle } = useLearningContext();
    const { authState } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const handleGenerateNotes = async () => {
        if (!learningContext) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateNotes(learningContext, language, authState.user);
            setNotes(result);
        } catch(e) {
            setError(t('error.notesGeneration'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleExport = () => {
        if (!notes || !sessionTitle) return;
        try {
            exportNotesToDocx(notes, sessionTitle, t);
        } catch (error) {
            console.error("Failed to export notes:", error);
            alert("Could not export notes.");
        }
    }

    if (!learningContext) {
        return (
          <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              <NoContextState onSetActiveModule={onSetActiveModule} />
          </div>
        );
    }
    
    if (isLoading) {
        return (
             <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
                <ProcessingView 
                    title={t('notes_zone_generating')}
                    subtitle={t('processing_subtitle')}
                    statusMessages={t('processing_status_notes')}
                />
            </div>
        )
    }
    
    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white">{t('notes_zone_title')}</h1>
                    <p className="text-slate-400 mt-1">{t('dashboard_session_hub', { title: sessionTitle })}</p>
                </div>
                {notes && (
                    <FuturisticButton onClick={handleExport} variant="secondary">
                        <span className="flex items-center gap-2">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                           {t('notes_export_docx')}
                        </span>
                    </FuturisticButton>
                )}
            </div>
            
            {!notes && (
                 <GlassCard className="text-center">
                    <FuturisticButton onClick={handleGenerateNotes} disabled={isLoading}>
                        {isLoading ? t('notes_zone_generating') : t('notes_zone_generate_button')}
                    </FuturisticButton>
                    {error && <p className="text-red-400 mt-4">{error}</p>}
                </GlassCard>
            )}

            {notes && (
                <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                    <NotesDisplay notes={notes} />
                    <MyNotesEditor />
                </div>
            )}
             <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }`}</style>
        </div>
    );
}

export default NotesZoneView;
