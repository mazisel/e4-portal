export interface SmsOptions {
  phone: string
  message: string
}

const ERROR_CODES: Record<string, string> = {
  '20': 'Mesaj metni boş',
  '30': 'Geçersiz kullanıcı adı veya şifre',
  '40': 'Mesaj başlığı (msgheader) hatalı',
  '50': 'Abone numarası hatalı',
  '60': 'Bakiye yetersiz',
  '70': 'Bilinmeyen hata',
  '80': 'Gönderim tarihi hatalı',
  '85': 'Mesaj başlığı tanımlı değil',
}

export async function sendSms(options: SmsOptions) {
  const usercode = process.env.NETGSM_USERCODE
  const password = process.env.NETGSM_PASSWORD
  const msgheader = process.env.NETGSM_MSGHEADER

  if (!usercode || !password || !msgheader) {
    throw new Error('NetGSM ayarları yapılandırılmamış (NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER)')
  }

  let normalized = options.phone.replace(/\s+/g, '').replace(/^\+/, '')
  if (normalized.startsWith('0')) {
    normalized = '90' + normalized.substring(1)
  } else if (!normalized.startsWith('90')) {
    normalized = '90' + normalized
  }

  const params = new URLSearchParams({
    usercode,
    password,
    gsmno: normalized,
    message: options.message,
    msgheader,
  })

  const res = await fetch(`https://api.netgsm.com.tr/sms/send/get?${params.toString()}`)
  const text = (await res.text()).trim()

  const parts = text.split(' ')
  const code = parts[0]

  if (code === '00') {
    return { success: true, jobId: parts[1] ?? null }
  }

  const errorMessage = ERROR_CODES[code] ?? `NetGSM hata (kod: ${code})`
  throw new Error(errorMessage)
}
