import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { UserStats } from '../types';
import { useAuth } from './AuthContext';

interface IUserStatsContext {
    stats: UserStats;
    updateStats: (result: { correct: number; incorrect: number; }) => void;
    loadStats: (userName: string) => void;
}

const UserStatsContext = createContext<IUserStatsContext | undefined>(undefined);

const initialStats: UserStats = {
    quizzesTaken: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
};

export const UserStatsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<UserStats>(initialStats);
    const { authState } = useAuth(); // Depend on AuthContext

    const loadStats = useCallback((userName: string) => {
        if(!userName) return;
        const savedStats = localStorage.getItem(`userStats_${userName}`);
        if (savedStats) {
            setStats(JSON.parse(savedStats));
        } else {
            setStats(initialStats);
        }
    }, []);

    // Load stats whenever the authenticated user changes
    useEffect(() => {
        if (authState.isAuthenticated && authState.user) {
            loadStats(authState.user.email); // Use email as a unique identifier
        } else {
            setStats(initialStats); // Reset stats on logout
        }
    }, [authState.isAuthenticated, authState.user, loadStats]);

    // Save stats whenever they change
    useEffect(() => {
        if (authState.isAuthenticated && authState.user) {
            localStorage.setItem(`userStats_${authState.user.email}`, JSON.stringify(stats));
        }
    }, [stats, authState.isAuthenticated, authState.user]);

    const updateStats = useCallback((result: { correct: number; incorrect: number; }) => {
        setStats(prev => ({
            quizzesTaken: prev.quizzesTaken + 1,
            totalCorrect: prev.totalCorrect + result.correct,
            totalIncorrect: prev.totalIncorrect + result.incorrect,
        }));
    }, []);

    return (
        <UserStatsContext.Provider value={{ stats, updateStats, loadStats }}>
            {children}
        </UserStatsContext.Provider>
    );
};

export const useUserStats = (): IUserStatsContext => {
    const context = useContext(UserStatsContext);
    if (context === undefined) {
        throw new Error('useUserStats must be used within a UserStatsProvider');
    }
    return context;
};
