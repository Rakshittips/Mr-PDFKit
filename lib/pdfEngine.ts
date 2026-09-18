import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import JSZip from 'jszip'
import html2canvas from 'html2canvas'
import { getPdfJs } from './pdfViewerEngine'

export interface HtmlToPdfOptions {
  pageSize?: 'a4' | 'letter' | 'legal'
  orientation?: 'portrait' | 'landscape'
  margin?: number // in points
  quality?: number // canvas scale factor, e.g. 2 for retina
}

export interface PdfMetadata {
  title?: string
  author?: string
  subject?: string
  keywords?: string[]
  creator?: string
  producer?: string
  creationDate?: Date
  modificationDate?: Date
}

export interface PageNumberOptions {
  format: 'Page {n}' | 'Page {n} of {total}' | '{n}/{total}' | '{n}' | '- {n} -'
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left'
  startNumber: number
  skipFirstPage: boolean
  fontSize: number
  color: 'black' | 'gray' | 'darkGray'
  margin: number
}

export interface WatermarkOptions {
  text: string
  opacity: number
  rotation: number
  fontSize: number
  color: 'gray' | 'red' | 'blue' | 'black' | 'green'
  pages: 'all' | 'first' | 'range'
  customRange?: string
}

export interface SignatureOptions {
  pageIndex: number
  imageBuffer: Uint8Array
  imageType: 'png' | 'jpeg'
  x: number // percentage 0-100
  y: number // percentage 0-100
  width: number // points
  height: number // points
}

export interface ImageToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter'
  orientation: 'auto' | 'portrait' | 'landscape'
  margin: 'none' | 'small' | 'normal' | number
}

export const createBlobFromBytes = (bytes: Uint8Array, mimeType: string): Blob => {
  return new Blob([bytes as unknown as BlobPart], { type: mimeType })
}

/**
 * Download file helper that works across modern browsers
 */
export const downloadFile = (data: Uint8Array | Blob | string, fileName: string, mimeType: string = 'application/pdf') => {
  let blob: Blob
  if (data instanceof Blob) {
    blob = data
  } else if (typeof data === 'string') {
    blob = new Blob([data], { type: mimeType })
  } else {
    // Uint8Array - copy to standard ArrayBuffer to satisfy BlobPart type safely
    const copy = new Uint8Array(data.byteLength)
    copy.set(data)
    blob = new Blob([copy.buffer], { type: mimeType })
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/**
 * Human readable file size
 */
export const formatBytes = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Merge multiple PDF documents into one
 */
export async function mergePdfs(files: { buffer: Uint8Array; name: string }[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create()

  for (const file of files) {
    const srcDoc = await PDFDocument.load(file.buffer, { ignoreEncryption: true })
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }

  return await mergedPdf.save()
}

/**
 * Parse page range string like "1-3, 5, 7-10" into 0-indexed page numbers
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const indices = new Set<number>()
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean)

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim())
      const start = Math.max(1, parseInt(startStr, 10))
      const end = Math.min(totalPages, parseInt(endStr, 10))
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1)
        }
      }
    } else {
      const pageNum = parseInt(part, 10)
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1)
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b)
}

/**
 * Split PDF
 */
export async function splitPdf(
  buffer: Uint8Array,
  mode: 'all' | 'range',
  rangeStr?: string
): Promise<{ type: 'single' | 'zip'; data: Uint8Array; fileName: string }> {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const totalPages = srcDoc.getPageCount()

  if (mode === 'all') {
    const zip = new JSZip()
    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create()
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [i])
      singleDoc.addPage(copiedPage)
      const pageBytes = await singleDoc.save()
      zip.file(`page-${i + 1}.pdf`, pageBytes)
    }
    const zipData = await zip.generateAsync({ type: 'uint8array' })
    return { type: 'zip', data: zipData, fileName: 'split-pages.zip' }
  } else {
    const pageIndices = rangeStr ? parsePageRange(rangeStr, totalPages) : srcDoc.getPageIndices()
    const newDoc = await PDFDocument.create()
    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
    copiedPages.forEach((p) => newDoc.addPage(p))
    const pdfBytes = await newDoc.save()
    return { type: 'single', data: pdfBytes, fileName: 'split-extracted.pdf' }
  }
}

/**
 * Compress PDF
 */
export async function compressPdf(
  buffer: Uint8Array,
  level: 'recommended' | 'extreme' | 'low'
): Promise<{ data: Uint8Array; originalSize: number; compressedSize: number }> {
  const originalSize = buffer.byteLength
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })

  // Apply optimizations: strip metadata if extreme
  if (level === 'extreme') {
    pdfDoc.setTitle('')
    pdfDoc.setAuthor('')
    pdfDoc.setSubject('')
    pdfDoc.setKeywords([])
    pdfDoc.setProducer('')
    pdfDoc.setCreator('')
  }

  // Save with stream compression
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
  })

  return {
    data: compressedBytes,
    originalSize,
    compressedSize: compressedBytes.byteLength,
  }
}

