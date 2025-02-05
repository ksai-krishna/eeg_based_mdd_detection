// PredictionContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PredictionContextType {
  prediction: string;
  setPrediction: (prediction: string) => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export const usePrediction = () => {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
};

interface PredictionProviderProps {
  children: ReactNode;
}

export const PredictionProvider = ({ children }: PredictionProviderProps) => {
  const [prediction, setPrediction] = useState<string>('');

  return (
    <PredictionContext.Provider value={{ prediction, setPrediction }}>
      {children}
    </PredictionContext.Provider>
  );
};
