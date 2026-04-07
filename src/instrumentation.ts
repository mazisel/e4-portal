export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  const { startActivityReminderScheduler } = await import('@/lib/activity-reminder')
  startActivityReminderScheduler()
}
