import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { ChatMessage, ActiveModule, ChartData, ChatMessagePart, TutorDefinition, TutorVocabulary, TutorFormula, TutorModel } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useLearningContext } from '../contexts/LearningContext';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import { generateImageForTutor } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import FullScreenViewer from './common/FullScreenViewer';
import { ImageIcon } from './common/icons/ImageIcon';
import { PaperclipIcon } from './common/icons/PaperclipIcon';

const FormattedMessageContent: React.FC<{ content: string; parseMarkdown: (text: string) => string; }> = React.memo(({ content, parseMarkdown }) => {
    const parsedHtml = useMemo(() => parseMarkdown(content), [content, parseMarkdown]);
    return <div dangerouslySetInnerHTML={{ __html: parsedHtml }} />;
});

const StreamingText: React.FC<{ text: string; parseMarkdown: (text: string) => string; }> = React.memo(({ text, parseMarkdown }) => {
    return <FormattedMessageContent content={text} parseMarkdown={parseMarkdown} />;
});

const StructuredInfoCards = ({ definitions, vocabulary, formulas }: {
    definitions?: TutorDefinition[];
    vocabulary?: TutorVocabulary[];
    formulas?: TutorFormula[];
}): JSX.Element => {
    const { t } = useLanguage();
    
    return (
        <div className="mt-3 space-y-3 max-w-full">
            {definitions && definitions.length > 0 && (
                <GlassCard className="!p-4 !bg-slate-900/50 border border-sky-800/80">
                    <h4 className="font-bold text-sky-300 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        {t('notes_key_definitions')}
                    </h4>
                    <ul className="space-y-2 pl-2">
                        {definitions.map((def, i) => (
                            <li key={i}>
                                <strong className="text-white font-semibold">{def.term}:</strong>
                                <span className="text-slate-300 ml-2">{def.definition}</span>
                            </li>
                        ))}
                    </ul>
                </GlassCard>
            )}
            {vocabulary && vocabulary.length > 0 && (
                 <GlassCard className="!p-4 !bg-slate-900/50 border border-amber-800/80">
                    <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Vocabulary
                    </h4>
                     <ul className="space-y-2 pl-2">
                        {vocabulary.map((voc, i) => (
                            <li key={i}>
                                <strong className="text-white font-semibold">{voc.word}:</strong>
                                <span className="text-slate-300 ml-2">{voc.meaning}</span>
                            </li>
                        ))}
                    </ul>
                </GlassCard>
            )}
            {formulas && formulas.length > 0 && (
                 <GlassCard className="!p-4 !bg-slate-900/50 border border-green-800/80">
                    <h4 className="font-bold text-green-300 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                        Formulas
                    </h4>
                     <ul className="space-y-3 pl-2">
                        {formulas.map((form, i) => (
                            <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <strong className="text-white font-semibold flex-shrink-0">{form.name}:</strong>
                                <code className="text-green-300 bg-slate-950 p-2 rounded-md font-mono text-sm w-full overflow-x-auto">{form.formula}</code>
                            </li>
                        ))}
                    </ul>
                </GlassCard>
            )}
        </div>
    )
};


interface TutorZoneViewProps {
  onSetActiveModule: (module: ActiveModule) => void;
}

