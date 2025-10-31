interface BudgetData {
  total: number;
  categories: Record<string, number>;
}

export async function fetchYearlyBudget(year: number | string): Promise<BudgetData> {
  const response = await fetch(`/api/budget?year=${year}`);
  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }
  return response.json();
}

export async function updateYearlyBudget(
  year: number | string,
  total: number | null = null,
  categories: Record<string, number> | null = null
): Promise<void> {
  const response = await fetch('/api/budget', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ year, total, categories }),
  });

  if (!response.ok) {
    throw new Error('Failed to update budget');
  }
}

export async function fetchBudgetProgress(
  year: number | string,
  month?: number
): Promise<{
  total: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    overBudget: boolean;
  };
  categories: Record<
    string,
    {
      budget: number;
      spent: number;
      remaining: number;
      percentage: number;
      overBudget: boolean;
    }
  >;
}> {
  const response = await fetch(`/api/budget/progress?year=${year}${month ? `&month=${month}` : ''}`);
  if (!response.ok) {
    throw new Error('Failed to fetch budget progress');
  }
  return response.json();
}
