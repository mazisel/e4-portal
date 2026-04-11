import { NextRequest, NextResponse } from 'next/server'

/**
 * Storage Proxy Route
 * /storage/... ile başlayan tüm istekleri yakalar ve arka planda 
 * Supabase Storage'dan dosyayı çekerek müşteriye sunar.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  
  if (!path || path.length === 0) {
    return new NextResponse('Dosya yolu bulunamadı', { status: 400 })
  }

  // Supabase URL'sini .env'den al veya fallback kullan
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://xzwgnmzuyaukseypwdgh.supabase.co'
  
  // Tam yolu inşa et: /storage/v1/object/public/receipts/...
  // Path dizisini tekrar birleştiriyoruz
  const filePath = path.join('/')
  const targetUrl = `${supabaseUrl}/storage/${filePath}${request.nextUrl.search}`

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      // Cache vs. ayarları eklenebilir
      next: { revalidate: 3600 } 
    })

    if (!response.ok) {
      console.error(`Storage Proxy Error: ${response.status} for ${targetUrl}`)
      return new NextResponse('Dosya yüklenirken hata oluştu', { status: response.status })
    }

    // Orijinal dosyanın içeriğini (blob) al
    const blob = await response.blob()

    // Orijinal header'ları koru (özellikle Content-Type: application/pdf)
    const headers = new Headers()
    const contentType = response.headers.get('Content-Type')
    if (contentType) headers.set('Content-Type', contentType)
    
    const contentDisposition = response.headers.get('Content-Disposition')
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition)

    return new NextResponse(blob, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Storage Proxy Fetch Exception:', error)
    return new NextResponse('Sunucu hatası', { status: 500 })
  }
}