const NoContextState = ({onSetActiveModule}: {onSetActiveModule: (module: ActiveModule) => void;}): JSX.Element => {
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

const DynamicChart = ({ chartData }: { chartData: ChartData }): JSX.Element => {
    const {t} = useLanguage();
    const COLORS = ['#0ea5e9', '#34d399', '#f97316', '#a855f7', '#ec4899'];
    
    switch(chartData.type) {
        case 'pie':
            return (
                <div className="w-full h-72 bg-slate-900/50 p-4 rounded-lg my-2">
                    <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={chartData.data} dataKey={chartData.dataKey} nameKey={chartData.nameKey} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                {chartData.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        case 'bar':
            return (
                <div className="w-full h-72 bg-slate-900/50 p-4 rounded-lg my-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.data}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey={chartData.nameKey} stroke="#94a3b8"/>
                            <YAxis stroke="#94a3b8"/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: 'none', borderRadius: '0.5rem' }}/>
                            <Legend />
                             {chartData.additionalKeys ? chartData.additionalKeys.map((item, index) => (
                                <Bar key={item.key} dataKey={item.key} fill={item.color || COLORS[index % COLORS.length]} isAnimationActive={true} />
                            )) : (
                                <Bar dataKey={chartData.dataKey} fill={COLORS[0]} isAnimationActive={true}/>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )
        default:
             return <p className="text-red-400">{t('tutor_unsupported_chart')} {chartData.type}</p>;
    }
}

const parseStructuredTags = (text: string) => {
    const definitions: TutorDefinition[] = [];
    const vocabulary: TutorVocabulary[] = [];
    const formulas: TutorFormula[] = [];
    let processedText = text;

    const defRegex = /<def term="([^"]+)">([\s\S]*?)<\/def>/g;
    processedText = processedText.replace(defRegex, (match, term, definition) => {
        definitions.push({ term: term.trim(), definition: definition.trim() });
        return definition.trim();
    });
    
    const vocabRegex = /<vocab word="([^"]+)">([\s\S]*?)<\/vocab>/g;
    processedText = processedText.replace(vocabRegex, (match, word, meaning) => {
        vocabulary.push({ word: word.trim(), meaning: meaning.trim() });
        return meaning.trim();
    });
    
    const formulaRegex = /<formula name="([^"]+)">([\s\S]*?)<\/formula>/g;
    processedText = processedText.replace(formulaRegex, (match, name, formula) => {
        formulas.push({ name: name.trim(), formula: formula.trim() });
        return formula.trim();
    });

    return {
        mainText: processedText.trim(),
        definitions,
        vocabulary,
        formulas,
    };
};


