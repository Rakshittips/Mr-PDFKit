'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, ArrowUp, ArrowDown, FileText, Loader2, UploadCloud } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { mergePdfs, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface PdfItem {
  id: string
  name: string
  size: number
  pageCount: number
  buffer: Uint8Array
}

interface MergeToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function MergeTool({ initialFile, onBack, onAddActivity, onSendToTool }: MergeToolProps) {
  const [files, setFiles] = useState<PdfItem[]>([])
  const [loading, setLoading] = useState(false)
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null)
  const [mergedFileName, setMergedFileName] = useState('paperknife-merged.pdf')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInitialFile = async (piped: PipelinedFile) => {
    try {
      const doc = await PDFDocument.load(piped.buffer, { ignoreEncryption: true })
      setFiles([
        {
          id: Math.random().toString(),
          name: piped.name,
          size: piped.buffer.byteLength,
          pageCount: doc.getPageCount(),
          buffer: piped.buffer,
        },
      ])
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (initialFile) {
      void handleInitialFile(initialFile)
    }
  }, [initialFile])

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newItems: PdfItem[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) continue
      try {
        const buffer = new Uint8Array(await file.arrayBuffer())
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
        newItems.push({
          id: Math.random().toString(),
          name: file.name,
          size: file.size,
          pageCount: doc.getPageCount(),
          buffer,
        })
      } catch (err) {
        console.error('Error loading PDF:', err)
      }
    }

    setFiles((prev) => [...prev, ...newItems])
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= files.length) return
    const newFiles = [...files]
    const temp = newFiles[index]
    newFiles[index] = newFiles[targetIndex]
    newFiles[targetIndex] = temp
    setFiles(newFiles)
  }

  const handleMerge = async () => {
    if (files.length < 2) return
    setLoading(true)
    try {
      const merged = await mergePdfs(files)
      setResultBuffer(merged)
      const fileName = mergedFileName.endsWith('.pdf') ? mergedFileName : `${mergedFileName}.pdf`
      onAddActivity?.({
        tool: 'Merge PDF',
        fileName,
        timestamp: Date.now(),
        size: merged.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to merge PDFs. One of the documents may be corrupt or encrypted.')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0)
  const totalSize = files.reduce((acc, f) => acc + f.size, 0)

  if (resultBuffer) {
    return (
      <SuccessState
        message="PDFs Merged Successfully!"
        buffer={resultBuffer}
        fileName={mergedFileName}
        originalSize={totalSize}
        onStartOver={() => {
          setResultBuffer(null)
          setFiles([])
        }}
        onSendToTool={onSendToTool}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="Merge"
        highlight="PDF Files"
        description="Combine multiple PDF documents into a single organized file in seconds. Drag to reorder your pages."
        onBack={onBack}
      />

      {files.length === 0 ? (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-rose-400 dark:hover:border-rose-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop PDFs to merge
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Choose 2 or more PDF documents from your device
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
          >
            Browse PDF Files
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Files List */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected • {totalPages} total pages
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider"
              >
                <Plus size={16} /> Add More Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFiles(e.target.files)}
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
              />
            </div>

            <div className="space-y-2.5">
              {files.map((file, idx) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800 transition-all hover:border-gray-200 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-zinc-700 text-[11px] font-black text-gray-700 dark:text-zinc-300">
                      {idx + 1}
                    </span>
                    <FileText size={20} className="text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
                        {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveFile(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-30 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      onClick={() => moveFile(idx, 'down')}
                      disabled={idx === files.length - 1}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-30 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                      title="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors ml-1"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Merge Controls */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Output File Name
              </label>
              <input
                type="text"
                value={mergedFileName}
                onChange={(e) => setMergedFileName(e.target.value)}
                className="w-full sm:w-64 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={handleMerge}
              disabled={files.length < 2 || loading}
              className="w-full sm:w-auto px-8 py-4 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-rose-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Merging...
                </>
              ) : (
                `Merge ${files.length} Files (${totalPages} Pages)`
              )}
            </button>
          </div>
        </div>
      )}

      <PrivacyBadge />
    </div>
  )
}
