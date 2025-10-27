'use client';

import { ReactNode } from 'react';
import { ThresholdProvider } from '../contexts/ThresholdContext';

export function Providers({ children }: { children: ReactNode }) {
  return <ThresholdProvider>{children}</ThresholdProvider>;
}
