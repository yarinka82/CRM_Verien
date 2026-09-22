
import apiClient from '@/api/client';
import type { Expense, ExpenseFormData, ExpenseOverview } from '@/types/expenses';

const EXPENSES_URL = '/api/expenses/';
const OVERVIEW_URL = '/api/expenses/overview/';

function buildQuery(params?: Record<string, any>): string {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export const expensesApi = {
  getExpenses: async (params?: { date_from?: string; date_to?: string }): Promise<Expense[]> => {
    return apiClient.get(`${EXPENSES_URL}${buildQuery(params)}`);
  },
  createExpense: async (payload: ExpenseFormData): Promise<Expense> => {
    return apiClient.post(EXPENSES_URL, payload);
  },
  updateExpense: async (id: number, payload: ExpenseFormData): Promise<Expense> => {
    return apiClient.patch(`${EXPENSES_URL}${id}/`, payload);
  },
  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`${EXPENSES_URL}${id}/`);
  },
  getExpensesOverview: async (params?: { date_from?: string; date_to?: string }): Promise<ExpenseOverview> => {
    return apiClient.get(`${OVERVIEW_URL}${buildQuery(params)}`);
  },
};

export default expensesApi;