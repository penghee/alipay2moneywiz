import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import type { MonthlyFinancials } from '@/lib/monthlyStats';

const COLORS = {
  expense: '#EF4444',
  salary: '#10B981',
  balance: '#3B82F6'
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            {entry.name}: ¥{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomizedAxisTick = (props: any) => {
  const { x, y, payload } = props;
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#666"
        transform="rotate(-45)"
        className="text-xs"
      >
        {payload.value}
      </text>
    </g>
  );
};

export default function FinancialOverview() {
  const [data, setData] = useState<MonthlyFinancials[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/financials/monthly');
        if (!response.ok) {
          throw new Error('Failed to fetch financial data');
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching financial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const totalSalary = data.reduce((sum, item) => item.salary > 0 ? sum + item.salary : sum, 0);
  const totalBalance = data.reduce((sum, item) => sum + item.balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Error: {error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        近12个月财务概览
      </h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">总支出</h3>
          <p className="text-2xl font-bold text-red-600">
            ¥{totalExpenses.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">总收入(工资)</h3>
          <p className="text-2xl font-bold text-green-600">
            ¥{totalSalary.toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">总结余</h3>
          <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {totalBalance >= 0 ? '¥' : '-¥'}{Math.abs(totalBalance).toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={<CustomizedAxisTick />}
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => `¥${value.toLocaleString()}`}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="expenses" name="支出" fill={COLORS.expense} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-expense-${index}`} fill={COLORS.expense} />
              ))}
            </Bar>
            <Bar dataKey="salary" name="工资收入" fill={COLORS.salary} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-salary-${index}`} fill={COLORS.salary} />
              ))}
            </Bar>
            <Bar dataKey="balance" name="结余" fill={COLORS.balance} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-balance-${index}`} 
                  fill={entry.balance >= 0 ? COLORS.balance : COLORS.expense} 
                />
              ))}
              <LabelList 
                dataKey="balance" 
                position="top" 
                formatter={(value) => {
                  const numValue = Number(value);
                  return numValue >= 0 
                    ? '¥' + numValue.toLocaleString() 
                    : '-¥' + Math.abs(numValue).toLocaleString();
                }}
                style={{ fill: '#666', fontSize: '0.75rem' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
