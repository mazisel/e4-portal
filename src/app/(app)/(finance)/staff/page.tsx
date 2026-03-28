'use client'

import { useState } from 'react'
import { useStaff } from '@/hooks/useStaff'
import { StaffList } from '@/components/staff/StaffList'
import { StaffForm } from '@/components/staff/StaffForm'
import { Staff } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'

export default function StaffPage() {
  const { staff, loading, createStaff, updateStaff, deleteStaff } = useStaff()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)

  const activeStaff = staff.filter((s) => s.active)
  const passiveStaff = staff.filter((s) => !s.active)

  const handleSave = async (values: Omit<Staff, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing) return updateStaff(editing.id, values)
    return createStaff(values)
  }

  const handleEdit = (s: Staff) => {
    setEditing(s)
    setFormOpen(true)
  }

  const handleClose = () => {
    setFormOpen(false)
    setEditing(null)
  }

  const totalMonthlyCost = activeStaff.reduce((sum, s) => sum + (s.monthly_salary || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personeller</h1>
          <p className="text-sm text-muted-foreground">Personel listesini yönetin ve giderlerini takip edin</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Personel Ekle
        </Button>
      </div>

      {totalMonthlyCost > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Toplam Aylık Personel Maliyeti</p>
                <p className="text-lg font-bold">₺{totalMonthlyCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                {activeStaff.length} aktif personel
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktif Personel ({activeStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffList
            staff={activeStaff}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteStaff}
          />
        </CardContent>
      </Card>

      {passiveStaff.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Pasif Personel ({passiveStaff.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffList
              staff={passiveStaff}
              loading={loading}
              onEdit={handleEdit}
              onDelete={deleteStaff}
            />
          </CardContent>
        </Card>
      )}

      <StaffForm
        open={formOpen}
        onClose={handleClose}
        onSave={handleSave}
        initial={editing}
      />
    </div>
  )
}
