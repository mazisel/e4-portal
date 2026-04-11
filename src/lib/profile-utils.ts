import { UserProfile, UserRole } from '@/types'

type ProfileRecord = Partial<UserProfile> & {
  id?: string | null
  full_name?: string | null
  email?: string | null
  can_access_finance?: boolean | null
  role?: string | null
  is_active?: boolean | null
  phone?: string | null
}

export function normalizeUserRole(role: string | null | undefined, canAccessFinance = false): UserRole {
  if (role === 'admin') return 'admin'
  return canAccessFinance ? 'admin' : 'user'
}

export function normalizeProfileRecord(record: ProfileRecord | null | undefined): UserProfile | null {
  if (!record?.id) return null

  const canAccessFinance = Boolean(record.can_access_finance)

  return {
    id: record.id,
    full_name: record.full_name ?? null,
    email: record.email ?? null,
    can_access_finance: canAccessFinance,
    role: normalizeUserRole(record.role, canAccessFinance),
    is_active: record.is_active ?? true,
    phone: record.phone ?? null,
  }
}

export function isAdminProfile(record: ProfileRecord | null | undefined) {
  const profile = normalizeProfileRecord(record)
  return profile?.role === 'admin'
}
