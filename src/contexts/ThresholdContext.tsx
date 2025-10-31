import React, { createContext, useContext, useState, useEffect } from 'react';
import appConfig from '../config/app_config.json';

interface ThresholdContextType {
  threshold: number;
  setThreshold: (value: number) => void;
  config: {
    min: number;
    max: number;
    step: number;
  };
}

const defaultThreshold = appConfig.expenseThreshold.default;
const ThresholdContext = createContext<ThresholdContextType | undefined>(undefined);

export const ThresholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [threshold, setThresholdState] = useState<number>(() => {
    // Load from localStorage if available, otherwise use default
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('expenseThreshold');
      return saved ? Number(saved) : defaultThreshold;
    }
    return defaultThreshold;
  });

  const setThreshold = (value: number) => {
    setThresholdState(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('expenseThreshold', value.toString());
    }
  };

  return (
    <ThresholdContext.Provider
      value={{
        threshold,
        setThreshold,
        config: {
          min: appConfig.expenseThreshold.min,
          max: appConfig.expenseThreshold.max,
          step: appConfig.expenseThreshold.step,
        },
      }}
    >
      {children}
    </ThresholdContext.Provider>
  );
};

export const useThreshold = (): ThresholdContextType => {
  const context = useContext(ThresholdContext);
  if (context === undefined) {
    throw new Error('useThreshold must be used within a ThresholdProvider');
  }
  return context;
};
