'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Palette, FileText, Loader2, UploadCloud } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { convertToGrayscale, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface GrayscaleToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function GrayscaleTool({ initialFile, onBack, onAddActivity, onSendToTool }: GrayscaleToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
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

  const handleConvert = async () => {
    if (!file) return
    setLoading(true)
    try {
      const gray = await convertToGrayscale(file.buffer)
      setResultBuffer(gray)
      const outName = `${file.name.replace('.pdf', '')}-grayscale.pdf`
      onAddActivity?.({
        tool: 'Grayscale',
        fileName: outName,
        timestamp: Date.now(),
        size: gray.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to convert PDF to grayscale.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="Converted to Grayscale Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-grayscale.pdf`}
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
        title="Grayscale"
        highlight="PDF"
        description="Convert all document pages, embedded graphics, and text to monochrome black and white for cheap printing."
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
              ? 'border-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-400 dark:hover:border-zinc-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF for grayscale
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Optimize color files for monochrome printing and archival
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
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
            <div className="max-w-md">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                Printer-Friendly Monochrome Conversion
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Transforms all color palettes and image elements into clean grayscale gradients. Ideal for drafting and toner conservation.
              </p>
            </div>

            <button
              onClick={handleConvert}
              disabled={loading}
              className="px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Palette size={18} /> Convert to Grayscale
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
