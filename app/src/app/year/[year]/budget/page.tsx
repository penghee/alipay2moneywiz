'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Info } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieLabelRenderProps } from 'recharts';

// 颜色池 - 使用 Tailwind CSS 的调色板
const COLOR_PALETTE = [
  // 蓝色系
  '#3b82f6', // blue-500
  // 绿色系
  '#10b981', // emerald-500
  // 紫色系
  '#8b5cf6', // violet-500
  // 红色系
  '#ef4444', // red-500
  // 黄色系
  '#f59e0b', // amber-500
  // 青色系
  '#06b6d4', // cyan-500
  // 粉红色系
  '#ec4899', // pink-500  
  // 橙色系
  '#f97316', // orange-500

  '#60a5fa', // blue-400
  '#34d399', // emerald-400
  '#a78bfa', // violet-400
  '#f87171', // red-400
  '#fbbf24', // amber-400
  '#22d3ee', // cyan-400
  '#f472b6', // pink-400
  '#fb923c', // orange-400

  '#93c5fd', // blue-300
  '#6ee7b7', // emerald-300
  '#c4b5fd', // violet-300
  '#fca5a5', // red-300
  '#fbbf24', // amber-300
  '#fcd34d', // amber-200
  '#67e8f9', // cyan-300
  '#f9a8d4', // pink-300
  '#fdba74', // orange-300

    // 灰色系
  '#94a3b8', // slate-400
  '#cbd5e1', // slate-300
  '#e2e8f0', // slate-200
];

// 存储已分配的颜色
const assignedColors: Record<string, string> = {};
let colorIndex = 0;

// 获取分类颜色
const getCategoryColor = (category: string): string => {
  // 如果已经有颜色，直接返回
  if (assignedColors[category]) {
    return assignedColors[category];
  }
  
  // 从颜色池中获取颜色
  const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
  assignedColors[category] = color;
  colorIndex++;
  
  return color;
};
import { fetchYearlyBudget, updateYearlyBudget, fetchBudgetProgress } from '@/lib/api/budget';

interface BudgetProgressCategory {
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  overBudget: boolean;
}

interface BudgetProgressData {
  total: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    overBudget: boolean;
  };
  categories: Record<string, BudgetProgressCategory>;
}