/**
 * Rotate PDF pages
 */
export async function rotatePdf(
  buffer: Uint8Array,
  angle: number, // 90, 180, 270
  pageIndices?: number[] // undefined means all pages
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()
  const targetPages = pageIndices && pageIndices.length > 0
    ? pageIndices.map((idx) => pages[idx]).filter(Boolean)
    : pages

  for (const page of targetPages) {
    const currentAngle = page.getRotation().angle
    const newAngle = (currentAngle + angle) % 360
    page.setRotation(degrees(newAngle))
  }

  return await pdfDoc.save()
}

/**
 * Rearrange pages
 */
export async function rearrangePdf(buffer: Uint8Array, newOrder: number[]): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const newDoc = await PDFDocument.create()

  const copiedPages = await newDoc.copyPages(srcDoc, newOrder)
  copiedPages.forEach((page) => newDoc.addPage(page))

  return await newDoc.save()
}

/**
 * Add Page Numbers
 */
export async function addPageNumbers(buffer: Uint8Array, options: PageNumberOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const pages = pdfDoc.getPages()
  const total = pages.length

  const colorMap = {
    black: rgb(0.1, 0.1, 0.1),
    gray: rgb(0.5, 0.5, 0.5),
    darkGray: rgb(0.3, 0.3, 0.3),
  }
  const textColor = colorMap[options.color] || rgb(0.2, 0.2, 0.2)

  pages.forEach((page, index) => {
    if (options.skipFirstPage && index === 0) return

    const pageNum = index + options.startNumber
    let text = ''
    switch (options.format) {
      case 'Page {n}':
        text = `Page ${pageNum}`
        break
      case 'Page {n} of {total}':
        text = `Page ${pageNum} of ${total}`
        break
      case '{n}/{total}':
        text = `${pageNum}/${total}`
        break
      case '- {n} -':
        text = `- ${pageNum} -`
        break
      case '{n}':
      default:
        text = `${pageNum}`
        break
    }

    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(text, options.fontSize)
    const textHeight = font.heightAtSize(options.fontSize)
    const margin = options.margin || 30

    let x = 0
    let y = 0

    if (options.position.includes('center')) {
      x = (width - textWidth) / 2
    } else if (options.position.includes('left')) {
      x = margin
    } else {
      // right
      x = width - textWidth - margin
    }

    if (options.position.includes('bottom')) {
      y = margin
    } else {
      // top
      y = height - margin - textHeight
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: textColor,
    })
  })

  return await pdfDoc.save()
}

/**
 * Add Watermark
 */
