'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  BookOpen,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  UploadCloud,
  Layers,
  Scissors,
  Zap,
  RefreshCw,
  Loader2,
  Scan,
  Maximize,
} from 'lucide-react'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import { formatBytes, downloadFile } from '@/lib/pdfEngine'
import { loadPdfForViewer, LoadedPdfDoc } from '@/lib/pdfViewerEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface OpenPdfToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

interface PageThumbInfo {
  pageNumber: number
  width: number
  height: number
  thumbUrl?: string
}

export default function OpenPdfTool({
  initialFile,
  onBack,
  onAddActivity,
  onSendToTool,
}: OpenPdfToolProps) {
  const [file, setFile] = useState<{
    name: string
    size: number
    pageCount: number
    buffer: Uint8Array
  } | null>(null)

  const [pdfDoc, setPdfDoc] = useState<LoadedPdfDoc | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageInput, setPageInput] = useState<string>('1')
  const [scale, setScale] = useState<number>(1.0) // 1.0 = 100%
  const [rotation, setRotation] = useState<number>(0)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [isRendering, setIsRendering] = useState<boolean>(false)
  const [thumbnails, setThumbnails] = useState<PageThumbInfo[]>([])
  const [thumbnailsLoading, setThumbnailsLoading] = useState<boolean>(false)
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'custom'>('width')

  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  // Navigation handlers
  const handleGoToPage = useCallback(
    (page: number) => {
      if (!file) return
      const target = Math.max(1, Math.min(file.pageCount, page))
      setCurrentPage(target)
      setPageInput(String(target))
    },
    [file]
  )

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      handleGoToPage(currentPage - 1)
    }
  }, [currentPage, handleGoToPage])

  const handleNextPage = useCallback(() => {
    if (file && currentPage < file.pageCount) {
      handleGoToPage(currentPage + 1)
    }
  }, [file, currentPage, handleGoToPage])

  const handleZoomIn = useCallback(() => {
    setFitMode('custom')
    setScale((prev) => Math.min(Number((prev + 0.2).toFixed(2)), 3.0))
  }, [])

  const handleZoomOut = useCallback(() => {
    setFitMode('custom')
    setScale((prev) => Math.max(Number((prev - 0.2).toFixed(2)), 0.4))
  }, [])

  const handleResetZoom = useCallback(() => {
    setFitMode('custom')
    setScale(1.0)
  }, [])

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  // Fit to Width calculation
  const handleFitWidth = useCallback(async () => {
    if (!pdfDoc || !stageRef.current) return
    try {
      setFitMode('width')
      const dims = await pdfDoc.getPageDimensions(currentPage)
      const isRotated90or270 = rotation % 180 !== 0
      const pageWidth = isRotated90or270 ? dims.height : dims.width
      const stageWidth = stageRef.current.clientWidth - 32 // padding
      if (stageWidth > 0 && pageWidth > 0) {
        const calculated = Number((stageWidth / pageWidth).toFixed(2))
        setScale(Math.max(0.4, Math.min(2.5, calculated)))
      }
    } catch (err) {
      console.error(err)
    }
  }, [pdfDoc, currentPage, rotation])

  // Fit to Page calculation
  const handleFitPage = useCallback(async () => {
    if (!pdfDoc || !stageRef.current) return
    try {
      setFitMode('page')
      const dims = await pdfDoc.getPageDimensions(currentPage)
      const isRotated90or270 = rotation % 180 !== 0
      const pageWidth = isRotated90or270 ? dims.height : dims.width
      const pageHeight = isRotated90or270 ? dims.width : dims.height
      const stageWidth = stageRef.current.clientWidth - 32
      const stageHeight = stageRef.current.clientHeight - 48
      if (stageWidth > 0 && stageHeight > 0 && pageWidth > 0 && pageHeight > 0) {
        const scaleW = stageWidth / pageWidth
        const scaleH = stageHeight / pageHeight
        const calculated = Number(Math.min(scaleW, scaleH).toFixed(2))
        setScale(Math.max(0.4, Math.min(2.0, calculated)))
      }
    } catch (err) {
      console.error(err)
    }
  }, [pdfDoc, currentPage, rotation])

  // Render current page onto canvas whenever doc, page, scale, or rotation changes
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return
    let isCancelled = false

    const render = async () => {
      setIsRendering(true)
      try {
        if (!canvasRef.current) return
        await pdfDoc.renderPage({
          canvas: canvasRef.current,
          pageNumber: currentPage,
          scale,
          rotation,
        })
      } catch (err) {
        if (!isCancelled) {
          console.error('Page render error:', err)
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false)
        }
      }
    }

    void render()

    return () => {
      isCancelled = true
    }
  }, [pdfDoc, currentPage, scale, rotation])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      if (!file) return

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        handleNextPage()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        handlePrevPage()
      } else if (e.key === 'Home') {
        e.preventDefault()
        handleGoToPage(1)
      } else if (e.key === 'End') {
        e.preventDefault()
        handleGoToPage(file.pageCount)
      } else if (e.key === '+' || e.key === '=') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleZoomIn()
        }
      } else if (e.key === '-' || e.key === '_') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          handleZoomOut()
        }
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleResetZoom()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [file, handleNextPage, handlePrevPage, handleGoToPage, handleZoomIn, handleZoomOut, handleResetZoom])

  // Touch Swipe for mobile page switching
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX
      touchStartYRef.current = e.touches[0].clientY
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const diffX = touchEndX - touchStartXRef.current
    const diffY = touchEndY - touchStartYRef.current

    // Detect horizontal swipe if larger than vertical movement and > 50px
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diffX < 0) {
        // Swipe Left -> Next
        handleNextPage()
      } else {
        // Swipe Right -> Prev
        handlePrevPage()
      }
    }

    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  // Generate real thumbnail previews in background
  const generateThumbnails = useCallback(async (loadedDoc: LoadedPdfDoc, total: number) => {
    setThumbnailsLoading(true)
    const limit = Math.min(total, 35) // generate previews up to 35 pages
    for (let i = 1; i <= limit; i++) {
      try {
        const thumbUrl = await loadedDoc.generateThumbnailUrl(i, 180)
        setThumbnails((prev) =>
          prev.map((t) => (t.pageNumber === i ? { ...t, thumbUrl } : t))
        )
      } catch {
        // ignore single preview error
      }
    }
    setThumbnailsLoading(false)
  }, [])

  // Process a loaded buffer
  const handleBuffer = useCallback(
    async (buffer: Uint8Array, name: string) => {
      try {
        setIsRendering(true)
        if (pdfDoc) {
          pdfDoc.destroy()
        }

        const loaded = await loadPdfForViewer(buffer)
        setPdfDoc(loaded)
        setFile({
          name,
          size: buffer.byteLength,
          pageCount: loaded.pageCount,
          buffer,
        })
        setCurrentPage(1)
        setPageInput('1')
        setRotation(0)

        // Build thumbnail place metadata
        const thumbs: PageThumbInfo[] = []
        for (let i = 1; i <= loaded.pageCount; i++) {
          try {
            const dims = await loaded.getPageDimensions(i)
            thumbs.push({ pageNumber: i, width: dims.width, height: dims.height })
          } catch {
            thumbs.push({ pageNumber: i, width: 595, height: 842 })
          }
        }
        setThumbnails(thumbs)

        // Default scale: on mobile or small screen default to fit width
        if (typeof window !== 'undefined') {
          const isMobile = window.innerWidth < 768
          if (isMobile) {
            setSidebarOpen(false)
            // Calculate scale based on screen width
            const firstDims = thumbs[0] || { width: 595 }
            const availableW = window.innerWidth - 32
            const initialScale = Number((availableW / firstDims.width).toFixed(2))
            setScale(Math.max(0.4, Math.min(1.5, initialScale)))
            setFitMode('width')
          } else {
            setSidebarOpen(true)
            setScale(1.0)
            setFitMode('custom')
          }
        }

        // Log activity safely
        onAddActivity?.({
          tool: 'Open PDF',
          fileName: name,
          timestamp: Date.now(),
          size: buffer.byteLength,
        })

        // Generate thumbnail images asynchronously
        void generateThumbnails(loaded, loaded.pageCount)
      } catch (err) {
        console.error(err)
        alert('Could not open PDF file. The file may be password-protected or corrupted.')
      } finally {
        setIsRendering(false)
      }
    },
    [pdfDoc, generateThumbnails, onAddActivity]
  )

  // Handle pipelined initial file
  useEffect(() => {
    if (initialFile) {
      void handleBuffer(initialFile.buffer, initialFile.name)
    }
  }, [initialFile, handleBuffer])

  const handleFileInput = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const buffer = new Uint8Array(await f.arrayBuffer())
    void handleBuffer(buffer, f.name)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0]
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        const buffer = new Uint8Array(await f.arrayBuffer())
        void handleBuffer(buffer, f.name)
      } else {
        alert('Please drop a valid PDF file.')
      }
    }
  }

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(pageInput, 10)
    if (!isNaN(num)) {
      handleGoToPage(num)
    } else {
      setPageInput(String(currentPage))
    }
  }

  // Fullscreen toggle
  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen request error:', err)
    }
  }

  // Print handler: prints current canvas or document cleanly
  const handlePrint = () => {
    if (!canvasRef.current) return
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png')
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${file?.name || 'Document'} - Page ${currentPage}</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; background: white; }
                img { max-width: 100%; height: auto; }
                @media print {
                  body { margin: 0; }
                  img { width: 100%; }
                }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print(); window.close();" />
            </body>
          </html>
        `)
        printWindow.document.close()
      } else {
        window.print()
      }
    } catch (err) {
      console.error('Print error:', err)
      window.print()
    }
  }

  // If no file is opened, show clean upload dropzone
  if (!file || !pdfDoc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <ToolHeader
          title="Open"
          highlight="PDF"
          description="Fast in-browser PDF reader with instant canvas rendering, zoom controls, thumbnail sidebar, touch swipe, and zero server uploads."
          onBack={onBack}
        />

        <div
          id="open-pdf-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[0.99]'
              : 'border-gray-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500/60 bg-white dark:bg-zinc-900 shadow-xs'
          }`}
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <BookOpen size={34} className="sm:w-10 sm:h-10" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-gray-950 dark:text-white mb-2">
            Select a PDF document to read
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Drag & drop any PDF here or browse your device. 100% private, client-side rendering with canvas technology across mobile & desktop.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-500/20 transition-transform active:scale-95">
            <UploadCloud size={18} />
            <span>Browse Files</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => void handleFileInput(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 text-center">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto mb-2">
              <Scan size={16} />
            </div>
            <div className="text-xs font-black text-gray-900 dark:text-white">Crisp Canvas</div>
            <div className="text-[10px] text-gray-400 mt-0.5">High-DPI Mobile & PC</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 text-center">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center mx-auto mb-2">
              <Layers size={16} />
            </div>
            <div className="text-xs font-black text-gray-900 dark:text-white">Thumbnails</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Visual Page Previews</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center mx-auto mb-2">
              <Printer size={16} />
            </div>
            <div className="text-xs font-black text-gray-900 dark:text-white">Direct Print</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Fast Page Printing</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 text-center">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-500 flex items-center justify-center mx-auto mb-2">
              <Maximize2 size={16} />
            </div>
            <div className="text-xs font-black text-gray-900 dark:text-white">Full Screen</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Distraction-Free Mode</div>
          </div>
        </div>

        <div className="mt-6">
          <PrivacyBadge />
        </div>
      </div>
    )
  }

  // Active Reader View
  return (
    <div
      ref={containerRef}
      id="open-pdf-reader-container"
      className={`w-full flex flex-col bg-zinc-100 dark:bg-[#090a0b] text-gray-900 dark:text-zinc-100 ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen overflow-hidden'
          : 'min-h-[85vh] rounded-3xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-sm max-w-7xl mx-auto my-3 sm:my-6'
      }`}
    >
      {/* Top Toolbar */}
      <header className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-3 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-20 shrink-0">
        {/* Row 1: File name, Thumbnails Toggle, Page Nav */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 min-w-0">
          {/* Left: Sidebar toggle + Document title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              id="reader-btn-toggle-sidebar"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                sidebarOpen
                  ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
                  : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white'
              }`}
              title={sidebarOpen ? 'Hide Thumbnails' : 'Show Thumbnails'}
              aria-label="Toggle Thumbnail Sidebar"
            >
              {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
            </button>

            <div className="min-w-0">
              <span
                className="text-xs sm:text-sm font-black text-gray-950 dark:text-white truncate block max-w-[120px] sm:max-w-[200px] md:max-w-xs"
                title={file.name}
              >
                {file.name}
              </span>
              <span className="text-[10px] text-gray-400 block font-mono">
                {formatBytes(file.size)}
              </span>
            </div>
          </div>

          {/* Center-Left: Page Stepper */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800/90 p-1 rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 shrink-0">
            <button
              id="reader-btn-first-page"
              onClick={() => handleGoToPage(1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              id="reader-btn-prev-page"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={15} />
            </button>

            {/* Page Input Form */}
            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 px-1">
              <input
                type="text"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={() => setPageInput(String(currentPage))}
                className="w-8 sm:w-10 text-center py-0.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                aria-label="Current Page"
              />
              <span className="text-xs text-gray-400 font-medium">/ {file.pageCount}</span>
            </form>

            <button
              id="reader-btn-next-page"
              onClick={handleNextPage}
              disabled={currentPage >= file.pageCount}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight size={15} />
            </button>
            <button
              id="reader-btn-last-page"
              onClick={() => handleGoToPage(file.pageCount)}
              disabled={currentPage >= file.pageCount}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>

        {/* Row 2 (Mobile) or Right Section (Desktop): Zoom, Fit, Rotate, Print, Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          {/* Zoom controls */}
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800/90 p-1 rounded-2xl border border-gray-200/60 dark:border-zinc-700/60 shrink-0">
            <button
              id="reader-btn-zoom-out"
              onClick={handleZoomOut}
              disabled={scale <= 0.4}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>

            <button
              id="reader-btn-zoom-reset"
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-xs font-mono font-bold text-gray-700 dark:text-zinc-300 hover:text-rose-500 transition-colors"
              title="Reset Zoom to 100%"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              id="reader-btn-zoom-in"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
          </div>

          {/* Fit to Width Button */}
          <button
            id="reader-btn-fit-width"
            onClick={handleFitWidth}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              fitMode === 'width'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white'
            }`}
            title="Fit to Width"
          >
            <Scan size={14} />
            <span className="hidden xs:inline">Fit Width</span>
          </button>

          {/* Fit to Page Button */}
          <button
            id="reader-btn-fit-page"
            onClick={handleFitPage}
            className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              fitMode === 'page'
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white'
            }`}
            title="Fit entire Page"
          >
            <Maximize size={14} />
            <span className="hidden xs:inline">Fit Page</span>
          </button>

          {/* Rotate View Button */}
          <button
            id="reader-btn-rotate-view"
            onClick={handleRotate}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title={`Rotate View (Currently ${rotation}°)`}
          >
            <RotateCw size={15} />
          </button>

          {/* Print Button */}
          <button
            id="reader-btn-print"
            onClick={handlePrint}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
            title="Print Current Page"
          >
            <Printer size={15} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            id="reader-btn-fullscreen"
            onClick={handleToggleFullscreen}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
              isFullscreen
                ? 'bg-rose-500 text-white'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Full Screen' : 'Full Screen View'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Download Original PDF */}
          <button
            id="reader-btn-download"
            onClick={() => downloadFile(file.buffer, file.name)}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
            title="Download PDF"
          >
            <Download size={15} />
          </button>

          {/* Change File */}
          <button
            id="reader-btn-change-file"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
            title="Open Another PDF"
          >
            <RefreshCw size={15} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => void handleFileInput(e.target.files)}
            className="hidden"
          />
        </div>
      </header>

      {/* Main Reader Body: Thumbnail Sidebar + Canvas Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnail Sidebar (Collapsible) */}
        {sidebarOpen && (
          <aside
            id="reader-thumbnail-sidebar"
            className="w-48 sm:w-60 bg-white dark:bg-zinc-900/95 border-r border-gray-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-hidden z-10 animate-in slide-in-from-left duration-150"
          >
            <div className="p-2.5 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-gray-500 dark:text-zinc-400">
              <span className="uppercase tracking-wider text-[10px]">
                Pages ({file.pageCount})
              </span>
              {thumbnailsLoading && (
                <div className="flex items-center gap-1 text-[10px] text-rose-500 animate-pulse font-normal">
                  <Loader2 size={11} className="animate-spin" />
                  <span>Loading</span>
                </div>
              )}
            </div>

            {/* Thumbnails Scroll List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
              {thumbnails.map((t) => {
                const isActive = t.pageNumber === currentPage
                return (
                  <button
                    key={t.pageNumber}
                    onClick={() => handleGoToPage(t.pageNumber)}
                    className={`w-full p-1.5 rounded-2xl border text-left transition-all group cursor-pointer flex flex-col items-center ${
                      isActive
                        ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-500/20 shadow-xs'
                        : 'border-gray-200/80 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/60 hover:border-gray-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {/* Thumbnail Box */}
                    <div className="w-full bg-white dark:bg-zinc-950 rounded-xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden flex items-center justify-center relative my-0.5 transition-transform group-hover:scale-[1.02] min-h-[100px]">
                      {t.thumbUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={t.thumbUrl}
                          alt={`Page ${t.pageNumber}`}
                          className="w-full h-auto max-h-[160px] object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-center text-gray-300 dark:text-zinc-600">
                          <Loader2 size={16} className="animate-spin mb-1 text-rose-400" />
                          <span className="text-[9px] font-mono">P. {t.pageNumber}</span>
                        </div>
                      )}

                      {/* Active badge */}
                      {isActive && (
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs ring-2 ring-white dark:ring-zinc-950" />
                      )}
                    </div>

                    {/* Page Label */}
                    <div className="w-full flex items-center justify-between text-[11px] font-bold mt-1 px-1">
                      <span
                        className={
                          isActive
                            ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                            : 'text-gray-600 dark:text-zinc-400'
                        }
                      >
                        Page {t.pageNumber}
                      </span>
                      <span className="text-[9px] font-mono text-gray-400">
                        {t.width > t.height ? 'Landscape' : 'Portrait'}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Quick Actions Footer inside Sidebar */}
            <div className="p-2.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/40 text-xs">
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Send to Tool
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {onSendToTool && (
                  <>
                    <button
                      onClick={() => onSendToTool('compress', file.buffer, file.name)}
                      className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[10px] font-bold text-gray-700 dark:text-zinc-300 hover:text-rose-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Zap size={11} className="text-amber-500" /> Compress
                    </button>
                    <button
                      onClick={() => onSendToTool('split', file.buffer, file.name)}
                      className="p-1 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[10px] font-bold text-gray-700 dark:text-zinc-300 hover:text-rose-500 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Scissors size={11} className="text-blue-500" /> Split
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* Main Document Viewer Stage with Canvas */}
        <main
          ref={stageRef}
          id="reader-stage"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-auto p-2 sm:p-6 flex flex-col items-center justify-start relative bg-zinc-200/70 dark:bg-[#0c0d10] min-h-0 select-none"
        >
          {/* Canvas Wrapper */}
          <div className="relative my-auto flex flex-col items-center">
            {/* Loading overlay while rendering page */}
            {isRendering && (
              <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xs rounded-lg flex items-center justify-center z-10 transition-opacity">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-800 dark:text-white">
                  <Loader2 size={14} className="animate-spin text-rose-500" />
                  <span>Rendering page {currentPage}...</span>
                </div>
              </div>
            )}

            {/* High-DPI Real Rendered PDF Page Canvas */}
            <div className="shadow-2xl rounded-lg overflow-hidden border border-gray-300/80 dark:border-zinc-700/80 bg-white transition-all">
              <canvas
                ref={canvasRef}
                id="open-pdf-page-canvas"
                className="block mx-auto max-w-none"
              />
            </div>

            {/* Bottom Status Floating Pill */}
            <div className="mt-3 flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/95 dark:bg-zinc-900/95 border border-gray-200/90 dark:border-zinc-800 shadow-sm text-[11px] font-semibold text-gray-600 dark:text-zinc-400">
              <span>
                Page {currentPage} of {file.pageCount}
              </span>
              <span>•</span>
              <span>{Math.round(scale * 100)}%</span>
              {rotation !== 0 && (
                <>
                  <span>•</span>
                  <span>{rotation}°</span>
                </>
              )}
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-gray-400 text-[10px]">
                Swipe or use arrow keys to turn pages
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
