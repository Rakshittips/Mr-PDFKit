'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileText, Copy, Download, Loader2, UploadCloud, Check, Search } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import { extractTextFromPdf, downloadFile, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface PdfToTextToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
}

export default function PdfToTextTool({ initialFile, onBack, onAddActivity }: PdfToTextToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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

  const handleExtract = async () => {
    if (!file) return
    setLoading(true)
    try {
      const text = await extractTextFromPdf(file.buffer)
      setExtractedText(text)
      onAddActivity?.({
        tool: 'PDF to Text',
        fileName: file.name,
        timestamp: Date.now(),
        size: text.length,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to extract text from PDF.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!extractedText) return
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadTxt = () => {
    if (!extractedText || !file) return
    const encoder = new TextEncoder()
    const bytes = encoder.encode(extractedText)
    downloadFile(bytes, `${file.name.replace('.pdf', '')}.txt`, 'text/plain')
  }

  const wordCount = extractedText ? extractedText.trim().split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="PDF to"
        highlight="Text"
        description="Extract raw text and paragraphs from your PDF document for editing, analysis, or note taking."
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
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to extract text
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Extract copyable text directly in your browser
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : !extractedText ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
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

          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                Zero-Server Text Extraction
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Extracts text streams and layout encoding safely in browser memory.
              </p>
            </div>

            <button
              onClick={handleExtract}
              disabled={loading}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Extracting Text...
                </>
              ) : (
                <>
                  <FileText size={18} /> Extract Text Now
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">
                {wordCount.toLocaleString()} words • {extractedText.length.toLocaleString()} characters
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                <Download size={14} /> Download .TXT
              </button>
              <button
                onClick={() => {
                  setExtractedText(null)
                  setFile(null)
                }}
                className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider ml-2"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <textarea
              readOnly
              value={extractedText}
              rows={16}
              className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 text-sm font-mono text-gray-800 dark:text-zinc-200 outline-none resize-y"
            />
          </div>
        </div>
      )}

      <PrivacyBadge />
    </div>
  )
}
