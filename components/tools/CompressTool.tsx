'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Zap, FileText, Loader2, UploadCloud, CheckCircle } from 'lucide-react'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { compressPdf, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface CompressToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function CompressTool({ initialFile, onBack, onAddActivity, onSendToTool }: CompressToolProps) {
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
  const [level, setLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ buffer: Uint8Array; fileName: string; originalSize: number; compressedSize: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const buffer = new Uint8Array(await f.arrayBuffer())
    setFile({ name: f.name, size: f.size, buffer })
  }

  const handleCompress = async () => {
    if (!file) return
    setLoading(true)
    try {
      const res = await compressPdf(file.buffer, level)
      const outName = `${file.name.replace('.pdf', '')}-compressed.pdf`
      setResult({
        buffer: res.data,
        fileName: outName,
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
      })
      onAddActivity?.({
        tool: 'Compress PDF',
        fileName: outName,
        timestamp: Date.now(),
        size: res.compressedSize,
        savedSize: Math.max(0, res.originalSize - res.compressedSize),
      })
    } catch (err) {
      console.error(err)
      alert('Failed to compress PDF.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <SuccessState
        message="PDF Compressed Successfully!"
        buffer={result.buffer}
        fileName={result.fileName}
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
        title="Compress"
        highlight="PDF File"
        description="Reduce your PDF file size without sacrificing document legibility. 100% locally on your computer."
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
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-amber-400 dark:hover:border-amber-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to compress
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Choose a PDF document to optimize its storage footprint
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                <FileText size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white truncate max-w-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-gray-400 font-medium">
                  Current size: {formatBytes(file.size)}
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

          {/* Compression Level Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'extreme',
                title: 'Extreme Compression',
                desc: 'Maximum size reduction. Strips non-essential metadata and compacts streams.',
                badge: 'Smallest Size',
              },
              {
                id: 'recommended',
                title: 'Recommended',
                desc: 'Optimal balance between file size and document visual quality.',
                badge: 'Most Popular',
              },
              {
                id: 'low',
                title: 'Less Compression',
                desc: 'Maintains high fidelity while optimizing object structures.',
                badge: 'Highest Quality',
              },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setLevel(opt.id as any)}
                className={`p-6 rounded-3xl border text-left transition-all relative ${
                  level === opt.id
                    ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                    : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                    {opt.badge}
                  </span>
                  {level === opt.id && <CheckCircle size={18} className="text-amber-500" />}
                </div>
                <h4 className="font-black text-gray-900 dark:text-white text-base mb-1">
                  {opt.title}
                </h4>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {opt.desc}
                </p>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCompress}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Compressing PDF...
                </>
              ) : (
                <>
                  <Zap size={18} /> Compress PDF Now
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
