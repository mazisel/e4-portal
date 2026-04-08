import { createClient } from '@/lib/supabase-server'
import { normalizeProfileRecord } from '@/lib/profile-utils'
import { UserManagementTable, type ManagedUser } from '@/components/users/UserManagementTable'
import { TelegramGroupSettings } from '@/components/users/TelegramGroupSettings'
import { Card, CardContent } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

function normalizeManagedUser(record: Record<string, unknown>): ManagedUser {
  const profile = normalizeProfileRecord(record)

  return {
    id: String(record.id),
    full_name: typeof record.full_name === 'string' ? record.full_name : profile?.full_name ?? null,
    email: typeof record.email === 'string' ? record.email : profile?.email ?? null,
    can_access_finance: profile?.can_access_finance ?? false,
    role: profile?.role ?? 'user',
    is_active: profile?.is_active ?? true,
    created_at: typeof record.created_at === 'string' ? record.created_at : '',
  }
}

async function getPageData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentProfileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const currentProfile = normalizeProfileRecord(currentProfileData)

  if (!currentProfile || currentProfile.role !== 'admin') {
    return {
      currentUserId: user.id,
      allowed: false,
      users: [] as ManagedUser[],
      telegramGroupChatId: null as string | null,
    }
  }

  const [{ data: users }, { data: settings }] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name', { ascending: true }),
    supabase.from('app_settings').select('telegram_group_chat_id').eq('id', 1).single(),
  ])

  return {
    currentUserId: user.id,
    allowed: true,
    users: (users ?? []).map(userRecord => normalizeManagedUser(userRecord as Record<string, unknown>)),
    telegramGroupChatId: (settings?.telegram_group_chat_id as string | null) ?? null,
  }
}

export default async function UsersPage() {
  const { currentUserId, allowed, users, telegramGroupChatId } = await getPageData()

  if (!allowed) {
    return (
      <div className="flex min-h-full items-center justify-center py-24">
        <Card className="max-w-md">
          <CardContent className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ShieldAlert className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">Yönetici Yetkisi Gerekiyor</h1>
              <p className="text-sm text-muted-foreground">
                Kullanıcı yönetimi modülünü yalnızca admin rolündeki kullanıcılar açabilir.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/home">Ana Sayfaya Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <UserManagementTable initialUsers={users} currentUserId={currentUserId} />
      <TelegramGroupSettings initialChatId={telegramGroupChatId} />
    </div>
  )
}
