
export type PaymentType =
  | 'membership_fee'
  | 'donation'
  | 'sponsorship'
  | 'grant';

export type PayerType = 'individual' | 'company' | 'other';


export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  membership_fee: 'Членський внесок',
  donation: 'Пожертва',
  sponsorship: 'Спонсорська підтримка',
  grant: 'Грант',
};

export const PAYER_TYPE_LABELS: Record<PayerType, string> = {
  individual: 'Фізична особа',
  company: 'Підприємство',
  other: 'Інше',
};

export interface Payment {
  id: number;
  member: number | null;
  member_name?: string | null;
  type: PaymentType;
  type_display?: string;
  payer_type: PayerType;
  payer_type_display?: string;
  amount: string;
  date: string; // ISO date, 'YYYY-MM-DD'
  source_name?: string; // source for donation/sponsorship/grant
  period?: string; // period for membership_fee, e.g. '2026' or '2026-Q1'
  comment?: string;
  created_at?: string;
}


export interface PaymentFormData {
  member?: number | null;
  amount: string;
  date: string;
  type: PaymentType;
  payer_type: PayerType;
  source_name: string;
  period: string;
  comment?: string;
}

export interface PaymentListParams {
  member?: number;
  type?: PaymentType;
  payer_type?: PayerType;
  date_from?: string;
  date_to?: string;
  [key: string]: any;
}

export interface PaymentBreakdownItem {
  type: PaymentType;
  type_display: string;
  total: number;
}

export interface PayerBreakdownItem {
  payer_type: PayerType;
  payer_type_display: string;
  total: number;
}

export interface PaymentPeriodItem {
  period: string; // 'YYYY-MM'
  total: number;
}

export interface PaymentQuarterItem {
  period: string; // 'YYYY-QN'
  total: number;
}

export interface FinancialOverview {
  date_from: string | null;
  date_to: string | null;
  total: number;
  breakdown: PaymentBreakdownItem[];
  payer_breakdown: PayerBreakdownItem[];
  by_period: PaymentPeriodItem[];
  by_period_quarterly: PaymentQuarterItem[];
}