import React, { useState, useEffect } from 'react';
import GlassCard from './common/GlassCard';
import FuturisticButton from './common/FuturisticButton';
import { useLanguage } from '../contexts/LanguageContext';
import { ScheduledTask, ToDoItem } from '../types';
import { generateRoutine } from '../services/geminiService';
import ProcessingView from './ProcessingView';
import { useAuth } from '../contexts/AuthContext';

const Timer: React.FC = () => {
    const { t } = useLanguage();
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime(t => t - 1);
            }, 1000);
        } else if (!isActive && time !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, time]);

    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return (
        <GlassCard className="text-center p-4">
            <h4 className="font-bold text-sky-300 mb-2">{t('routine_timer_title')}</h4>
            <div className="text-5xl font-bold text-white mb-4">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="flex justify-center gap-2">
                <FuturisticButton onClick={() => setIsActive(!isActive)} variant="secondary" className="!px-4 !py-2 !text-sm">{isActive ? t('routine_timer_pause') : t('routine_timer_start')}</FuturisticButton>
                <FuturisticButton onClick={() => { setTime(25 * 60); setIsActive(false); }} variant="secondary" className="!px-4 !py-2 !text-sm">{t('routine_timer_reset')}</FuturisticButton>
            </div>
        </GlassCard>
    );
};

const ToDoList: React.FC = () => {
    const { t } = useLanguage();
    const [todos, setTodos] = useState<ToDoItem[]>([]);
    const [newTodo, setNewTodo] = useState('');

    const addTodo = () => {
        if (newTodo.trim() === '') return;
        setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
        setNewTodo('');
    };

    const toggleTodo = (id: number) => {
        setTodos(todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo));
    };
    
    return (
        <GlassCard className="p-4 h-full">
            <h4 className="font-bold text-sky-300 mb-2">{t('routine_todo_title')}</h4>
            <div className="flex gap-2 mb-3">
                <input 
                    type="text" 
                    value={newTodo} 
                    onChange={e => setNewTodo(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addTodo()}
                    placeholder={t('routine_todo_placeholder')} 
                    className="flex-1 p-2 bg-slate-800/80 rounded-md text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <FuturisticButton onClick={addTodo} className="!px-4 !py-2 !text-sm">{t('routine_todo_add')}</FuturisticButton>
            </div>
            <ul className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar pr-2">
                {todos.map(todo => (
                    <li key={todo.id} onClick={() => toggleTodo(todo.id)} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${todo.completed ? 'bg-green-500/20 text-slate-400' : 'bg-slate-800/50'}`}>
                        <span className={`w-4 h-4 rounded-full border-2 ${todo.completed ? 'bg-green-500 border-green-400' : 'border-slate-400'}`}></span>
                        <span className={`${todo.completed ? 'line-through' : ''}`}>{todo.text}</span>
                    </li>
                ))}
            </ul>
        </GlassCard>
    );
}

const RoutineMakerView: React.FC = () => {
    const { t, language } = useLanguage();
    const { authState } = useAuth();
    const [commitments, setCommitments] = useState('');
    const [subjects, setSubjects] = useState('');
    const [routine, setRoutine] = useState<ScheduledTask[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const handleGenerate = async () => {
        if (!commitments || !subjects) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateRoutine(commitments, subjects, language, authState.user);
            setRoutine(result);
        } catch (e) {
            setError(t('error.routineGeneration'));
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    const renderContent = () => {
        if (isLoading) {
            return <ProcessingView title={t('routine_maker_generating')} subtitle={t('processing_subtitle')} statusMessages={t('processing_status_routine')} />;
        }

        if (routine) {
            return (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-white">{t('routine_maker_generated_title')}</h2>
                        <FuturisticButton onClick={() => {setRoutine(null); setCommitments(''); setSubjects('');}} variant="secondary">{t('routine_maker_new_button')}</FuturisticButton>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-6">
                         {/* Timeline */}
                        <div className="lg:col-span-2 space-y-4 max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar">
                            {routine.map((task, index) => (
                                <div key={index} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="font-bold text-sky-300">{task.time}</div>
                                        <div className="w-px h-6 bg-slate-600"></div>
                                    </div>
                                    <div className="relative w-full pb-6">
                                        <div className="absolute left-[-22px] top-[5px] w-4 h-4 bg-slate-700 rounded-full border-2 border-sky-500"></div>
                                        <div className="p-4 bg-slate-800/80 rounded-lg">
                                            <h3 className="font-bold text-white">{task.subject} <span className="text-xs font-normal text-slate-400">({task.duration} min)</span></h3>
                                            <p className="text-slate-300">{task.task}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                         {/* Tools */}
                        <div className="space-y-4">
                            <Timer />
                            <ToDoList />
                        </div>
                    </div>
                </div>
            )
        }

        return (
             <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                    <label className="block mb-2 font-semibold text-slate-200">{t('routine_maker_q1')}</label>
                    <textarea value={commitments} onChange={e => setCommitments(e.target.value)} placeholder={t('routine_maker_q1_placeholder')} className="w-full p-2 bg-slate-900/60 rounded-lg h-24 resize-none focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                 <div className="mb-6">
                    <label className="block mb-2 font-semibold text-slate-200">{t('routine_maker_q2')}</label>
                    <input type="text" value={subjects} onChange={e => setSubjects(e.target.value)} placeholder={t('routine_maker_q2_placeholder')} className="w-full p-2 bg-slate-900/60 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none" />
                </div>
                <div className="text-center">
                     <FuturisticButton onClick={handleGenerate} disabled={isLoading || !commitments || !subjects}>
                        {isLoading ? t('routine_maker_generating') : t('routine_maker_generate_button')}
                    </FuturisticButton>
                </div>
                {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
            </div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 content-enter">
            <div className="mb-6 text-center">
                <h1 className="text-4xl font-bold text-white">{t('routine_maker_title')}</h1>
                <p className="text-slate-400 mt-1 max-w-2xl mx-auto">{t('routine_maker_desc')}</p>
            </div>
            
            <GlassCard>
                {renderContent()}
            </GlassCard>
             <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }`}</style>
        </div>
    );
};

export default RoutineMakerView;
