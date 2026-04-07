import { createClient } from '@/lib/supabase-server'
import { UserManagementTable, type ManagedUser } from '@/components/users/UserManagementTable'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

async function getPageData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('id, can_access_finance')
    .eq('id', user.id)
    .single()

  if (!currentProfile?.can_access_finance) {
    return {
      currentUserId: user.id,
      allowed: false,
      users: [] as ManagedUser[],
    }
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, can_access_finance, created_at')
    .order('full_name', { ascending: true })

  return {
    currentUserId: user.id,
    allowed: true,
    users: (users ?? []) as ManagedUser[],
  }
}

export default async function UsersPage() {
  const { currentUserId, allowed, users } = await getPageData()

  if (!allowed) {
    return (
      <div className="flex min-h-full items-center justify-center py-24">
        <Card className="max-w-md">
          <CardContent className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ShieldAlert className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Kullanıcı Yönetimi Kapalı</h1>
              <p className="text-sm text-muted-foreground">
                Bu ekranı görüntülemek için finans erişim yetkisi gerekiyor.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard&apos;a Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <UserManagementTable initialUsers={users} currentUserId={currentUserId} />
}
