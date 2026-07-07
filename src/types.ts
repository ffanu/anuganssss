export type TransactionType = 'incoming' | 'outgoing';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description: string;
  paymentMethod: string;
  tags?: string[];
  note?: string;
  timestamp?: string;
  photoEvidence?: string;
}

export interface XenditTransaction {
  id: string;
  product_id?: string;
  type: string;
  status: string;
  channel_code: string;
  channel_category: string;
  amount: number;
  currency: string;
  reference: string;
  created: string;
  updated: string;
  description: string;
}

export interface XenditBalance {
  balance: number;
  currency: string;
  mode: 'simulated' | 'live' | 'fallback';
  account_type: string;
  error?: string;
}

export interface XenditConfigStatus {
  configured: boolean;
}

export const MANUAL_CATEGORIES = {
  incoming: [
    { value: 'Salary', label: 'Salary/Wages', color: '#10B981', icon: 'Briefcase' },
    { value: 'Freelance', label: 'Freelance/Contract', color: '#059669', icon: 'Code' },
    { value: 'Investment', label: 'Investment Returns', color: '#3B82F6', icon: 'TrendingUp' },
    { value: 'Sales', label: 'Sales Revenue', color: '#8B5CF6', icon: 'ShoppingBag' },
    { value: 'Gift', label: 'Gift/Grant', color: '#EC4899', icon: 'Gift' },
    { value: 'Other_Income', label: 'Other Income', color: '#6B7280', icon: 'PlusCircle' },
  ],
  outgoing: [
    { value: 'Food', label: 'Food & Dining', color: '#EF4444', icon: 'Utensils' },
    { value: 'Rent', label: 'Rent & Housing', color: '#F97316', icon: 'Home' },
    { value: 'Utilities', label: 'Utilities & Bills', color: '#F59E0B', icon: 'Zap' },
    { value: 'Transport', label: 'Transportation', color: '#10B981', icon: 'Car' },
    { value: 'Shopping', label: 'Shopping & Retail', color: '#EC4899', icon: 'ShoppingBag' },
    { value: 'Entertainment', label: 'Entertainment', color: '#8B5CF6', icon: 'Tv' },
    { value: 'Insurance', label: 'Insurance & Health', color: '#06B6D4', icon: 'HeartPulse' },
    { value: 'Other_Expense', label: 'Other Expense', color: '#6B7280', icon: 'MinusCircle' },
  ],
};

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'E-Wallet',
  'Credit Card',
  'Other'
];

export interface Vendor {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  monthlyAmount: number;
  category: string;
  paymentDay: number;
  note?: string;
}

