import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function isPrivateIp(hostname: string): boolean {
  // Reject localhost and local IP ranges to prevent SSRF
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  ) {
    return true
  }

  // Check IPv4 private blocks
  const parts = hostname.split('.').map(Number)
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    if (parts[0] === 10) return true
    if (parts[0] === 127) return true
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true
    if (parts[0] === 192 && parts[1] === 168) return true
    if (parts[0] === 169 && parts[1] === 254) return true // Link-local
    if (parts[0] === 0) return true
  }

  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'A valid URL is required.' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format. Please include http:// or https://' }, { status: 400 })
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: 'Only http and https protocols are supported.' }, { status: 400 })
    }

    if (isPrivateIp(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Access to private or local network addresses is restricted.' }, { status: 403 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 MrPDFKit/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Remote website responded with HTTP ${response.status} ${response.statusText}` },
        { status: 502 }
      )
    }

    let html = await response.text()

    // Extract title
    let title = parsedUrl.hostname
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim()
    }

    // Strip script tags to avoid executing third-party scripts during rendering
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

    // Ensure <base href="..."> is present so relative images and CSS load from origin
    const baseHref = parsedUrl.origin + parsedUrl.pathname.substring(0, parsedUrl.pathname.lastIndexOf('/') + 1)
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head><base href="${baseHref}">`)
    } else if (html.includes('<head ')) {
      html = html.replace(/<head[^>]*>/, `$&<base href="${baseHref}">`)
    } else {
      html = `<base href="${baseHref}">` + html
    }

    return NextResponse.json({
      success: true,
      html,
      title,
      url: parsedUrl.toString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error occurred while fetching the website'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