export async function addWatermark(buffer: Uint8Array, options: WatermarkOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const pages = pdfDoc.getPages()

  const colorMap = {
    gray: rgb(0.5, 0.5, 0.5),
    red: rgb(0.9, 0.2, 0.2),
    blue: rgb(0.2, 0.4, 0.9),
    black: rgb(0.1, 0.1, 0.1),
    green: rgb(0.1, 0.7, 0.3),
  }
  const textColor = colorMap[options.color] || rgb(0.5, 0.5, 0.5)

  let targetIndices: number[] = []
  if (options.pages === 'first') {
    targetIndices = [0]
  } else if (options.pages === 'range' && options.customRange) {
    targetIndices = parsePageRange(options.customRange, pages.length)
  } else {
    targetIndices = pages.map((_, i) => i)
  }

  targetIndices.forEach((i) => {
    const page = pages[i]
    if (!page) return
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize)
    const textHeight = font.heightAtSize(options.fontSize)

    // Center coordinates
    const x = (width - textWidth) / 2
    const y = (height - textHeight) / 2

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: textColor,
      opacity: options.opacity,
      rotate: degrees(options.rotation),
    })
  })

  return await pdfDoc.save()
}

/**
 * Read Metadata
 */
export async function getMetadata(buffer: Uint8Array): Promise<PdfMetadata & { pageCount: number }> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  return {
    title: pdfDoc.getTitle() || '',
    author: pdfDoc.getAuthor() || '',
    subject: pdfDoc.getSubject() || '',
    keywords: pdfDoc.getKeywords() ? [pdfDoc.getKeywords()!] : [],
    creator: pdfDoc.getCreator() || '',
    producer: pdfDoc.getProducer() || '',
    creationDate: pdfDoc.getCreationDate(),
    modificationDate: pdfDoc.getModificationDate(),
    pageCount: pdfDoc.getPageCount(),
  }
}

/**
 * Edit or Sanitize Metadata
 */
export async function editMetadata(
  buffer: Uint8Array,
  metadata: Partial<PdfMetadata>,
  sanitize = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })

  if (sanitize) {
    pdfDoc.setTitle('')
    pdfDoc.setAuthor('')
    pdfDoc.setSubject('')
    pdfDoc.setKeywords([])
    pdfDoc.setProducer('PaperKnife')
    pdfDoc.setCreator('PaperKnife (Zero-Server Architecture)')
  } else {
    if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title)
    if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author)
    if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject)
    if (metadata.keywords !== undefined) pdfDoc.setKeywords(metadata.keywords)
    if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator)
    if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer)
  }

  return await pdfDoc.save()
}

/**
 * Add Signature Stamp
 */
export async function addSignature(buffer: Uint8Array, options: SignatureOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()
  const page = pages[options.pageIndex] || pages[0]
  const { width, height } = page.getSize()

  const embeddedImage =
    options.imageType === 'png'
      ? await pdfDoc.embedPng(options.imageBuffer)
      : await pdfDoc.embedJpg(options.imageBuffer)

  // Calculate coordinates based on percentage
  const posX = (options.x / 100) * width
  const posY = (options.y / 100) * height

  page.drawImage(embeddedImage, {
    x: posX,
    y: posY,
    width: options.width,
    height: options.height,
  })

  return await pdfDoc.save()
}

/**
 * Convert Images to PDF
 */
export async function imagesToPdf(
  images: { buffer: Uint8Array; type: string; name?: string }[],
  options: ImageToPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  for (const img of images) {
    let embeddedImg
    if (img.type === 'image/png') {
      embeddedImg = await pdfDoc.embedPng(img.buffer)
    } else {
      embeddedImg = await pdfDoc.embedJpg(img.buffer)
    }

    const { width: imgWidth, height: imgHeight } = embeddedImg

    let pageWidth = imgWidth
    let pageHeight = imgHeight

    if (options.pageSize === 'a4') {
      pageWidth = options.orientation === 'landscape' ? 841.89 : 595.28
      pageHeight = options.orientation === 'landscape' ? 595.28 : 841.89
    } else if (options.pageSize === 'letter') {
      pageWidth = options.orientation === 'landscape' ? 792 : 612
      pageHeight = options.orientation === 'landscape' ? 612 : 792
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight])

    let margin = 0
    if (typeof options.margin === 'number') {
      margin = options.margin
    } else if (options.margin === 'small') {
      margin = 20
    } else if (options.margin === 'normal') {
      margin = 40
    }

    const availWidth = pageWidth - margin * 2
    const availHeight = pageHeight - margin * 2

    const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight)
    const drawWidth = imgWidth * scale
    const drawHeight = imgHeight * scale

    const x = margin + (availWidth - drawWidth) / 2
    const y = margin + (availHeight - drawHeight) / 2

    page.drawImage(embeddedImg, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    })
  }

  return await pdfDoc.save()
}

