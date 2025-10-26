import React from 'react';

interface BudgetProgressProps {
  spent: number;
  budget: number;
  showLabels?: boolean;
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BudgetProgress({
  spent,
  budget,
  showLabels = true,
  height = 'md',
  className = '',
}: BudgetProgressProps) {
  const percentage = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const isOverBudget = spent > budget;
  
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">已用: ¥{spent.toLocaleString()}</span>
          <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
            预算: ¥{budget.toLocaleString()}
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isOverBudget ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {showLabels && (
        <div className="mt-1 text-right text-sm">
          <span className={isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
            {isOverBudget ? '超支' : '剩余'} ¥{Math.abs(budget - spent).toLocaleString()}
            {budget > 0 && ` (${percentage.toFixed(1)}%)`}
          </span>
        </div>
      )}
    </div>
  );
}

export default BudgetProgress;
