'use client'

import { useState } from 'react'
import { useCustomers } from '@/hooks/useCustomers'
import { CustomerList } from '@/components/customers/CustomerList'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { Customer } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Building2 } from 'lucide-react'

export default function CustomersPage() {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer } = useCustomers()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const activeCustomers = customers.filter((c) => c.active)
  const passiveCustomers = customers.filter((c) => !c.active)

  const handleSave = async (values: Omit<Customer, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing) return updateCustomer(editing.id, values)
    return createCustomer(values)
  }

  const handleEdit = (c: Customer) => {
    setEditing(c)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Müşteriler</h1>
          <p className="text-sm text-muted-foreground">Müşteri listesini yönetin ve gelirlerini takip edin</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Müşteri Ekle
        </Button>
      </div>

      {activeCustomers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Aktif Müşteri</p>
                <p className="text-lg font-bold text-blue-600">{activeCustomers.length} müşteri</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktif Müşteriler ({activeCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerList
            customers={activeCustomers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteCustomer}
          />
        </CardContent>
      </Card>

      {passiveCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Pasif Müşteriler ({passiveCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerList
              customers={passiveCustomers}
              loading={loading}
              onEdit={handleEdit}
              onDelete={deleteCustomer}
            />
          </CardContent>
        </Card>
      )}

      {formOpen && (
        <CustomerForm
          open
          onClose={handleClose}
          onSave={handleSave}
          initial={editing}
        />
      )}
    </div>
  )
}