export default function BudgetPage({ params }: { params: Promise<{ year: string }> }) {
  const [year, setYear] = useState<number | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [categories, setCategories] = useState<{ name: string; amount: number }[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [budgetProgress, setBudgetProgress] = useState<BudgetProgressData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadBudget = async () => {
      try {
        const resolvedParams = await params;
        const yearNum = parseInt(resolvedParams.year);
        if (isNaN(yearNum)) return;
        
        setYear(yearNum);
        
        // Load budget data
        const budgetData = await fetchYearlyBudget(yearNum);
        setTotalBudget(budgetData.total);
        
        const categoryList = Object.entries(budgetData.categories).map(([name, amount]) => ({
          name,
          amount
        }));
        setCategories(categoryList);
        
        // Load progress data
        const progress = await fetchBudgetProgress(yearNum);
        setBudgetProgress(progress);
      } catch (error) {
        console.error('Error loading budget:', error);
      }
    };
    
    loadBudget();
  }, [params]);

  const addCategory = () => {
    if (!newCategory.trim() || !newAmount) return;
    
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setCategories([...categories, { name: newCategory.trim(), amount }]);
    setNewCategory('');
    setNewAmount('');
  };

  const removeCategory = (index: number) => {
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  const saveBudget = async () => {
    if (year === null) return;
    
    setIsSaving(true);
    try {
      const categoryMap = categories.reduce<Record<string, number>>((acc, curr) => {
        acc[curr.name] = curr.amount;
        return acc;
      }, {});
      
      await updateYearlyBudget(year, totalBudget, categoryMap);
      
      // Reload progress
      const progress = await fetchBudgetProgress(year);
      setBudgetProgress(progress);
      
      // Show success message or toast here
      alert('预算保存成功！');
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (year === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {year}年 预算管理
          </h1>
        </div>

        {/* Total Budget */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">年度总预算</h2>
          <div className="flex items-center">
            <span className="text-gray-700 mr-2">¥</span>
            <input
              type="number"
              value={totalBudget || ''}
              onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="输入总预算"
              min="0"
              step="100"
            />
            <span className="ml-4 text-sm text-gray-500">
              {budgetProgress?.total && (
                <span className={budgetProgress.total.overBudget ? 'text-red-600' : 'text-green-600'}>
                  已用: ¥{budgetProgress.total.spent.toLocaleString()} ({budgetProgress.total.percentage.toFixed(2)}%)
                </span>
              )}
            </span>
          </div>
          
          {budgetProgress?.total && (
            <div className="mt-4 space-y-6">
              {/* 饼图 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">预算分布</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(budgetProgress.categories || {})
                          .filter(([_, data]) => data && data.budget > 0)
                          .map(([name, data]) => ({
                            name,
                            value: data.budget,
                            color: getCategoryColor(name)
                          }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      >
                        {Object.entries(budgetProgress.categories || {})
                          .filter(([_, data]) => data && data.budget > 0)
                          .map(([name]) => (
                            <Cell key={`cell-${name}`} fill={getCategoryColor(name)} />
                          ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => [
                          `¥${value.toLocaleString()}`,
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">预算使用情况</h3>
                <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden relative">
                {(() => {
                  // 先过滤出有消费的分类并计算宽度
                  const categories = Object.entries(budgetProgress.categories || {})
                    .filter(([_, data]) => data && data.spent > 0)
                    .map(([category, data]) => {
                      const width = Math.min(100, (data.spent / budgetProgress.total.budget) * 100);
                      const percentage = (data.spent / budgetProgress.total.budget * 100).toFixed(2);
                      return { category, data, width, percentage };
                    });
                  
                  // 计算每个分类的偏移量
                  let offset = 0;
                  const segments = categories.map(({ category, data, width, percentage }) => {
                    const segment = (
                      <div 
                        key={category}
                        className="h-full absolute top-0 transition-all duration-300 hover:opacity-90 flex items-center justify-end pr-2 text-xs font-medium text-white"
                        style={{
                          left: `${offset}%`,
                          width: `${width}%`,
                          backgroundColor: getCategoryColor(category),
                          backgroundImage: `linear-gradient(to right, ${getCategoryColor(category)}, ${getCategoryColor(category)}80)`,
                          zIndex: 1
                        }}
                        title={`${category}: ¥${data.spent.toLocaleString()} (${percentage}%)`}
                      >
                        {width > 15 && (
                          <span className="truncate">
                            {category} {percentage}%
                          </span>
                        )}
                      </div>
                    );
                    
                    // 更新下一个分段的偏移量
                    offset += width;
                    
                    return segment;
                  });
                  
                  return segments;
                })()}
                {/* 显示未使用的预算 */}
                {budgetProgress.total.remaining > 0 && (
                  <div 
                    className="h-full absolute top-0 right-0 bg-gray-200 flex items-center justify-end pr-2 text-xs text-gray-500"
                    style={{
                      width: `${Math.max(0, 100 - budgetProgress.total.percentage)}%`,
                      transition: 'width 0.3s ease-in-out',
                      zIndex: 0
                    }}
                  >
                    {budgetProgress.total.percentage < 85 && (
                      <span>剩余 ¥{budgetProgress.total.remaining.toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
              
              {/* 图例 */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {Object.entries(budgetProgress.categories || {})
                  .filter(([_, data]) => data && data.spent > 0)
                  .map(([category, data]) => (
                    <div key={category} className="flex items-center">
                      <span 
                        className="w-3 h-3 rounded-sm mr-2"
                        style={{ 
                          backgroundColor: getCategoryColor(category),
                          minWidth: '12px'
                        }}
                      />
                      <span className="text-gray-700 font-medium">{category}</span>
                      <span className="text-gray-500 ml-1">
                        (¥{data.spent.toLocaleString()}, {data.percentage.toFixed(2)}%)
                      </span>
                    </div>
                  ))
                }
              </div>
              
              <div className="flex justify-between mt-3 text-sm text-gray-600 border-t border-gray-100 pt-2">
                <div className="flex items-center">
                  <span className="font-medium">总预算: ¥{totalBudget.toLocaleString()}</span>
                  <Info className="w-3.5 h-3.5 ml-1 text-gray-400" />
                </div>
                <span className={budgetProgress.total.overBudget ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  已用: ¥{budgetProgress.total.spent.toLocaleString()} ({budgetProgress.total.percentage.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Category Budgets */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">分类预算</h2>
          
          {/* Add Category Form */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="分类名称"
            />
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                ¥
              </span>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="flex-1 min-w-0 w-32 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="金额"
                min="0"
                step="10"
              />
            </div>
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加
            </button>
          </div>
          
          {/* Categories List */}
          <div className="space-y-4">
            {categories.map((category, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{category.name}</div>
                  {budgetProgress?.categories[category.name] && (
                    <div className="text-sm text-gray-500">
                      已用: ¥{budgetProgress.categories[category.name].spent.toLocaleString()} ({budgetProgress.categories[category.name].percentage.toFixed(2)}%)
                    </div>
                  )}
                </div>
                <div className="w-full sm:w-48">
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-700">¥</span>
                    <input
                      type="number"
                      value={category.amount}
                      onChange={(e) => {
                        const newCategories = [...categories];
                        newCategories[index].amount = Number(e.target.value) || 0;
                        setCategories(newCategories);
                      }}
                      className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="10"
                    />
                  </div>
                  {budgetProgress?.categories[category.name] && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budgetProgress.categories[category.name].overBudget ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, budgetProgress.categories[category.name].percentage)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeCategory(index)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="删除分类"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            
            {categories.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                暂无分类预算，请添加分类
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={saveBudget}
            disabled={isSaving}
            className={`px-6 py-2 rounded-md text-white font-medium flex items-center ${
              isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                保存预算
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
