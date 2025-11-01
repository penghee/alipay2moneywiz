export interface Expense {
  id: string;
  amount: number; // Positive for income, negative for expense
  category: string;
  date: string; // ISO date string
  description: string;
  // Add any other fields you have in your expense data
}
