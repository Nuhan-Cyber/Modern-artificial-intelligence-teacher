import React, { useState } from 'react';
import { ActiveModule } from '../types';
import Header from './Header';
import Sidebar from './Sidebar';
import DashboardView from './DashboardView';
import QuizZoneView from './QuizZoneView';
import NotesZoneView from './NotesZoneView';
import FlashcardsZoneView from './FlashcardsZoneView';
import TutorZoneView from './TutorZoneView';
import RoutineMakerView from './RoutineMakerView';
import CalculatorView from './CalculatorView';
import GlassCard from './common/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import ShortQuestionZoneView from './ShortQuestionZoneView';
import CreativeQuestionZoneView from './CreativeQuestionZoneView';

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const { logout } = useAuth();

  const handleToggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleSelectModule = (module: ActiveModule) => {
    setActiveModule(module);
    if (window.innerWidth < 1024) { // Close sidebar on selection on mobile
      setSidebarOpen(false);
    }
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView onSelectModule={handleSelectModule} />;
      case 'quiz_zone':
        return <QuizZoneView onSetActiveModule={handleSelectModule} />;
      case 'notes_zone':
        return <NotesZoneView onSetActiveModule={handleSelectModule} />;
      case 'flashcards_zone':
        return <FlashcardsZoneView onSetActiveModule={handleSelectModule} />;
      case 'short_question_zone':
        return <ShortQuestionZoneView onSetActiveModule={handleSelectModule} />;
      case 'creative_question_zone':
        return <CreativeQuestionZoneView onSetActiveModule={handleSelectModule} />;
      case 'tutor_zone':
        return <TutorZoneView onSetActiveModule={handleSelectModule} />;
      case 'routine_maker':
        return <RoutineMakerView />;
      case 'advanced_calculator':
        return <CalculatorView />;
      default:
        return (
          <div className="p-8 text-center content-enter">
            <GlassCard>
                <h2 className="text-3xl font-bold text-white mb-4">Coming Soon!</h2>
                <p className="text-slate-400">The '{activeModule}' module is under construction.</p>
            </GlassCard>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onSelectModule={handleSelectModule}
        activeModule={activeModule}
        onLogout={logout}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950/0">
            {renderActiveModule()}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;