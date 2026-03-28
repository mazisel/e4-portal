export type TransactionType = 'income' | 'expense'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card'

export interface Customer {
  id: string
  user_id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  user_id: string
  name: string
  contact: string | null
  phone: string | null
  email: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  user_id: string
  name: string
  position: string | null
  monthly_salary: number | null
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string
  staff_id: string | null
  customer_id: string | null
  supplier_id: string | null
  receipt_url: string | null
  created_by_email: string | null
  type: TransactionType
  amount: number
  description: string | null
  transaction_date: string
  payment_method: PaymentMethod
  notes: string | null
  created_at: string
  updated_at: string
  category?: Category
  staff?: Staff
  customer?: Customer
  supplier?: Supplier
}

export type FixedFrequency = 'monthly' | 'yearly'

export const FIXED_FREQUENCY_LABELS: Record<FixedFrequency, string> = {
  monthly: 'Aylık',
  yearly: 'Yıllık',
}

export const MONTH_LABELS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

export interface FixedItem {
  id: string
  user_id: string
  name: string
  type: TransactionType
  amount: number
  frequency: FixedFrequency
  due_day: number | null
  due_month: number | null
  customer_id: string | null
  staff_id: string | null
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TransactionHistory {
  id: string
  transaction_id: string
  user_id: string
  user_email: string | null
  changed_at: string
  old_data: Record<string, unknown>
  new_data: Record<string, unknown>
}

export interface TransactionFilters {
  type?: TransactionType | 'all'
  category_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface MonthlyReport {
  year: number
  month: number
  income: number
  expense: number
  net: number
}

export interface CategoryReport {
  category_id: string
  category_name: string
  category_color: string
  total: number
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Nakit',
  bank_transfer: 'Havale/EFT',
  credit_card: 'Kredi Kartı',
}

export type KasaEntryType = 'in' | 'out'

export interface KasaEntry {
  id: string
  user_id: string
  type: KasaEntryType
  amount: number
  description: string
  entry_date: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type DebtType = 'payable' | 'receivable'
export type DebtStatus = 'pending' | 'paid'

export interface Debt {
  id: string
  user_id: string
  type: DebtType
  contact_name: string
  amount: number
  description: string | null
  due_date: string | null
  status: DebtStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type AdvanceStatus = 'pending' | 'returned' | 'deducted'

export interface Advance {
  id: string
  user_id: string
  staff_id: string | null
  person_name: string
  amount: number
  description: string | null
  advance_date: string
  status: AdvanceStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  payable: 'Borcumuz',
  receivable: 'Alacağımız',
}

export const ADVANCE_STATUS_LABELS: Record<AdvanceStatus, string> = {
  pending: 'Bekliyor',
  returned: 'Geri Ödendi',
  deducted: 'Maaştan Kesildi',
}
