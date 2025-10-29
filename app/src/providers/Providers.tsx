'use client';

import { ReactNode } from 'react';
import { ThresholdProvider } from '../contexts/ThresholdContext';
import { FilterProvider } from '../contexts/FilterContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThresholdProvider>
      <FilterProvider>
        {children}
      </FilterProvider>
    </ThresholdProvider>
  );
}
