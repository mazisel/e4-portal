'use client'

import { useState } from 'react'
import { useCategories } from '@/hooks/useCategories'
import { CategoryList } from '@/components/categories/CategoryList'
import { CategoryForm } from '@/components/categories/CategoryForm'
import { Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export default function CategoriesPage() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const handleSave = async (values: Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (editing) {
      return updateCategory(editing.id, values)
    }
    return createCategory(values)
  }

  const handleEdit = (cat: Category) => {
    setEditing(cat)
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
          <h1 className="text-2xl font-bold">Kategoriler</h1>
          <p className="text-sm text-muted-foreground">Gelir ve gider kategorilerini yönetin</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Kategori Ekle
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Gelir Kategorileri ({incomeCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={incomeCategories}
              loading={loading}
              onEdit={handleEdit}
              onDelete={deleteCategory}
              emptyMessage="Henüz gelir kategorisi yok"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              Gider Kategorileri ({expenseCategories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={expenseCategories}
              loading={loading}
              onEdit={handleEdit}
              onDelete={deleteCategory}
              emptyMessage="Henüz gider kategorisi yok"
            />
          </CardContent>
        </Card>
      </div>

      {formOpen && (
        <CategoryForm
          open
          onClose={handleClose}
          onSave={handleSave}
          initial={editing}
          defaultType="expense"
        />
      )}
    </div>
  )
}
