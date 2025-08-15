import React from 'react';
import { View } from './types';
import AnimatedBackground from './components/AnimatedBackground';
import DashboardLayout from './components/DashboardLayout';
import { LearningProvider } from './contexts/LearningContext';
import { useAuth } from './contexts/AuthContext';
import AuthView from './components/AuthView';
import VerificationView from './components/VerificationView';
import OnboardingView from './components/OnboardingView';


const AppContent: React.FC = () => {
  const { currentView } = useAuth();

  const renderContent = () => {
    switch (currentView) {
      case View.Auth:
        return <AuthView />;
      case View.VerifyEmail:
        return <VerificationView />;
      case View.Onboarding:
        return <OnboardingView />;
      case View.Dashboard:
        return (
          <LearningProvider>
            <DashboardLayout />
          </LearningProvider>
        );
      default:
        return <AuthView />;
    }
  };
  
  return (
    <>
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen">
          {renderContent()}
      </div>
    </>
  );
}

// The main App component now just sets up providers.
// AppContent handles the view logic based on auth state.
export default function App() {
  return <AppContent />;
}
