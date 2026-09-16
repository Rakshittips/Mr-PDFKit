'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Unlock, FileText, Loader2, UploadCloud, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { unlockPdf, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface UnlockToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function UnlockTool({ initialFile, onBack, onAddActivity, onSendToTool }: UnlockToolProps) {
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
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const buffer = new Uint8Array(await f.arrayBuffer())
    setFile({ name: f.name, size: f.size, buffer })
  }

  const handleUnlock = async () => {
    if (!file) return
    setLoading(true)
    try {
      const unlocked = await unlockPdf(file.buffer, password)
      setResultBuffer(unlocked)
      const outName = `${file.name.replace('.pdf', '')}-unlocked.pdf`
      onAddActivity?.({
        tool: 'Unlock PDF',
        fileName: outName,
        timestamp: Date.now(),
        size: unlocked.byteLength,
      })
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to unlock PDF. Please check the password.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="PDF Unlocked Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-unlocked.pdf`}
        originalSize={file?.size}
        onStartOver={() => {
          setResultBuffer(null)
          setFile(null)
          setPassword('')
        }}
        onSendToTool={onSendToTool}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="Unlock"
        highlight="PDF"
        description="Remove password protection and permissions restrictions from your PDF document forever."
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
              ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-violet-400 dark:hover:border-violet-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-violet-50 dark:bg-violet-900/20 text-violet-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a password-locked PDF
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Remove document restrictions and passwords
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-500 flex items-center justify-center">
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

          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 max-w-lg mx-auto">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
                Enter Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter file password if required"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                If the file only has permissions locks (owner password), leave empty and click Unlock.
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="w-full py-4 bg-violet-500 hover:bg-violet-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-violet-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Unlocking...
                  </>
                ) : (
                  <>
                    <Unlock size={18} /> Remove Password & Unlock PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <PrivacyBadge />
    </div>
  )
}
