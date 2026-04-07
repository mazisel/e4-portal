'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShieldCheck, Users } from 'lucide-react'
import { toast } from 'sonner'

export interface ManagedUser {
  id: string
  full_name: string | null
  email: string | null
  can_access_finance: boolean
  created_at: string
}

interface UserManagementTableProps {
  initialUsers: ManagedUser[]
  currentUserId: string
}

function getDisplayName(user: ManagedUser) {
  if (user.full_name?.trim()) return user.full_name.trim()
  if (user.email?.trim()) return user.email.trim().split('@')[0]
  return 'Isimsiz Kullanici'
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

export function UserManagementTable({ initialUsers, currentUserId }: UserManagementTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [query, setQuery] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr-TR')
    if (!term) return users

    return users.filter(user => {
      const searchable = `${getDisplayName(user)} ${user.email ?? ''}`.toLocaleLowerCase('tr-TR')
      return searchable.includes(term)
    })
  }, [query, users])

  const financeEnabledCount = useMemo(
    () => users.filter(user => user.can_access_finance).length,
    [users]
  )

  const handlePermissionToggle = async (user: ManagedUser) => {
    if (pendingId) return

    const nextAccess = !user.can_access_finance
    setPendingId(user.id)

    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          canAccessFinance: nextAccess,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Kullanici guncellenemedi')
      }

      setUsers(prev =>
        prev.map(item =>
          item.id === user.id
            ? { ...item, can_access_finance: payload.user.can_access_finance as boolean }
            : item
        )
      )

      toast.success(nextAccess ? 'Finans erisimi acildi' : 'Finans erisimi kapatildi')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kullanici guncellenemedi'
      toast.error(message)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-muted-foreground">
            Portal kullanıcılarını görüntüleyin ve finans erişim yetkilerini yönetin.
          </p>
        </div>
        <div className="w-full md:w-72">
          <Input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Ad veya e-posta ara..."
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Toplam Kullanıcı</p>
            <p className="mt-1 text-xl font-semibold">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Finans Erişimi Olan</p>
            <p className="mt-1 text-xl font-semibold">{financeEnabledCount}</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20 bg-primary/5 py-4">
          <CardContent className="flex items-center gap-3 px-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Not</p>
              <p className="text-sm font-medium">Kendi finans yetkini bu ekrandan kapatamazsın.</p>
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
                <TableHead>Katılım</TableHead>
                <TableHead>Yetki</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Arama kriterine uyan kullanıcı bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => {
                  const isCurrentUser = user.id === currentUserId
                  const isPending = pendingId === user.id

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
                      <TableCell>{formatJoinDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={user.can_access_finance ? 'default' : 'outline'}>
                          {user.can_access_finance ? 'Finans Açık' : 'Finans Kapalı'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={user.can_access_finance ? 'outline' : 'default'}
                          disabled={isCurrentUser || isPending}
                          onClick={() => handlePermissionToggle(user)}
                        >
                          {isPending
                            ? 'Kaydediliyor...'
                            : user.can_access_finance
                              ? 'Finansı Kapat'
                              : 'Finansı Aç'}
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
    </div>
  )
}
