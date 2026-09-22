
export interface Expense {
  id: number;
  title: string;
  amount: string;
  date: string; // 'YYYY-MM-DD'
  created_at?: string;
}

export interface ExpenseFormData {
  title: string;
  amount: string;
  date: string;
}

export interface ExpensePeriodItem {
  period: string; // 'YYYY-MM'
  total: number;
}

export interface ExpenseOverview {
  date_from: string | null;
  date_to: string | null;
  total: number;
  by_period: ExpensePeriodItem[];
}