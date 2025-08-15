import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const { language } = useLanguage();
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const synth = window.speechSynthesis;
        const loadVoices = () => {
            const availableVoices = synth.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
            }
        };
        // Voices may load asynchronously.
        loadVoices();
        if (synth.onvoiceschanged !== undefined) {
             synth.onvoiceschanged = loadVoices;
        }
        
        return () => {
            if (synth.onvoiceschanged !== undefined) {
                synth.onvoiceschanged = null;
            }
            synth.cancel();
        };
    }, []);

    const speak = useCallback((text: string) => {
        const synth = window.speechSynthesis;
        if (synth.speaking) {
            synth.cancel();
            // Allow speaking the new text right after cancellation if it's different.
             setTimeout(() => {
                 const utterance = new SpeechSynthesisUtterance(text);
                const voiceLang = language === 'bn' ? 'bn-BD' : (language === 'zh' ? 'zh-CN' : 'en-US');
                const langPrefix = language === 'bn' ? 'bn' : (language === 'zh' ? 'zh' : 'en');
                
                // Prioritized voice selection
                const perfectMatch = voices.find(v => v.lang === voiceLang && v.localService);
                const localMatch = voices.find(v => v.lang.startsWith(langPrefix) && v.localService);
                const namedMatch = voices.find(v => v.lang.startsWith(langPrefix) && (v.name.includes('Google') || v.name.includes('Natural')));
                const anyMatch = voices.find(v => v.lang.startsWith(langPrefix));

                utterance.voice = perfectMatch || localMatch || namedMatch || anyMatch || null;
                utterance.lang = utterance.voice ? utterance.voice.lang : voiceLang;
                utterance.rate = 0.9;
                utterance.pitch = 1;

                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = (e) => {
                    console.error('SpeechSynthesis Error', e);
                    setIsSpeaking(false);
                };

                synth.speak(utterance);
            }, 100); // Small delay to ensure cancellation is processed
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voiceLang = language === 'bn' ? 'bn-BD' : (language === 'zh' ? 'zh-CN' : 'en-US');
        const langPrefix = language === 'bn' ? 'bn' : (language === 'zh' ? 'zh' : 'en');
        
        const perfectMatch = voices.find(v => v.lang === voiceLang && v.localService);
        const localMatch = voices.find(v => v.lang.startsWith(langPrefix) && v.localService);
        const namedMatch = voices.find(v => v.lang.startsWith(langPrefix) && (v.name.includes('Google') || v.name.includes('Natural')));
        const anyMatch = voices.find(v => v.lang.startsWith(langPrefix));

        utterance.voice = perfectMatch || localMatch || namedMatch || anyMatch || null;
        utterance.lang = utterance.voice ? utterance.voice.lang : voiceLang;
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error('SpeechSynthesis Error', e);
            setIsSpeaking(false);
        };

        synth.speak(utterance);

    }, [language, voices]);

    const cancel = useCallback(() => {
        const synth = window.speechSynthesis;
        if (synth.speaking) {
            synth.cancel();
        }
        setIsSpeaking(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancel();
        };
    }, [cancel]);

    return { speak, cancel, isSpeaking };
};