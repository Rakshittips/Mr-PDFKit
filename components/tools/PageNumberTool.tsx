'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Hash, FileText, Loader2, UploadCloud } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { addPageNumbers, formatBytes, PageNumberOptions } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface PageNumberToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function PageNumberTool({ initialFile, onBack, onAddActivity, onSendToTool }: PageNumberToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [format, setFormat] = useState<PageNumberOptions['format']>('Page {n} of {total}')
  const [position, setPosition] = useState<PageNumberOptions['position']>('bottom-center')
  const [startNumber, setStartNumber] = useState(1)
  const [skipFirstPage, setSkipFirstPage] = useState(false)
  const [fontSize, setFontSize] = useState(10)
  const [color, setColor] = useState<PageNumberOptions['color']>('darkGray')
  const [loading, setLoading] = useState(false)
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBuffer = async (buffer: Uint8Array, name: string) => {
    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      setFile({ name, size: buffer.byteLength, pageCount: doc.getPageCount(), buffer })
    } catch {
      alert('Could not read PDF file.')
    }
  }

  useEffect(() => {
    if (initialFile) {
      void handleBuffer(initialFile.buffer, initialFile.name)
    }
  }, [initialFile])

  const handleFileInput = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const buffer = new Uint8Array(await f.arrayBuffer())
    handleBuffer(buffer, f.name)
  }

  const handleApply = async () => {
    if (!file) return
    setLoading(true)
    try {
      const numbered = await addPageNumbers(file.buffer, {
        format,
        position,
        startNumber,
        skipFirstPage,
        fontSize,
        color,
        margin: 30,
      })
      setResultBuffer(numbered)
      const outName = `${file.name.replace('.pdf', '')}-numbered.pdf`
      onAddActivity?.({
        tool: 'Page Numbers',
        fileName: outName,
        timestamp: Date.now(),
        size: numbered.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to add page numbers to PDF.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="Page Numbers Added Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-numbered.pdf`}
        originalSize={file?.size}
        onStartOver={() => {
          setResultBuffer(null)
          setFile(null)
        }}
        onSendToTool={onSendToTool}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="Page"
        highlight="Numbers"
        description="Insert neat, customized page numbers into your PDF with custom positioning, numbering formats, and typography."
        onBack={onBack}
      />

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFileInput(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-sky-400 dark:hover:border-sky-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-sky-50 dark:bg-sky-900/20 text-sky-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to number
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Add page numbers across all pages cleanly
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-sky-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-gray-400 font-medium">
                  {file.pageCount} pages • {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setFile(null)}
              className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider"
            >
              Change File
            </button>
          </div>

          {/* Options */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 space-y-6 shadow-sm">
            {/* Format */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Numbering Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'Page {n} of {total}', label: 'Page 1 of 10' },
                  { id: 'Page {n}', label: 'Page 1' },
                  { id: '{n}/{total}', label: '1/10' },
                  { id: '{n}', label: '1 (Simple)' },
                  { id: '- {n} -', label: '- 1 -' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id as any)}
                    className={`p-3 rounded-xl text-xs font-bold transition-all border text-left ${
                      format === f.id
                        ? 'border-sky-500 bg-sky-50/30 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20'
                        : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Page Position
              </label>
              <div className="grid grid-cols-3 gap-2 max-w-sm">
                {[
                  { id: 'top-left', label: 'Top Left' },
                  { id: 'top-center', label: 'Top Center' },
                  { id: 'top-right', label: 'Top Right' },
                  { id: 'bottom-left', label: 'Bottom Left' },
                  { id: 'bottom-center', label: 'Bottom Center' },
                  { id: 'bottom-right', label: 'Bottom Right' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPosition(p.id as any)}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-bold text-center border transition-all ${
                      position === p.id
                        ? 'border-sky-500 bg-sky-50/30 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 ring-2 ring-sky-500/20'
                        : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 text-gray-600 dark:text-zinc-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Start Number
                </label>
                <input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Font Size (pt)
                </label>
                <input
                  type="number"
                  min={8}
                  max={24}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 10)}
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipFirstPage}
                    onChange={(e) => setSkipFirstPage(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                    Skip cover page (Page 1)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleApply}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-sky-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Adding Numbers...
                </>
              ) : (
                <>
                  <Hash size={18} /> Add Page Numbers
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <PrivacyBadge />
    </div>
  )
}
