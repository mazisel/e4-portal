'use client'

import { useState } from 'react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { SupplierList } from '@/components/suppliers/SupplierList'
import { SupplierForm } from '@/components/suppliers/SupplierForm'
import { Supplier } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Truck } from 'lucide-react'

export default function SuppliersPage() {
  const { suppliers, loading, createSupplier, updateSupplier, deleteSupplier } = useSuppliers()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  const activeSuppliers = suppliers.filter((s) => s.active)
  const passiveSuppliers = suppliers.filter((s) => !s.active)

  const handleSave = async (values: Omit<Supplier, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing) return updateSupplier(editing.id, values)
    return createSupplier(values)
  }

  const handleEdit = (s: Supplier) => {
    setEditing(s)
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
          <h1 className="text-2xl font-bold">Tedarikçiler</h1>
          <p className="text-sm text-muted-foreground">Tedarikçi listesini yönetin ve giderlerini takip edin</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tedarikçi Ekle
        </Button>
      </div>

      {activeSuppliers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Aktif Tedarikçi</p>
                <p className="text-lg font-bold text-orange-600">{activeSuppliers.length} tedarikçi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktif Tedarikçiler ({activeSuppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierList
            suppliers={activeSuppliers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteSupplier}
          />
        </CardContent>
      </Card>

      {passiveSuppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Pasif Tedarikçiler ({passiveSuppliers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <SupplierList
              suppliers={passiveSuppliers}
              loading={loading}
              onEdit={handleEdit}
              onDelete={deleteSupplier}
            />
          </CardContent>
        </Card>
      )}

      {formOpen && (
        <SupplierForm
          open
          onClose={handleClose}
          onSave={handleSave}
          initial={editing}
        />
      )}
    </div>
  )
}
