'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldCheck, ShieldUser, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { UserRole } from '@/types'

export interface ManagedUser {
  id: string
  full_name: string | null
  email: string | null
  can_access_finance: boolean
  role: UserRole
  is_active: boolean
  phone: string | null
  created_at: string
}

interface UserManagementTableProps {
  initialUsers: ManagedUser[]
  currentUserId: string
}

interface UserFormValues {
  fullName: string
  email: string
  password: string
  canAccessFinance: boolean
  role: UserRole
  isActive: boolean
  phone: string
}

interface UserDialogProps {
  currentUserId: string
  mode: 'create' | 'edit'
  onClose: () => void
  onSubmit: (values: UserFormValues) => Promise<void>
  pending: boolean
  user?: ManagedUser | null
}

function getDisplayName(user: ManagedUser) {
  if (user.full_name?.trim()) return user.full_name.trim()
  if (user.email?.trim()) return user.email.trim().split('@')[0]
  return 'Isimsiz Kullanici'
}

function sortUsers(users: ManagedUser[]) {
  return [...users].sort((left, right) =>
    getDisplayName(left).localeCompare(getDisplayName(right), 'tr')
  )
}

function formatJoinDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function UserDialog({ currentUserId, mode, onClose, onSubmit, pending, user }: UserDialogProps) {
  const isEditMode = mode === 'edit'
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'user')
  const [isActive, setIsActive] = useState(user?.is_active ?? true)
  const [canAccessFinance, setCanAccessFinance] = useState(user?.can_access_finance ?? false)
  const [phone, setPhone] = useState(user?.phone ?? '')

  const isCurrentUser = user?.id === currentUserId

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    await onSubmit({
      fullName,
      email,
      password,
      role,
      isActive,
      canAccessFinance,
      phone,
    })
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Rol, aktiflik ve finans erişim yetkisini güncelle.'
              : 'Yeni portal kullanıcısını oluştur ve başlangıç erişimlerini belirle.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Ad Soyad</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={event => setFullName(event.target.value)}
              placeholder="Ornek Kullanici"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled={isEditMode}
              onChange={event => setEmail(event.target.value)}
              placeholder="kullanici@mail.com"
            />
          </div>

          {!isEditMode && (
            <div className="grid gap-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="En az 6 karakter"
              />
            </div>
          )}
 
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefon Numarası</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={event => setPhone(event.target.value)}
              placeholder="05XX XXX XX XX"
            />
            <p className="text-[10px] text-muted-foreground">
              WhatsApp bildirimleri için TR formatında (örn: 05551234567) giriniz.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                value={role}
                disabled={isCurrentUser}
                onChange={event => setRole(event.target.value as UserRole)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="user">Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Durum</Label>
              <select
                id="status"
                value={String(isActive)}
                disabled={isCurrentUser}
                onChange={event => setIsActive(event.target.value === 'true')}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finance">Finans Yetkisi</Label>
              <select
                id="finance"
                value={String(canAccessFinance)}
                onChange={event => setCanAccessFinance(event.target.value === 'true')}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="false">Kapalı</option>
                <option value="true">Açık</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Kaydediliyor...' : isEditMode ? 'Güncelle' : 'Kullanıcı Oluştur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UserManagementTable({ initialUsers, currentUserId }: UserManagementTableProps) {
  const [users, setUsers] = useState(sortUsers(initialUsers))
  const [query, setQuery] = useState('')
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr-TR')
    if (!term) return users

    return users.filter(user => {
      const searchable = `${getDisplayName(user)} ${user.email ?? ''}`.toLocaleLowerCase('tr-TR')
      return searchable.includes(term)
    })
  }, [query, users])

  const adminCount = useMemo(() => users.filter(user => user.role === 'admin').length, [users])
  const activeCount = useMemo(() => users.filter(user => user.is_active).length, [users])
  const financeEnabledCount = useMemo(() => users.filter(user => user.can_access_finance).length, [users])

  const handleCreateUser = async (values: UserFormValues) => {
    setPendingKey('create')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          role: values.role,
          isActive: values.isActive,
          canAccessFinance: values.canAccessFinance,
          phone: values.phone,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Kullanici olusturulamadi')
      }

      setUsers(prev => sortUsers([...prev, payload.user as ManagedUser]))
      setCreating(false)
      toast.success('Kullanici olusturuldu')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kullanici olusturulamadi'
      toast.error(message)
    } finally {
      setPendingKey(null)
    }
  }

  const handleUpdateUser = async (values: UserFormValues) => {
    if (!editingUser) return

    setPendingKey(editingUser.id)

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUser.id,
          fullName: values.fullName,
          role: values.role,
          isActive: values.isActive,
          canAccessFinance: values.canAccessFinance,
          phone: values.phone,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Kullanici guncellenemedi')
      }

      setUsers(prev =>
        sortUsers(
          prev.map(item => (item.id === editingUser.id ? (payload.user as ManagedUser) : item))
        )
      )
      setEditingUser(null)
      toast.success('Kullanici guncellendi')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kullanici guncellenemedi'
      toast.error(message)
    } finally {
      setPendingKey(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-muted-foreground">
            Kullanıcı oluştur, rol ve erişimlerini düzenle, hesapları aktif veya pasif tut.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <div className="w-full md:w-72">
            <Input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Ad veya e-posta ara..."
            />
          </div>
          <Button className="gap-2" onClick={() => setCreating(true)}>
            <UserPlus className="h-4 w-4" />
            Yeni Kullanıcı
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Aktif Kullanıcı</p>
            <p className="mt-1 text-xl font-semibold">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Admin Kullanıcı</p>
            <p className="mt-1 text-xl font-semibold">{adminCount}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Finans Erişimi</p>
              <p className="text-sm font-medium">{financeEnabledCount} kullanıcıda finans erişimi açık.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Kullanıcılar ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Finans</TableHead>
                <TableHead>Katılım</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Arama kriterine uyan kullanıcı bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => {
                  const isCurrentUser = user.id === currentUserId
                  const isPending = pendingKey === user.id

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-normal">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getDisplayName(user)}</span>
                          {isCurrentUser && <Badge variant="secondary">Sen</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-normal text-muted-foreground">
                        {user.email ?? '-'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {user.phone ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                          {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'secondary' : 'destructive'}>
                          {user.is_active ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.can_access_finance ? 'default' : 'outline'}>
                          {user.can_access_finance ? 'Finans Açık' : 'Finans Kapalı'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatJoinDate(user.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => setEditingUser(user)}
                        >
                          {isPending ? 'Kaydediliyor...' : 'Düzenle'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-muted/50 py-4">
        <CardContent className="flex items-center gap-3 px-4">
          <ShieldUser className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Not</p>
            <p className="text-sm text-muted-foreground">
              Güvenlik için kendi admin rolünü kaldıramaz veya hesabını pasifleştiremezsin.
            </p>
          </div>
        </CardContent>
      </Card>

      {creating && (
        <UserDialog
          currentUserId={currentUserId}
          key="create-user"
          mode="create"
          onClose={() => setCreating(false)}
          onSubmit={handleCreateUser}
          pending={pendingKey === 'create'}
        />
      )}

      {editingUser && (
        <UserDialog
          currentUserId={currentUserId}
          key={editingUser.id}
          mode="edit"
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSubmit={handleUpdateUser}
          pending={pendingKey === editingUser.id}
        />
      )}
    </div>
  )
}
