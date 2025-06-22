import React, { createContext, useContext, useState } from 'react';

interface FABContextData {
  onFABPress: () => void;
  setOnFABPress: (callback: () => void) => void;
}

const FABContext = createContext<FABContextData>({} as FABContextData);

export const useFAB = () => {
  const context = useContext(FABContext);
  if (!context) {
    throw new Error('useFAB deve ser usado dentro de um FABProvider');
  }
  return context;
};

export const FABProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [onFABPress, setOnFABPress] = useState<() => void>(() => {});

  return (
    <FABContext.Provider value={{ 
      onFABPress, 
      setOnFABPress 
    }}>
      {children}
    </FABContext.Provider>
  );
}; 