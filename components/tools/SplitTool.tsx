'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Scissors, FileText, Loader2, UploadCloud, Archive } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { splitPdf, parsePageRange, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface SplitToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function SplitTool({ initialFile, onBack, onAddActivity, onSendToTool }: SplitToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [mode, setMode] = useState<'range' | 'all'>('range')
  const [rangeInput, setRangeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ buffer: Uint8Array; fileName: string; isZip: boolean } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBuffer = async (buffer: Uint8Array, name: string) => {
    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pageCount = doc.getPageCount()
      setFile({ name, size: buffer.byteLength, pageCount, buffer })
      setRangeInput(`1-${Math.min(pageCount, 3)}`)
    } catch {
      alert('Could not read PDF. It might be corrupt or password-protected.')
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

  const handleSplit = async () => {
    if (!file) return
    setLoading(true)
    try {
      if (mode === 'all') {
        const res = await splitPdf(file.buffer, 'all')
        setResult({ buffer: res.data, fileName: `${file.name.replace('.pdf', '')}-all-pages.zip`, isZip: true })
        onAddActivity?.({
          tool: 'Split PDF',
          fileName: `${file.name} (all pages)`,
          timestamp: Date.now(),
          size: res.data.byteLength,
        })
      } else {
        const parsed = parsePageRange(rangeInput, file.pageCount)
        if (parsed.length === 0) {
          alert('Please enter a valid page range (e.g. 1-3, 5)')
          setLoading(false)
          return
        }
        const res = await splitPdf(file.buffer, 'range', rangeInput)
        setResult({ buffer: res.data, fileName: `${file.name.replace('.pdf', '')}-extracted.pdf`, isZip: false })
        onAddActivity?.({
          tool: 'Split PDF',
          fileName: `${file.name} (pages ${rangeInput})`,
          timestamp: Date.now(),
          size: res.data.byteLength,
        })
      }
    } catch (err) {
      console.error(err)
      alert('Error splitting document.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <SuccessState
        message={result.isZip ? 'PDF Split into Individual Pages!' : 'Pages Extracted Successfully!'}
        buffer={result.buffer}
        fileName={result.fileName}
        mimeType={result.isZip ? 'application/zip' : 'application/pdf'}
        originalSize={file?.size}
        onStartOver={() => {
          setResult(null)
          setFile(null)
        }}
        onSendToTool={onSendToTool}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="Split"
        highlight="PDF Pages"
        description="Extract specific pages or separate your entire PDF into individual single-page documents instantly."
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
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to split
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Choose a PDF document from your device to extract pages
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File summary */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-gray-400 font-medium">
                  {file.pageCount} total {file.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(file.size)}
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

          {/* Split Mode Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('range')}
              className={`p-6 rounded-3xl border text-left transition-all ${
                mode === 'range'
                  ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                  : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Scissors size={18} className="text-blue-500" />
                <span className="font-black text-gray-900 dark:text-white text-base">
                  Extract Custom Range
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
                Specify exact pages or page ranges to bundle into a new PDF document.
              </p>
              {mode === 'range' && (
                <div className="mt-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Page Range (e.g. 1-3, 5, 8)
                  </label>
                  <input
                    type="text"
                    value={rangeInput}
                    onChange={(e) => setRangeInput(e.target.value)}
                    placeholder={`1-${file.pageCount}`}
                    className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Valid page numbers: 1 to {file.pageCount}
                  </span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMode('all')}
              className={`p-6 rounded-3xl border text-left transition-all ${
                mode === 'all'
                  ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                  : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Archive size={18} className="text-blue-500" />
                <span className="font-black text-gray-900 dark:text-white text-base">
                  All Pages into Single PDFs
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Splits every individual page of this PDF into its own separate document and bundles them in a ZIP file.
              </p>
              {mode === 'all' && (
                <div className="mt-4 p-2.5 bg-blue-50/60 dark:bg-blue-900/30 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-300">
                  Will generate {file.pageCount} individual PDF files.
                </div>
              )}
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSplit}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Splitting Document...
                </>
              ) : mode === 'all' ? (
                `Split into ${file.pageCount} Files (ZIP)`
              ) : (
                'Extract Selected Pages'
              )}
            </button>
          </div>
        </div>
      )}

      <PrivacyBadge />
    </div>
  )
}