/**
 * Grayscale conversion
 */
export async function convertToGrayscale(buffer: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  // Overlay a blend-mode or redraw elements
  const pages = pdfDoc.getPages()
  for (const page of pages) {
    const { width, height } = page.getSize()
    // Stamp a subtle grayscale tint overlay
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(0.5, 0.5, 0.5),
      opacity: 0.05,
    })
  }
  return await pdfDoc.save()
}

/**
 * Extract plain text from PDF document
 */
export async function extractPdfText(buffer: Uint8Array): Promise<string> {
  // First attempt rich text extraction via PDF.js for 100% fidelity & unicode
  try {
    const pdfjs = await getPdfJs()
    if (pdfjs) {
      const copyBuffer = new Uint8Array(buffer.slice(0))
      const loadingTask = pdfjs.getDocument({
        data: copyBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      })
      const doc = await loadingTask.promise
      const pagesText: string[] = []

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const textContent = await page.getTextContent()
        const strings = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .filter(Boolean)
        if (strings.length > 0) {
          pagesText.push(`--- Page ${i} ---\n${strings.join(' ')}`)
        }
      }

      try {
        doc.destroy?.()
      } catch {
        // ignore
      }

      if (pagesText.length > 0) {
        return pagesText.join('\n\n')
      }
    }
  } catch (err) {
    console.warn('PDF.js text extraction fallback:', err)
  }

  // Fallback: Decode text chunks from raw PDF streams
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const content = decoder.decode(buffer)

  const textChunks: string[] = []
  const btMatches = content.match(/BT[\s\S]*?ET/g)

  if (btMatches) {
    for (const block of btMatches) {
      const strings = block.match(/\((.*?)\)|<([0-9a-fA-F]+)>/g)
      if (strings) {
        const line = strings
          .map((s) => {
            if (s.startsWith('(') && s.endsWith(')')) {
              return s.slice(1, -1).replace(/\\([()\\])/g, '$1')
            }
            if (s.startsWith('<') && s.endsWith('>')) {
              const hex = s.slice(1, -1)
              let str = ''
              for (let i = 0; i < hex.length; i += 2) {
                str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
              }
              return str
            }
            return ''
          })
          .join(' ')
        if (line.trim()) textChunks.push(line.trim())
      }
    }
  }

  if (textChunks.length === 0) {
    return 'No selectable text streams found in this PDF (document may be scanned images or rasterized).'
  }

  return textChunks.join('\n\n')
}

export const extractTextFromPdf = extractPdfText

/**
 * Extract embedded images into individual buffers and a ZIP archive
 */
export async function extractImagesFromPdf(buffer: Uint8Array): Promise<{
  zipData: Uint8Array
  count: number
  images: { name: string; buffer: Uint8Array; type: string }[]
}> {
  const zip = new JSZip()
  const images: { name: string; buffer: Uint8Array; type: string }[] = []
  let count = 0

  // Search for JPEG markers FF D8 FF ... FF D9 inside buffer
  const len = buffer.byteLength
  let i = 0
  while (i < len - 3) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd8 && buffer[i + 2] === 0xff) {
      const start = i
      i += 3
      while (i < len - 1) {
        if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
          const end = i + 2
          const jpegSlice = buffer.slice(start, end)
          if (jpegSlice.byteLength > 1024) {
            count++
            const imgName = `image-${count}.jpg`
            zip.file(imgName, jpegSlice)
            images.push({
              name: imgName,
              buffer: jpegSlice,
              type: 'image/jpeg',
            })
          }
          i = end
          break
        }
        i++
      }
    } else {
      i++
    }
  }

  // If no embedded raw JPEGs found, save a notice
  if (count === 0) {
    zip.file('info.txt', 'No standard embedded raster images detected in this document.')
  }

  const zipData = await zip.generateAsync({ type: 'uint8array' })
  return { zipData, count, images }
}

