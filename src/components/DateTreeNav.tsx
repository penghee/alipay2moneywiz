"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface YearData {
  year: number;
  months: number[];
}

export default function DateTreeNav() {
  const [years, setYears] = useState<YearData[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all years
        const yearsArray = await apiClient.getYears();

        if (!yearsArray || yearsArray.length === 0) {
          setYears([]);
          return;
        }

        // For each year, fetch its months
        const yearsWithMonths = await Promise.all(
          yearsArray.map(async (year: number) => {
            try {
              const months = await apiClient.getMonthsInYear(year);
              return { year, months };
            } catch (error) {
              console.error(`Error fetching months for year ${year}:`, error);
              return { year, months: [] };
            }
          }),
        );

        setYears(yearsWithMonths);

        // Expand current year by default if we have data
        if (yearsWithMonths.length > 0) {
          const currentYear = new Date().getFullYear();
          if (yearsWithMonths.some((y) => y.year === currentYear)) {
            setExpandedYears(new Set([currentYear]));
          } else {
            // If current year not available, expand the most recent year
            const latestYear = yearsWithMonths[yearsWithMonths.length - 1].year;
            setExpandedYears(new Set([latestYear]));
          }
        }
      } catch (error) {
        console.error("Error fetching date tree data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return <div className="p-4 text-gray-400">加载中...</div>;
  }

  return (
    <div className="space-y-1">
      <div className="px-4 py-2 text-sm font-medium text-gray-400 flex items-center">
        <Calendar className="w-4 h-4 mr-2" />
        时间导航
      </div>
      {years.map(({ year, months }) => (
        <div key={year} className="text-sm">
          <button
            onClick={() => toggleYear(year)}
            className={`w-full flex items-center px-4 py-1.5 text-left hover:bg-gray-700 rounded-md ${
              pathname === `/${year}` ? "text-blue-400" : "text-gray-300"
            }`}
          >
            {expandedYears.has(year) ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
            {year}年
          </button>

          {expandedYears.has(year) && (
            <div className="ml-6 mt-1 space-y-0.5">
              {/* 全年 */}
              <Link
                href={`/year/${year}`}
                className={`block px-4 py-1 hover:bg-gray-700 rounded-md ${
                  pathname === `/${year}` ? "text-blue-400" : "text-gray-400"
                }`}
              >
                全年流水
              </Link>
              {/* 全年预算 */}
              <Link
                href={`/year/${year}/budget`}
                className={`block px-4 py-1 hover:bg-gray-700 rounded-md ${
                  pathname === `/${year}/budget`
                    ? "text-blue-400"
                    : "text-gray-400"
                }`}
              >
                全年预算
              </Link>
              {months.map((month: string | number) => {
                // Convert month to string and ensure it's 2 digits
                const monthStr = String(month);
                const monthNum =
                  monthStr.length === 1 ? `0${monthStr}` : monthStr;
                const isActive =
                  pathname === `/year/${year}/month/${monthNum}` ||
                  (pathname === "/" &&
                    new Date().getFullYear() === year &&
                    (new Date().getMonth() + 1).toString().padStart(2, "0") ===
                      monthNum);

                return (
                  <Link
                    key={month}
                    href={`/year/${year}/month/${monthNum}`}
                    className={`block px-4 py-1 hover:bg-gray-700 rounded-md ${
                      isActive ? "text-blue-400" : "text-gray-400"
                    }`}
                  >
                    {month}月
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
