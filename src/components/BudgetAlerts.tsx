'use client';

import { AlertCircle, AlertTriangle } from 'lucide-react';
import { CategoryExpense } from '../lib/types';

// Simple alert component since we don't have the UI library
const Alert = ({
  variant = 'default',
  className = '',
  children,
}: {
  variant?: 'default' | 'destructive';
  className?: string;
  children: React.ReactNode;
}) => {
  const baseStyles = 'p-4 rounded-md flex items-start gap-3';
  const variantStyles = {
    default: 'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    destructive: 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
};

const AlertTitle = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <h4 className={`font-medium mb-1 ${className}`}>
    {children}
  </h4>
);

const AlertDescription = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`text-sm ${className}`}>
    {children}
  </div>
);

interface BudgetAlertsProps {
  categories: Record<string, CategoryExpense>;
  budgetUsageThreshold: number;
}

export function BudgetAlerts({ categories, budgetUsageThreshold }: BudgetAlertsProps) {
  if (!categories) return null;

  interface BudgetAlert {
    type: 'error' | 'warning';
    title: string;
    message: string;
  }

  const alerts: BudgetAlert[] = [];

  // 检查每个分类的预算使用情况
  Object.entries(categories).forEach(([category, data]) => {
    if (!data || !data.budget) return;

    const usage = (data.spent / data.budget) * 100;
    if (usage >= budgetUsageThreshold) {
      alerts.push({
        type: usage >= 100 ? 'error' : 'warning',
        title: usage >= 100 
          ? `"${category}" 分类预算已超支` 
          : `"${category}" 分类预算即将用尽`,
        message: usage >= 100
          ? `已支出 ¥${data.spent.toLocaleString()}，超出预算 ¥${(data.spent - data.budget).toLocaleString()}`
          : `已使用 ${usage.toFixed(1)}% 的预算 (¥${data.spent.toLocaleString()}/${data.budget.toLocaleString()})`
      });
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-medium">预算预警</h3>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <Alert 
            key={index} 
            variant={alert.type === 'error' ? 'destructive' : 'default'}
            className={alert.type === 'error' 
              ? 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20' 
              : 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'}
          >
            {alert.type === 'error' ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <AlertTitle className="font-medium">{alert.title}</AlertTitle>
            <AlertDescription className="text-sm">
              {alert.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}
