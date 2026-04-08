'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Category, Staff, Customer, Supplier } from '@/types'

interface SharedDataContextType {
  categories: Category[]
  staff: Staff[]
  customers: Customer[]
  suppliers: Supplier[]
  loading: boolean
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>
  refetch: () => void
}

const SharedDataContext = createContext<SharedDataContextType | null>(null)

export function SharedDataProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [catRes, staffRes, custRes, supRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('staff').select('*').order('name'),
      supabase.from('customers').select('*').order('name'),
      supabase.from('suppliers').select('*').order('name'),
    ])
    if (catRes.data) setCategories(catRes.data)
    if (staffRes.data) setStaff(staffRes.data)
    if (custRes.data) setCustomers(custRes.data)
    if (supRes.data) setSuppliers(supRes.data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return (
    <SharedDataContext.Provider
      value={{
        categories, staff, customers, suppliers, loading,
        setCategories, setStaff, setCustomers, setSuppliers,
        refetch: fetchAll,
      }}
    >
      {children}
    </SharedDataContext.Provider>
  )
}

export function useSharedData() {
  const ctx = useContext(SharedDataContext)
  if (!ctx) throw new Error('useSharedData must be used within SharedDataProvider')
  return ctx
}
