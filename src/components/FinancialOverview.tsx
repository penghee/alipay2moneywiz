import { useEffect, useState } from "react";
import { apiClient } from "@/lib/apiClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
  TooltipProps,
} from "recharts";
import type { MonthlyFinancials } from "@/lib/monthlyStats";

type TooltipPayload = {
  name: string;
  value: number;
  color: string;
  payload: MonthlyFinancials;
};

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

interface CustomizedAxisTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string;
  };
}

const COLORS = {
  expense: "#EF4444",
  salary: "#10B981",
  balance: "#3B82F6",
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={`tooltip-${index}`} style={{ color: entry.color }}>
            {entry.name}: ¥{entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomizedAxisTick = ({
  x = 0,
  y = 0,
  payload,
}: CustomizedAxisTickProps) => {
  if (!payload) return null;

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
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const monthlyData = await apiClient.getMonthlyFinancials();
        setData(monthlyData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
        console.error("Error fetching financial data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals with null checks
  const safeData = Array.isArray(data) ? data : [];
  const totalExpenses = safeData.reduce(
    (sum, item) => sum + (item?.expenses || 0),
    0,
  );
  const totalSalary = safeData.reduce(
    (sum, item) => (item?.salary > 0 ? sum + item.salary : sum),
    0,
  );
  const totalIncome = safeData.reduce(
    (sum, item) => (item?.income > 0 ? sum + item.income : sum),
    0,
  );
  const totalBalance = safeData.reduce(
    (sum, item) => sum + (item?.balance || 0),
    0,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded-lg">
        Error: {error.message}
      </div>
    );
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
          <h3 className="text-sm font-medium text-green-800">总收入</h3>
          <p className="text-2xl font-bold text-green-600">
            ¥{totalIncome.toLocaleString()}
          </p>
          <p className="text-sm text-green-600">
            (工资: ¥{totalSalary.toLocaleString()})
          </p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">总结余</h3>
          <p
            className={`text-2xl font-bold ${totalBalance >= 0 ? "text-blue-600" : "text-red-600"}`}
          >
            {totalBalance >= 0 ? "¥" : "-¥"}
            {Math.abs(totalBalance).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number, name: string) => [
                `¥${value.toLocaleString()}`,
                name === "income"
                  ? "收入"
                  : name === "expenses"
                    ? "支出"
                    : "结余",
              ]}
            />
            <Line
              type="monotone"
              dataKey="income"
              name="收入"
              stroke="#10b981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              name="支出"
              stroke="#ef4444"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="balance"
              name="结余"
              stroke="#3b82f6"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
