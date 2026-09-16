'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Copy, FileText, Loader2, UploadCloud, RotateCcw } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { rearrangePdf, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface RearrangeToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function RearrangeTool({ initialFile, onBack, onAddActivity, onSendToTool }: RearrangeToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [pageOrder, setPageOrder] = useState<number[]>([]) // array of 0-based indices
  const [loading, setLoading] = useState(false)
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBuffer = async (buffer: Uint8Array, name: string) => {
    try {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const count = doc.getPageCount()
      setFile({ name, size: buffer.byteLength, pageCount: count, buffer })
      setPageOrder(Array.from({ length: count }, (_, i) => i))
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

  const movePage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= pageOrder.length) return
    const newOrder = [...pageOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[targetIndex]
    newOrder[targetIndex] = temp
    setPageOrder(newOrder)
  }

  const deletePage = (index: number) => {
    if (pageOrder.length <= 1) {
      alert('A PDF must contain at least 1 page.')
      return
    }
    setPageOrder((prev) => prev.filter((_, i) => i !== index))
  }

  const duplicatePage = (index: number) => {
    const newOrder = [...pageOrder]
    newOrder.splice(index + 1, 0, pageOrder[index])
    setPageOrder(newOrder)
  }

  const reversePages = () => {
    setPageOrder([...pageOrder].reverse())
  }

  const resetOrder = () => {
    if (!file) return
    setPageOrder(Array.from({ length: file.pageCount }, (_, i) => i))
  }

  const handleSave = async () => {
    if (!file || pageOrder.length === 0) return
    setLoading(true)
    try {
      const rearranged = await rearrangePdf(file.buffer, pageOrder)
      setResultBuffer(rearranged)
      const outName = `${file.name.replace('.pdf', '')}-rearranged.pdf`
      onAddActivity?.({
        tool: 'Rearrange PDF',
        fileName: outName,
        timestamp: Date.now(),
        size: rearranged.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to rearrange PDF pages.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="PDF Rearranged Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-rearranged.pdf`}
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
        title="Rearrange"
        highlight="PDF Pages"
        description="Reorder, delete, duplicate, or reverse pages in your PDF document visually."
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
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-emerald-400 dark:hover:border-emerald-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to reorder pages
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Rearrange and organize pages in your document
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File summary & actions */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-gray-400 font-medium">
                  {pageOrder.length} pages currently • Original: {file.pageCount} pages ({formatBytes(file.size)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={reversePages}
                className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors"
                title="Reverse page sequence"
              >
                Reverse All
              </button>
              <button
                onClick={resetOrder}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                title="Reset to original order"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setFile(null)}
                className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider ml-2"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Pages Grid */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {pageOrder.map((origPageIndex, currentPos) => (
                <div
                  key={`${origPageIndex}-${currentPos}`}
                  className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800 flex flex-col justify-between group hover:border-emerald-500/40 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-500 text-white text-[11px] font-black">
                      {currentPos + 1}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">
                      Original P.{origPageIndex + 1}
                    </span>
                  </div>

                  {/* Thumbnail / Page box */}
                  <div className="h-24 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/60 dark:border-zinc-700/60 flex flex-col items-center justify-center text-center p-2 mb-3 shadow-inner">
                    <FileText size={28} className="text-gray-300 dark:text-zinc-600 mb-1" />
                    <span className="text-[11px] font-black text-gray-700 dark:text-zinc-300">
                      Page {origPageIndex + 1}
                    </span>
                  </div>

                  {/* Move/Delete controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-zinc-700/50">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => movePage(currentPos, 'up')}
                        disabled={currentPos === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-20 rounded"
                        title="Move left"
                      >
                        <ArrowUp size={14} className="-rotate-90" />
                      </button>
                      <button
                        onClick={() => movePage(currentPos, 'down')}
                        disabled={currentPos === pageOrder.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-20 rounded"
                        title="Move right"
                      >
                        <ArrowDown size={14} className="-rotate-90" />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => duplicatePage(currentPos)}
                        className="p-1 text-gray-400 hover:text-emerald-500 rounded"
                        title="Duplicate page"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => deletePage(currentPos)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="Delete page"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving PDF...
                </>
              ) : (
                <>
                  <ArrowUpDown size={18} /> Save Rearranged PDF ({pageOrder.length} Pages)
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
