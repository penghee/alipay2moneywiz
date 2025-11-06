import React, { createContext, useContext, useState, useEffect } from "react";

type TimeRange = {
  year: number | null;
  month: number | null;
};

type FilterContextType = {
  // Time-based filtering
  timeRange: TimeRange;
  setYear: (year: number | null) => void;
  setMonth: (month: number | null) => void;
  clearTimeRange: () => void;

  // Category filtering
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  setCategories: (categories: string[]) => void;
  clearCategories: () => void;

  // Combined filters
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const STORAGE_KEY = "appFilters";

const getStoredFilters = () => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize state with values from localStorage
  const getInitialFilters = () => {
    if (typeof window !== "undefined") {
      const savedFilters = getStoredFilters();
      if (savedFilters) {
        return {
          timeRange: savedFilters.timeRange || { year: null, month: null },
          selectedCategories: savedFilters.selectedCategories || [],
        };
      }
    }
    return {
      timeRange: { year: null, month: null },
      selectedCategories: [],
    };
  };

  const initialFilters = getInitialFilters();
  const [timeRange, setTimeRange] = useState<TimeRange>(
    initialFilters.timeRange,
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialFilters.selectedCategories,
  );

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      timeRange,
      selectedCategories,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  }, [timeRange, selectedCategories]);

  const setYear = (year: number | null) => {
    setTimeRange((prev) => ({
      ...prev,
      year,
      // Reset month when year changes
      month: year ? prev.month : null,
    }));
  };

  const setMonth = (month: number | null) => {
    // Can't set month without a year
    if (!timeRange.year && month !== null) return;
    setTimeRange((prev) => ({
      ...prev,
      month,
    }));
  };

  const clearTimeRange = () => {
    setTimeRange({ year: null, month: null });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const setCategories = (categories: string[]) => {
    setSelectedCategories([...categories]);
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const clearAllFilters = () => {
    clearTimeRange();
    clearCategories();
  };

  const hasActiveFilters = Boolean(
    timeRange.year !== null ||
      timeRange.month !== null ||
      selectedCategories.length > 0,
  );

  return (
    <FilterContext.Provider
      value={{
        timeRange,
        setYear,
        setMonth,
        clearTimeRange,
        selectedCategories,
        toggleCategory,
        setCategories,
        clearCategories,
        hasActiveFilters,
        clearAllFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilter must be used within a FilterProvider");
  }
  return context;
};

// Helper hook for components that need to filter data
export const useFilteredData = <T extends { date: string; category?: string }>(
  data: T[],
) => {
  const { timeRange, selectedCategories } = useFilter();

  return React.useMemo(() => {
    return data.filter((item) => {
      const date = new Date(item.date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // getMonth() is 0-indexed

      // Filter by time range
      const yearMatches = timeRange.year === null || year === timeRange.year;
      const monthMatches =
        timeRange.month === null || month === timeRange.month;

      // Filter by categories if any are selected
      const categoryMatches =
        selectedCategories.length === 0 ||
        (item.category && selectedCategories.includes(item.category));

      return yearMatches && monthMatches && categoryMatches;
    });
  }, [data, timeRange, selectedCategories]);
};

export default FilterContext;
