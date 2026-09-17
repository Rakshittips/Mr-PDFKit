'use client'

/**
 * Client-side PDF rendering engine powered by PDF.js
 * Works across all browsers including mobile Chrome/Safari without external plugins.
 */

// We use dynamic import so SSR never tries to evaluate canvas/DOM APIs
let pdfjsCache: any = null

export async function getPdfJs() {
  if (typeof window === 'undefined') return null
  if (pdfjsCache) return pdfjsCache

  try {
    const pdfjs = await import('pdfjs-dist/build/pdf.js')
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      // Use locally hosted worker, with fallback to unpkg CDN if needed
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    }
    pdfjsCache = pdfjs
    return pdfjs
  } catch (err) {
    console.error('Failed to load pdfjs-dist:', err)
    throw err
  }
}

export interface RenderPageOptions {
  canvas: HTMLCanvasElement
  pageNumber: number // 1-based
  scale: number // e.g. 1.0 = 100%
  rotation?: number // extra rotation 0, 90, 180, 270
}

export interface LoadedPdfDoc {
  pdfJsDoc: any
  pageCount: number
  getPageDimensions: (pageNumber: number) => Promise<{ width: number; height: number }>
  renderPage: (options: RenderPageOptions) => Promise<{ width: number; height: number }>
  generateThumbnailUrl: (pageNumber: number, maxThumbDim?: number) => Promise<string>
  destroy: () => void
}

export async function loadPdfForViewer(buffer: Uint8Array): Promise<LoadedPdfDoc> {
  const pdfjs = await getPdfJs()
  if (!pdfjs) {
    throw new Error('PDF.js could not be initialized in this environment.')
  }

  // Create copy of Uint8Array buffer so PDF.js doesn't detach caller's buffer
  const copyBuffer = new Uint8Array(buffer.slice(0))
  const loadingTask = pdfjs.getDocument({
    data: copyBuffer,
    cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  })

  const pdfJsDoc = await loadingTask.promise
  const pageCount = pdfJsDoc.numPages

  const getPageDimensions = async (pageNumber: number) => {
    const page = await pdfJsDoc.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1.0 })
    return { width: viewport.width, height: viewport.height }
  }

  const renderPage = async ({
    canvas,
    pageNumber,
    scale,
    rotation = 0,
  }: RenderPageOptions): Promise<{ width: number; height: number }> => {
    const page = await pdfJsDoc.getPage(pageNumber)
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    // Total rotation is inherent page rotation + user rotation
    const viewport = page.getViewport({
      scale: scale * dpr,
      rotation: (page.rotate + rotation) % 360,
    })

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Could not get 2D canvas context')

    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    canvas.style.width = `${Math.floor(viewport.width / dpr)}px`
    canvas.style.height = `${Math.floor(viewport.height / dpr)}px`

    // Fill with crisp white background before rendering
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    }

    const renderTask = page.render(renderContext)
    await renderTask.promise

    return {
      width: Math.floor(viewport.width / dpr),
      height: Math.floor(viewport.height / dpr),
    }
  }

  const generateThumbnailUrl = async (pageNumber: number, maxThumbDim = 200): Promise<string> => {
    const page = await pdfJsDoc.getPage(pageNumber)
    const initialViewport = page.getViewport({ scale: 1.0 })
    const longest = Math.max(initialViewport.width, initialViewport.height)
    const scale = maxThumbDim / longest

    const viewport = page.getViewport({ scale, rotation: page.rotate % 360 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return ''

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise

    return canvas.toDataURL('image/jpeg', 0.8)
  }

  const destroy = () => {
    try {
      pdfJsDoc.destroy?.()
    } catch {
      // ignore
    }
  }

  return {
    pdfJsDoc,
    pageCount,
    getPageDimensions,
    renderPage,
    generateThumbnailUrl,
    destroy,
  }
}
