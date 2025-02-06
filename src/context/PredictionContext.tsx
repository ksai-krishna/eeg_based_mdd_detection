import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PredictionContextType {
  prediction: string;
  delta: string;
  theta: string;
  alpha: string;
  beta: string;
  
  setPredictionData: (data: {
    prediction?: string;
    delta?: string;
    theta?: string;
    alpha?: string;
    beta?: string;
  }) => void;
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
  const [delta, setDelta] = useState<string>('');
  const [theta, setTheta] = useState<string>('');
  const [alpha, setAlpha] = useState<string>('');
  const [beta, setBeta] = useState<string>('');

  // Unified function to update all values
  const setPredictionData = (data: Partial<PredictionContextType>) => {
    if (data.prediction !== undefined) setPrediction(data.prediction);
    if (data.delta !== undefined) setDelta(data.delta);
    if (data.theta !== undefined) setTheta(data.theta);
    if (data.alpha !== undefined) setAlpha(data.alpha);
    if (data.beta !== undefined) setBeta(data.beta);
  };

  return (
    <PredictionContext.Provider value={{ 
      prediction, delta, theta, alpha, beta, 
      setPredictionData 
    }}>
      {children}
    </PredictionContext.Provider>
  );
};
