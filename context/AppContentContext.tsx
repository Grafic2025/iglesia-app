import React, { createContext, useContext } from 'react';
import { useAppContentLogic } from '../hooks/useAppContentLogic';

const AppContentContext = createContext<any>(null);

export const AppContentProvider = ({ children }: { children: React.ReactNode }) => {
    const logic = useAppContentLogic();
    return (
        <AppContentContext.Provider value={logic}>
            {children}
        </AppContentContext.Provider>
    );
};

export const useAppContent = () => useContext(AppContentContext);
