/**
 * Twilio WhatsApp Servisi
 * Bu servis, hem API rotalarından hem de arka plan (cron/scheduler) işlemlerinden 
 * WhatsApp mesajı göndermek için kullanılır.
 */

export interface WhatsappOptions {
  phone: string
  message: string
  variables?: Record<string, string>
}

export async function sendWhatsappMessage(options: WhatsappOptions) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER
  const contentSid = process.env.TWILIO_CONTENT_SID

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio ayarları yapılandırılmamış (.env dosyasına eklenmeli)')
  }

  // Numarayı normalize et (whatsapp:+905...)
  let normalized = options.phone.replace(/\s+/g, '').replace(/^\+/, '')
  if (normalized.startsWith('0')) {
    normalized = '90' + normalized.substring(1)
  } else if (!normalized.startsWith('90')) {
    normalized = '90' + normalized
  }

  const twilioTo = `whatsapp:+${normalized}`
  const twilioFrom = `whatsapp:${fromNumber}`

  // Twilio REST API çağrısı
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const params = new URLSearchParams()
  params.append('To', twilioTo)
  params.append('From', twilioFrom)

  // Eğer Content SID tanımlandıysa (şablon için)
  if (contentSid && options.variables) {
    params.append('ContentSid', contentSid)
    params.append('ContentVariables', JSON.stringify(options.variables))
  } else {
    params.append('Body', options.message)
  }

  const res = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    },
    body: params.toString()
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('Twilio Error:', data)
    throw new Error(`Twilio hata (${data.code}): ${data.message || 'Bilinmeyen hata'}`)
  }

  return { success: true, sid: data.sid }
}