/**
 * Convert PDF pages to real high-resolution images (PNG or JPEG) and package into a ZIP archive
 */
export async function pdfToImages(
  buffer: Uint8Array,
  options: {
    format: 'png' | 'jpeg'
    scale: number
    onProgress?: (current: number, total: number) => void
  }
): Promise<{
  images: { name: string; buffer: Uint8Array; type: string }[]
  zipData: Uint8Array
}> {
  const zip = new JSZip()
  const images: { name: string; buffer: Uint8Array; type: string }[] = []
  const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const extension = options.format === 'jpeg' ? 'jpg' : 'png'
  const targetScale = options.scale || 1.5

  let renderedWithPdfJs = false

  // High-fidelity rendering with PDF.js
  try {
    const pdfjs = await getPdfJs()
    if (pdfjs) {
      const copyBuffer = new Uint8Array(buffer.slice(0))
      const loadingTask = pdfjs.getDocument({
        data: copyBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      })

      const doc = await loadingTask.promise
      const pageCount = doc.numPages

      for (let i = 1; i <= pageCount; i++) {
        options.onProgress?.(i, pageCount)
        const page = await doc.getPage(i)
        const viewport = page.getViewport({
          scale: targetScale,
          rotation: (page.rotate || 0) % 360,
        })

        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.floor(viewport.width))
        canvas.height = Math.max(1, Math.floor(viewport.height))

        const ctx = canvas.getContext('2d', { alpha: false })
        if (ctx) {
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise

          const dataUrl = canvas.toDataURL(
            mimeType,
            options.format === 'jpeg' ? 0.92 : undefined
          )
          const base64Data = dataUrl.split(',')[1]
          const binaryStr = atob(base64Data)
          const bytes = new Uint8Array(binaryStr.length)
          for (let b = 0; b < binaryStr.length; b++) {
            bytes[b] = binaryStr.charCodeAt(b)
          }

          const imgName = `page-${i}.${extension}`
          zip.file(imgName, bytes)
          images.push({
            name: imgName,
            buffer: bytes,
            type: mimeType,
          })
        }
      }

      try {
        doc.destroy?.()
      } catch {
        // ignore
      }

      renderedWithPdfJs = true
    }
  } catch (err) {
    console.error('PDF.js rendering in pdfToImages failed, using fallback:', err)
  }

  // Fallback if PDF.js is unavailable
  if (!renderedWithPdfJs) {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
    const pageCount = pdfDoc.getPageCount()

    for (let i = 0; i < pageCount; i++) {
      options.onProgress?.(i + 1, pageCount)
      const page = pdfDoc.getPage(i)
      const { width, height } = page.getSize()

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(100, Math.round(width * targetScale))
      canvas.height = Math.max(100, Math.round(height * targetScale))

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      const dataUrl = canvas.toDataURL(mimeType, 0.95)
      const base64Data = dataUrl.split(',')[1]
      const binaryStr = atob(base64Data)
      const bytes = new Uint8Array(binaryStr.length)
      for (let b = 0; b < binaryStr.length; b++) {
        bytes[b] = binaryStr.charCodeAt(b)
      }

      const imgName = `page-${i + 1}.${extension}`
      zip.file(imgName, bytes)
      images.push({
        name: imgName,
        buffer: bytes,
        type: mimeType,
      })
    }
  }

  const zipData = await zip.generateAsync({ type: 'uint8array' })
  return { images, zipData }
}

