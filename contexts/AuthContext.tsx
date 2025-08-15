import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { UserProfile, View } from '../types';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  authState: {
    isAuthenticated: boolean;
    user: UserProfile | null;
  };
  currentView: View;
  login: (email: string, pass: string) => Promise<void>;
  signup: (details: Omit<UserProfile, 'learningStyle' | 'subjects' | 'goals'>) => Promise<void>;
  logout: () => void;
  verifyEmail: (code: string) => void;
  completeOnboarding: (preferences: Pick<UserProfile, 'learningStyle'|'subjects'|'goals'>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<{ isAuthenticated: boolean; user: UserProfile | null }>({ isAuthenticated: false, user: null });
  const [currentView, setCurrentView] = useState<View>(View.Auth);
  const { setLanguage } = useLanguage();

  useEffect(() => {
    // Check for logged-in user in localStorage on initial load
    const storedUser = localStorage.getItem('userProfile');
    const hasCompletedOnboarding = localStorage.getItem('onboardingComplete') === 'true';

    if (storedUser) {
      const user: UserProfile = JSON.parse(storedUser);
      setAuthState({ isAuthenticated: true, user });
      if (hasCompletedOnboarding) {
        setCurrentView(View.Dashboard);
      } else {
        setCurrentView(View.Onboarding);
      }
      // Set language based on user's country
      if (user.country.toLowerCase() === 'china') setLanguage('zh');
      else if (user.country.toLowerCase() === 'bangladesh') setLanguage('bn');
      else setLanguage('en');

    } else {
      setCurrentView(View.Auth);
    }
  }, [setLanguage]);

  const login = async (email: string, pass: string) => {
    // This is a mock login. In a real app, you'd call an API.
    const storedUser = localStorage.getItem('userProfile');
    if (storedUser) {
      const user: UserProfile = JSON.parse(storedUser);
      if (user.email === email) {
        setAuthState({ isAuthenticated: true, user });
        if (localStorage.getItem('onboardingComplete') === 'true') {
            setCurrentView(View.Dashboard);
        } else {
            setCurrentView(View.Onboarding);
        }
        if (user.country.toLowerCase() === 'china') setLanguage('zh');
        else if (user.country.toLowerCase() === 'bangladesh') setLanguage('bn');
        else setLanguage('en');
        return;
      }
    }
    // If login fails, you might want to show an error message
    alert("Login failed: User not found or incorrect password.");
  };

  const signup = async (details: Omit<UserProfile, 'learningStyle' | 'subjects' | 'goals'>) => {
    // This is a mock signup.
    const newUser: UserProfile = {
      ...details,
      learningStyle: null,
      subjects: [],
      goals: '',
    };
    // Store user temporarily while they verify email
    localStorage.setItem('tempUserProfile', JSON.stringify(newUser));
    setCurrentView(View.VerifyEmail);
  };

  const verifyEmail = (code: string) => {
      // Mock verification: any 6-digit code is valid
      if (code.length === 6 && /^\d+$/.test(code)) {
          const tempUser = localStorage.getItem('tempUserProfile');
          if (tempUser) {
              const user: UserProfile = JSON.parse(tempUser);
              setAuthState({ isAuthenticated: true, user });
              localStorage.setItem('userProfile', JSON.stringify(user));
              localStorage.removeItem('tempUserProfile');
              if (user.country.toLowerCase() === 'china') setLanguage('zh');
              else if (user.country.toLowerCase() === 'bangladesh') setLanguage('bn');
              else setLanguage('en');
              setCurrentView(View.Onboarding);
          }
      } else {
          // You would handle errors properly in a real app
          alert("Invalid verification code.");
      }
  };
  
  const completeOnboarding = (preferences: Pick<UserProfile, 'learningStyle'|'subjects'|'goals'>) => {
      setAuthState(prev => {
          if (!prev.user) return prev;
          const updatedUser = { ...prev.user, ...preferences };
          localStorage.setItem('userProfile', JSON.stringify(updatedUser));
          localStorage.setItem('onboardingComplete', 'true');
          return { ...prev, user: updatedUser };
      });
      setCurrentView(View.Dashboard);
  };


  const logout = () => {
    setAuthState({ isAuthenticated: false, user: null });
    localStorage.removeItem('userProfile');
    localStorage.removeItem('onboardingComplete');
    // Also remove user-specific stats
    // The key would ideally come from the logged-out user's info
    // For simplicity, we assume we know the key or it's handled elsewhere
    setCurrentView(View.Auth);
  };

  return (
    <AuthContext.Provider value={{ authState, currentView, login, signup, logout, verifyEmail, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