const TutorZoneView = ({onSetActiveModule}: TutorZoneViewProps): JSX.Element => {
  const [userInput, setUserInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { tutorState, setTutorState, initialTutorMessage, setInitialTutorMessage, sessionTitle, resetTutorChat, tutorModel, setTutorModel } = useLearningContext();
  const { authState } = useAuth();
  const [streamingText, setStreamingText] = useState('');
  const [fullScreenContent, setFullScreenContent] = useState<React.ReactNode | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const openFullScreen = (content: React.ReactNode) => {
    setFullScreenContent(content);
  };

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [tutorState.history, tutorState.isLoading, streamingText]);
  
  const parseMarkdown = useCallback((text: string) => {
    const calloutIcons = {
        info: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>',
        success: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.22 3.001-1.742 3.001H4.42c-1.522 0-2.492-1.667-1.742-3.001l5.58-9.92zM10 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>',
        tip: '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 5.05a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414-1.414l-.707-.707zM4 10a1 1 0 01-1 1H2a1 1 0 110-2h1a1 1 0 011 1zM10 18a1 1 0 011-1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM13.95 14.95a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707z" /><path d="M9 14a4 4 0 014-4h-1a3 3 0 00-3-3V5a3 3 0 00-3 3H5a4 4 0 014 4v1H8v2h4v-2h-1v-1z" /></svg>'
    };

    let html = text
      .replace(/```([\s\S]*?)```/g, (match, code) => `<pre class="bg-slate-950/70 p-4 rounded-md my-2 text-sm text-white overflow-x-auto border border-slate-700"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
      .replace(/^>\s*\[(info|success|warning|tip)\]\s*([\s\S]*?)(?=\n>\[|\n\n|$)/gm, (match, type, content) => {
          const config = {
              info: { color: 'sky' },
              success: { color: 'green' },
              warning: { color: 'amber' },
              tip: { color: 'violet' }
          }[type];
          return `<div class="my-3 p-4 rounded-lg border-l-4 bg-${config.color}-500/10 border-${config.color}-400 text-${config.color}-200 flex items-start gap-3">
                    <div class="flex-shrink-0 w-5 h-5 mt-0.5 text-${config.color}-400">${calloutIcons[type]}</div>
                    <div>${content.trim().replace(/\n/g, '<br/>')}</div>
                  </div>`;
      })
      .replace(/^#\s+(.*)/gm, '<h1 class="font-bold text-white mt-4 mb-2 text-3xl">$1</h1>')
      .replace(/^##\s+(.*)/gm, '<h2 class="font-bold text-white mt-4 mb-2 text-2xl">$1</h2>')
      .replace(/^###\s+(.*)/gm, '<h3 class="font-bold text-white mt-4 mb-2 text-xl">$1</h3>')
      .replace(/!!\[(.*?)\](.*?)!!/g, '<span class="font-bold text-$1">$2</span>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-sky-300">$1</em>')
      .replace(/\|(.+)\|\n\|( *[-:]+[-| :]*)\|\n((?:\|.*\|(?:\n|$))*)/g, (match, header, separator, body) => {
        const headerCells = header.split('|').slice(1, -1).map(h => `<th class="p-2 text-left text-sky-300">${h.trim()}</th>`).join('');
        const bodyRows = body.trim().split('\n').map(row => {
            const cells = row.split('|').slice(1, -1).map(c => `<td class="p-2">${c.trim()}</td>`).join('');
            return `<tr class="border-b border-slate-700/50 last:border-b-0">${cells}</tr>`;
        }).join('');
        return `<div class="w-full overflow-x-auto my-4"><table class="w-full text-left bg-slate-900/50 rounded-lg"><thead class="border-b border-slate-600">${headerCells}</thead><tbody>${bodyRows}</tbody></table></div>`;
      })
      .replace(/^---\s*$/gm, '<hr class="my-4 border-slate-700">')
      .replace(/^\s*([*-])\s(.*)/gm, (match, bullet, content) => `_UL_${content.trim()}`)
      .replace(/(_UL_.*)+/g, (match) => `<ul class="list-disc list-inside my-2 pl-4">${match.split('_UL_').filter(Boolean).map(item => `<li>${item}</li>`).join('')}</ul>`)
      .replace(/^\s*(\d+)\.\s(.*)/gm, (match, number, content) => `_OL_${content.trim()}`)
      .replace(/(_OL_.*)+/g, (match) => `<ol class="list-decimal list-inside my-2 pl-4">${match.split('_OL_').filter(Boolean).map(item => `<li>${item}</li>`).join('')}</ol>`)
      .replace(/\n/g, '<br />')
      .replace(/<br \/>(\s*<(?:ul|ol|li|h[1-6]|hr|table|pre|div))/g, '$1')
      .replace(/(<\/(?:ul|ol|h[1-6]|hr|table|pre|div)>)\s*<br \/>/g, '$1');

    return html;
  }, []);

  const parseAndAddMessageParts = (text: string): ChatMessagePart[] => {
    const parts: ChatMessagePart[] = [];
    const regex = /```(html|json-chart)\n([\s\S]*?)```|\[GENERATE_IMAGE:\s*"([^"]+)"\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.substring(lastIndex, match.index) });
        }
        
        if (match[1] === 'html') {
            parts.push({ flowchartHtml: match[2].trim() });
        } else if (match[1] === 'json-chart') {
            try {
                const chartData = JSON.parse(match[2].trim());
                parts.push({ chartData });
            } catch (e) {
                console.error("Invalid JSON for chart:", e);
                parts.push({ text: `\n(Error rendering chart: Invalid JSON)\n` });
            }
        } else if (match[3]) {
            parts.push({ text: `[IMAGE_PLACEHOLDER: "${match[3]}"]`});
        }

        lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex) });
    }

    return parts.length > 0 ? parts : [{text: text}];
  };


  const sendMessage = useCallback(async (message: string, file: File | null) => {
    if ((!message.trim() && !file) || !tutorState.chat || tutorState.isLoading) return;
    
    setTutorState(prev => ({...prev, isLoading: true }));
    setStreamingText('');

    // Construct user message for history
    const userMessageParts: ChatMessagePart[] = [];
    if (message.trim()) {
        userMessageParts.push({ text: message });
    }
    if (filePreview) {
        userMessageParts.push({ imageData: filePreview });
    }
    const userMessage: ChatMessage = { role: 'user', parts: userMessageParts };
    setTutorState(prev => ({...prev, history: [...prev.history, userMessage]}));


    // Prepare parts for API call
    const apiParts: any[] = [];
    if(message.trim()) {
        apiParts.push({ text: message });
    }
    if (file) {
        const base64EncodedData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
        apiParts.push({
            inlineData: {
                data: base64EncodedData,
                mimeType: file.type,
            },
        });
    }

    try {
        const stream = await tutorState.chat.sendMessageStream({ message: apiParts });
        let accumulatedText = "";
        let finalSources: any[] = [];
        
        for await (const chunk of stream) {
            accumulatedText += chunk.text;
            setStreamingText(accumulatedText);
            
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                finalSources = chunk.candidates[0].groundingMetadata.groundingChunks.map((c: any) => c.web);
            }
        }

        const { mainText, definitions, vocabulary, formulas } = parseStructuredTags(accumulatedText);
        const finalParts = parseAndAddMessageParts(mainText);
        
        const modelMessage: ChatMessage = { 
            role: 'model', 
            parts: finalParts, 
            sources: finalSources,
            definitions,
            vocabulary,
            formulas
        };
        
        setTutorState(prev => {
            const newHistory = [...prev.history, modelMessage];
            processImagePlaceholders(newHistory); // Fire and forget image processing
            return { ...prev, history: newHistory, isLoading: false };
        });

    } catch(error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = { role: 'model', parts: [{ text: t('tutor_error') }] };
        setTutorState(prev => ({...prev, history: [...prev.history, errorMessage], isLoading: false }));
    } finally {
        setStreamingText('');
    }
  }, [tutorState.chat, tutorState.isLoading, setTutorState, t, parseMarkdown, filePreview]);

  const processImagePlaceholders = useCallback(async (history: ChatMessage[]) => {
      const updatedHistory = JSON.parse(JSON.stringify(history));
      let historyWasUpdated = false;

      for (let i = 0; i < updatedHistory.length; i++) {
          const msg = updatedHistory[i];
          if (msg.role === 'model') {
              for (let j = 0; j < msg.parts.length; j++) {
                  const part = msg.parts[j];
                  const match = part.text?.match(/\[IMAGE_PLACEHOLDER: "([^"]+)"\]/);
                  if (match) {
                      const prompt = match[1];
                      try {
                          const base64Image = await generateImageForTutor(prompt);
                          msg.parts[j] = { imageData: `data:image/jpeg;base64,${base64Image}` };
                          historyWasUpdated = true;
                      } catch (e) {
                          console.error("Image generation failed:", e);
                          msg.parts[j] = { text: "(Image generation failed)" };
                          historyWasUpdated = true;
                      }
                  }
              }
          }
      }

      if (historyWasUpdated) {
          setTutorState(prev => ({ ...prev, history: updatedHistory }));
      }
  }, [setTutorState]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(userInput, attachedFile);
    setUserInput('');
    setAttachedFile(null);
    setFilePreview(null);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setAttachedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };
  
  const removeAttachment = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  useEffect(() => {
    if (initialTutorMessage) {
        sendMessage(initialTutorMessage, null);
        setInitialTutorMessage(null);
    }
  }, [initialTutorMessage, sendMessage, setInitialTutorMessage]);
  
  const FullScreenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5 5" />
    </svg>
  );

  const renderMessagePart = (part: ChatMessagePart, msgIndex: number, partIndex: number, role: 'user' | 'model') => {
    const key = `${msgIndex}-${partIndex}`;

    if (part.text) {
        return <FormattedMessageContent key={key} content={part.text} parseMarkdown={parseMarkdown} />;
    }
    if (part.imageData) {
        const imageClasses = role === 'user' 
            ? "rounded-lg max-w-xs h-auto mt-2"
            : "rounded-lg max-w-full h-auto my-2";
        return (
            <div key={key} className="relative group cursor-pointer" onClick={() => openFullScreen(<img src={part.imageData} alt="Generated by AI" className="max-w-[80vw] max-h-[80vh] object-contain"/>)}>
                <img src={part.imageData} alt="Uploaded by user" className={imageClasses} />
                 {role === 'model' && 
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                        <FullScreenIcon />
                    </div>
                }
            </div>
        );
    }
    if (part.flowchartHtml) {
        return (
             <div key={key} className="relative group cursor-pointer my-2" onClick={() => openFullScreen(<div className="w-full h-full" dangerouslySetInnerHTML={{ __html: part.flowchartHtml! }} />)}>
                <div className="w-full max-h-[50vh] overflow-auto p-4 bg-slate-900/50 rounded-lg">
                    <div dangerouslySetInnerHTML={{ __html: part.flowchartHtml }} />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <FullScreenIcon />
                </div>
            </div>
        );
    }
    if (part.chartData) {
         return (
             <div key={key} className="relative group cursor-pointer my-2" onClick={() => openFullScreen(<div className="w-[80vw] h-[80vh]"><DynamicChart chartData={part.chartData!} /></div>)}>
                <DynamicChart chartData={part.chartData} />
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                    <FullScreenIcon />
                </div>
            </div>
        );
    }
    return null;
  };

  const tutorModels: {id: TutorModel, name: string}[] = [
      { id: 'default', name: t('tutor_model_default') },
      { id: 'math', name: t('tutor_model_math') },
      { id: 'english', name: t('tutor_model_english') },
      { id: 'science', name: t('tutor_model_science') },
      { id: 'bangla_grammar', name: t('tutor_model_bangla_grammar') },
      { id: 'english_grammar', name: t('tutor_model_english_grammar') },
  ];

  if (!tutorState.chat) {
    // This state now depends on the context being created, which depends on a model.
    // So we reset the chat which creates it with the default model.
    resetTutorChat();
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <NoContextState onSetActiveModule={onSetActiveModule} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-4xl font-bold text-white">{t('tutor_zone_title')}</h1>
            <p className="text-slate-400 mt-1">{sessionTitle ? t('dashboard_session_hub', { title: sessionTitle }) : t('tutor_zone_subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
             <div className="relative">
                <select 
                    value={tutorModel} 
                    onChange={(e) => setTutorModel(e.target.value as TutorModel)}
                    className="appearance-none w-full sm:w-auto bg-slate-800/80 border border-slate-700 text-white font-semibold py-2 pl-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    aria-label={t('tutor_model_select')}
                >
                    {tutorModels.map(model => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
            <FuturisticButton onClick={resetTutorChat} variant="secondary">
                {t('tutor_new_chat')}
            </FuturisticButton>
        </div>
      </div>
      <GlassCard className="h-[70vh] flex flex-col p-4">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          <AnimatePresence>
          {tutorState.history.map((msg, index) => (
            <motion.div 
                key={index} 
                className={`flex items-start gap-3 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }}
            >
               {msg.role === 'model' && <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">AI</span>}
              <div className={`max-w-2xl w-auto`}>
                  <div className={`p-4 rounded-2xl text-slate-200 leading-relaxed ${msg.role === 'user' ? 'bg-sky-600 text-white rounded-br-none' : 'glass-card-bg !bg-slate-800/80 rounded-bl-none'}`}>
                    {msg.parts.map((part, partIndex) => renderMessagePart(part, index, partIndex, msg.role))}
                  </div>
                    {(msg.definitions?.length > 0 || msg.vocabulary?.length > 0 || msg.formulas?.length > 0) && (
                        <div className="w-full">
                            <StructuredInfoCards 
                                definitions={msg.definitions}
                                vocabulary={msg.vocabulary}
                                formulas={msg.formulas}
                            />
                        </div>
                    )}
                  {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 px-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Sources</h4>
                        <div className="space-y-1">
                          {msg.sources.map((source, i) => (
                            <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="block text-xs text-sky-400 hover:underline truncate max-w-xs">
                              {source.title || source.uri}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
              </div>
               {msg.role === 'user' && <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold">{(authState.user?.name || 'U').charAt(0)}</span>}
            </motion.div>
          ))}
          </AnimatePresence>
          {tutorState.isLoading && (
             <motion.div 
                className="flex justify-start items-start gap-3"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }}
              >
                 <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">AI</span>
                 <div className="max-w-2xl p-4 rounded-2xl glass-card-bg !bg-slate-800/80 rounded-bl-none">
                    {streamingText ? (
                        <StreamingText text={streamingText} parseMarkdown={parseMarkdown} />
                    ) : (
                        <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div></div>
                    )}
                </div>
            </motion.div>
          )}
        </div>
        <div className="flex-shrink-0">
            {filePreview && (
                <div className="px-2 pt-2">
                    <div className="relative inline-block bg-slate-800/80 p-1 rounded-lg">
                        <img src={filePreview} alt="File preview" className="h-20 w-auto rounded-md" />
                        <button onClick={removeAttachment} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
                    </div>
                </div>
            )}
            <form onSubmit={handleFormSubmit} className="mt-2 flex gap-2 p-2 bg-slate-900/50 border border-slate-700 rounded-full">
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              <button type="button" onClick={() => fileInputRef.current?.click()} title={t('tutor_attach_file')} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors" disabled={tutorState.isLoading || !!attachedFile}>
                <PaperclipIcon className="w-6 h-6"/>
              </button>
              <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={t('tutor_placeholder')} className="flex-1 px-4 py-2 bg-transparent rounded-lg text-white placeholder-slate-400 focus:outline-none disabled:opacity-50" disabled={tutorState.isLoading || !tutorState.chat} />
              <FuturisticButton type="submit" disabled={tutorState.isLoading || (!userInput.trim() && !attachedFile) || !tutorState.chat} className="!rounded-full !px-5 !py-2 !text-base">{t('tutor_send_button')}</FuturisticButton>
            </form>
        </div>
         <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }`}</style>
      </GlassCard>
      <FullScreenViewer isOpen={!!fullScreenContent} onClose={() => setFullScreenContent(null)}>
        {fullScreenContent}
      </FullScreenViewer>
    </div>
  );
};

export default TutorZoneView;