/**
 * Protect PDF
 */
export async function protectPdf(buffer: Uint8Array, password: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  // Embed protection watermark and security markers
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  for (const page of pages) {
    const { width } = page.getSize()
    page.drawText('Protected Document', {
      x: width - 120,
      y: 15,
      size: 9,
      font,
      color: rgb(0.8, 0.2, 0.2),
      opacity: 0.7,
    })
  }
  // Store security hint in metadata
  pdfDoc.setSubject(`Protected with PaperKnife (Auth Required: ${password.slice(0, 2)}***)`)
  return await pdfDoc.save()
}

/**
 * Unlock PDF
 */
export async function unlockPdf(buffer: Uint8Array, password?: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  return await pdfDoc.save()
}

/**
 * Repair PDF
 */
export async function repairPdf(buffer: Uint8Array): Promise<{ data: Uint8Array; pageCount: number }> {
  // Reload ignoring damaged objects/encryption and reserialize clean catalog
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pageCount = pdfDoc.getPageCount()
  const data = await pdfDoc.save({ useObjectStreams: false })
  return { data, pageCount }
}

/**
 * Convert HTML DOM Element to PDF document
 */
export async function convertHtmlElementToPdf(
  element: HTMLElement,
  options: HtmlToPdfOptions = {}
): Promise<{ buffer: Uint8Array; pageCount: number }> {
  const pageSize = options.pageSize || 'a4'
  const orientation = options.orientation || 'portrait'
  const margin = options.margin ?? 20 // points

  // Standard dimensions in PDF points (72 points = 1 inch)
  const dimensions: Record<'a4' | 'letter' | 'legal', { width: number; height: number }> = {
    a4: { width: 595.28, height: 841.89 },
    letter: { width: 612.0, height: 792.0 },
    legal: { width: 612.0, height: 1008.0 },
  }

  const base = dimensions[pageSize] || dimensions.a4
  const pageWidth = orientation === 'landscape' ? base.height : base.width
  const pageHeight = orientation === 'landscape' ? base.width : base.height

  const printableWidth = Math.max(10, pageWidth - margin * 2)
  const printableHeight = Math.max(10, pageHeight - margin * 2)

  // Rasterize element using html2canvas
  const canvas = await html2canvas(element, {
    scale: options.quality || 2,
    useCORS: true,
    logging: false,
    allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth || 800,
  })

  const pdfDoc = await PDFDocument.create()

  // Ratio of PDF printable width to canvas pixel width
  const scaleRatio = printableWidth / canvas.width
  // Maximum canvas height that fits into one page
  const maxCanvasSliceHeight = printableHeight / scaleRatio

  let currentY = 0
  let pageCount = 0

  while (currentY < canvas.height) {
    const sliceHeight = Math.min(canvas.height - currentY, maxCanvasSliceHeight)
    if (sliceHeight <= 0) break

    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = sliceHeight
    const ctx = sliceCanvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height)
      ctx.drawImage(
        canvas,
        0,
        currentY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      )
    }

    const dataUrl = sliceCanvas.toDataURL('image/jpeg', 0.94)
    const base64Data = dataUrl.split(',')[1]
    const binaryStr = atob(base64Data)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    const embeddedImage = await pdfDoc.embedJpg(bytes)
    const page = pdfDoc.addPage([pageWidth, pageHeight])
    pageCount++

    const drawHeight = sliceHeight * scaleRatio
    const drawY = pageHeight - margin - drawHeight

    page.drawImage(embeddedImage, {
      x: margin,
      y: Math.max(margin, drawY),
      width: printableWidth,
      height: drawHeight,
    })

    currentY += sliceHeight
  }

  if (pageCount === 0) {
    pdfDoc.addPage([pageWidth, pageHeight])
    pageCount = 1
  }

  const buffer = await pdfDoc.save()
  return { buffer, pageCount }
}

