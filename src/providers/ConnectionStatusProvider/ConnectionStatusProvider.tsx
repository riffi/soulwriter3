// src/providers/ConnectionStatusProvider/ConnectionStatusProvider.tsx
import React, { createContext, useContext } from 'react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus'; // Adjusted path

interface ConnectionStatusContextType {
  isOnline: boolean;
}

const ConnectionStatusContext = createContext<ConnectionStatusContextType | undefined>(undefined);

export const ConnectionStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useConnectionStatus();

  return (
    <ConnectionStatusContext.Provider value={{ isOnline }}>
      {children}
    </ConnectionStatusContext.Provider>
  );
};

export const useConnection = (): ConnectionStatusContextType => {
  const context = useContext(ConnectionStatusContext);
  if (context === undefined) {
    throw new Error('useConnection must be used within a ConnectionStatusProvider');
  }
  return context;
};
