'use client'

import { useState } from 'react'
import { useFixedItems } from '@/hooks/useFixedItems'
import { useCustomers } from '@/hooks/useCustomers'
import { useStaff } from '@/hooks/useStaff'
import { FixedItemList } from '@/components/fixed/FixedItemList'
import { FixedItemForm } from '@/components/fixed/FixedItemForm'
import { FixedItem, TransactionType, MONTH_LABELS } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, TrendingDown, Minus, CalendarDays } from 'lucide-react'

const now = new Date()
const currentMonth = now.getMonth() + 1  // 1-12
const currentDay = now.getDate()

function isThisMonth(item: FixedItem): boolean {
  if (!item.active) return false
  if (item.frequency === 'monthly') return true
  if (item.frequency === 'yearly') return item.due_month === currentMonth
  return false
}

export default function FixedPage() {
  const { items, loading, createItem, updateItem, deleteItem } = useFixedItems()
  const { customers } = useCustomers(true)
  const { staff } = useStaff(true)

  const customerMap = Object.fromEntries(customers.map((c) => [c.id, c.name]))
  const staffMap = Object.fromEntries(staff.map((s) => [s.id, s.name]))
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<FixedItem | null>(null)
  const [defaultType, setDefaultType] = useState<TransactionType>('expense')

  const activeItems = items.filter((i) => i.active)
  const incomeItems = items.filter((i) => i.type === 'income')
  const expenseItems = items.filter((i) => i.type === 'expense')

  // Bu aya ait kalemler, güne göre sıralı
  const thisMonthItems = items
    .filter(isThisMonth)
    .sort((a, b) => (a.due_day ?? 99) - (b.due_day ?? 99))

  const expectedIncome = thisMonthItems.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0)
  const expectedExpense = thisMonthItems.filter((i) => i.type === 'expense').reduce((s, i) => s + i.amount, 0)
  const expectedNet = expectedIncome - expectedExpense

  const fmt = (n: number) => `₺${Math.abs(n).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`

  const handleSave = async (values: Omit<FixedItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing) return updateItem(editing.id, values)
    return createItem(values)
  }

  const handleEdit = (item: FixedItem) => {
    setEditing(item)
    setFormOpen(true)
  }

  const handleAdd = (type: TransactionType) => {
    setDefaultType(type)
    setEditing(null)
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
          <h1 className="text-2xl font-bold">Sabitler</h1>
          <p className="text-sm text-muted-foreground">Beklenen aylık sabit gelir ve gider kalemleri</p>
        </div>
        <Button onClick={() => handleAdd('expense')} className="gap-2">
          <Plus className="w-4 h-4" />
          Kalem Ekle
        </Button>
      </div>

      {/* Özet kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Beklenen Aylık Gelir</p>
                <p className="text-lg font-bold text-green-600">{fmt(expectedIncome)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Beklenen Aylık Gider</p>
                <p className="text-lg font-bold text-red-500">{fmt(expectedExpense)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={expectedNet >= 0 ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' : 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Minus className={`w-5 h-5 ${expectedNet >= 0 ? 'text-blue-600' : 'text-orange-500'}`} />
              <div>
                <p className="text-xs text-muted-foreground">Beklenen Net</p>
                <p className={`text-lg font-bold ${expectedNet >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                  {expectedNet < 0 ? '-' : ''}{fmt(expectedNet)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bu Ay Takvimi */}
      {thisMonthItems.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {MONTH_LABELS[currentMonth - 1]} Takvimi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {thisMonthItems.map((item) => {
                const isPast = item.due_day != null && item.due_day < currentDay
                const isToday = item.due_day === currentDay
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      isToday
                        ? 'border-primary bg-primary/5'
                        : isPast
                        ? 'opacity-50 bg-muted/30'
                        : 'bg-card'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isToday
                        ? 'bg-primary text-primary-foreground'
                        : isPast
                        ? 'bg-muted text-muted-foreground'
                        : item.type === 'income'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {item.due_day ?? '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {isToday && <Badge className="text-xs bg-primary">Bugün</Badge>}
                        {isPast && !isToday && <Badge variant="secondary" className="text-xs">Geçti</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.frequency === 'yearly' ? 'Yıllık' : 'Aylık'}
                        {item.due_day != null ? ` · ${item.due_day}. gün` : ''}
                        {item.type === 'income' && item.customer_id && customerMap[item.customer_id] ? ` · ${customerMap[item.customer_id]}` : ''}
                        {item.type === 'expense' && item.staff_id && staffMap[item.staff_id] ? ` · ${staffMap[item.staff_id]}` : ''}
                      </p>
                    </div>
                    <p className={`font-semibold text-sm flex-shrink-0 ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gelir kalemleri */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Sabit Gelirler ({incomeItems.length})
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => handleAdd('income')}>
            <Plus className="w-3.5 h-3.5" />
            Ekle
          </Button>
        </CardHeader>
        <CardContent>
          <FixedItemList
            items={incomeItems}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteItem}
            emptyMessage="Henüz sabit gelir kalemi eklenmemiş"
            customerMap={customerMap}
          />
        </CardContent>
      </Card>

      {/* Gider kalemleri */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Sabit Giderler ({expenseItems.length})
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-1 h-8" onClick={() => handleAdd('expense')}>
            <Plus className="w-3.5 h-3.5" />
            Ekle
          </Button>
        </CardHeader>
        <CardContent>
          <FixedItemList
            items={expenseItems}
            loading={loading}
            onEdit={handleEdit}
            onDelete={deleteItem}
            emptyMessage="Henüz sabit gider kalemi eklenmemiş"
            staffMap={staffMap}
          />
        </CardContent>
      </Card>

      {formOpen && (
        <FixedItemForm
          open
          onClose={handleClose}
          onSave={handleSave}
          initial={editing}
          defaultType={defaultType}
        />
      )}
    </div>
  )
}
