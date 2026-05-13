export type Country = 'RW' | 'DJ';
export type Currency = 'RWF' | 'DJF';
export type AccountType = 'checking' | 'savings';
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'exchange';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: Country;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  account_type: AccountType;
  currency: Currency;
  balance: number;
  is_active: number;
  created_at: string;
  full_name?: string;
  country?: Country;
}

export interface Transaction {
  id: string;
  from_account_id: string | null;
  to_account_id: string | null;
  type: TransactionType;
  amount: number;
  currency: Currency;
  converted_amount: number | null;
  converted_currency: Currency | null;
  exchange_rate: number | null;
  description: string | null;
  status: TransactionStatus;
  created_at: string;
  from_account_number?: string;
  to_account_number?: string;
  from_user_name?: string;
  to_user_name?: string;
}

export interface ExchangeRate {
  id: number;
  from_currency: Currency;
  to_currency: Currency;
  rate: number;
  updated_at: string;
}
