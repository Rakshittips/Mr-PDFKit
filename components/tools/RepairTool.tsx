'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Wrench, FileText, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { repairPdf, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface RepairToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function RepairTool({ initialFile, onBack, onAddActivity, onSendToTool }: RepairToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; buffer: Uint8Array } | null>(() => {
    if (initialFile) {
      return {
        name: initialFile.name,
        size: initialFile.buffer.byteLength,
        buffer: initialFile.buffer,
      }
    }
    return null
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ buffer: Uint8Array; pageCount: number; originalSize: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const buffer = new Uint8Array(await f.arrayBuffer())
    setFile({ name: f.name, size: f.size, buffer })
  }

  const handleRepair = async () => {
    if (!file) return
    setLoading(true)
    try {
      const res = await repairPdf(file.buffer)
      setResult({
        buffer: res.data,
        pageCount: res.pageCount,
        originalSize: file.size,
      })
      const outName = `${file.name.replace('.pdf', '')}-repaired.pdf`
      onAddActivity?.({
        tool: 'Repair PDF',
        fileName: outName,
        timestamp: Date.now(),
        size: res.data.byteLength,
      })
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Unable to repair this file.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <SuccessState
        message="PDF Rebuilt and Repaired Successfully!"
        buffer={result.buffer}
        fileName={`${file?.name.replace('.pdf', '')}-repaired.pdf`}
        originalSize={result.originalSize}
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
        title="Repair"
        highlight="PDF"
        description="Reconstruct damaged XREF tables, heal corrupted trailers, and salvage pages from broken PDF documents."
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
              ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-red-400 dark:hover:border-red-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a damaged PDF
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Analyze file structures and reconstruct damaged streams
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-gray-400 font-medium">
                  {formatBytes(file.size)}
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

          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Diagnostic & Recovery Plan
            </h4>

            <div className="space-y-2 text-xs text-gray-600 dark:text-zinc-300">
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Re-parse byte offsets and rebuild index tables (XREF)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Re-link dangling page parent pointers and catalog root objects</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Standardize output stream compressions for standard PDF viewers</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRepair}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-red-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Repairing PDF...
                </>
              ) : (
                <>
                  <Wrench size={18} /> Repair Document Now
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
