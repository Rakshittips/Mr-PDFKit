'use client'

import React, { useState, useRef, useEffect } from 'react'
import { RotateCw, RotateCcw, FileText, Loader2, UploadCloud } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { rotatePdf, parsePageRange, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface RotateToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function RotateTool({ initialFile, onBack, onAddActivity, onSendToTool }: RotateToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [rotationAngle, setRotationAngle] = useState<number>(90)
  const [pageSelection, setPageSelection] = useState<'all' | 'odd' | 'even' | 'custom'>('all')
  const [customPages, setCustomPages] = useState('')
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

  const handleRotate = async () => {
    if (!file) return
    setLoading(true)
    try {
      let targetIndices: number[] | undefined = undefined
      if (pageSelection === 'odd') {
        targetIndices = Array.from({ length: file.pageCount }, (_, i) => i).filter((i) => (i + 1) % 2 !== 0)
      } else if (pageSelection === 'even') {
        targetIndices = Array.from({ length: file.pageCount }, (_, i) => i).filter((i) => (i + 1) % 2 === 0)
      } else if (pageSelection === 'custom') {
        targetIndices = parsePageRange(customPages, file.pageCount)
      }

      const rotated = await rotatePdf(file.buffer, rotationAngle, targetIndices)
      setResultBuffer(rotated)
      const outName = `${file.name.replace('.pdf', '')}-rotated.pdf`
      onAddActivity?.({
        tool: 'Rotate PDF',
        fileName: outName,
        timestamp: Date.now(),
        size: rotated.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to rotate PDF.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="PDF Rotated Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-rotated.pdf`}
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
        title="Rotate"
        highlight="PDF Pages"
        description="Permanently change page orientation. Rotate all pages or specific ranges clockwise or counter-clockwise."
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
              ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-orange-400 dark:hover:border-orange-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 text-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to rotate
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Fix upside-down or sideways pages in your documents
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center">
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

          {/* Direction controls */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-4">
              Select Rotation Angle
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { angle: 90, label: '90° Clockwise', icon: RotateCw },
                { angle: 180, label: '180° Flip', icon: RotateCw },
                { angle: 270, label: '90° Counter-Clockwise', icon: RotateCcw },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.angle}
                    type="button"
                    onClick={() => setRotationAngle(item.angle)}
                    className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      rotationAngle === item.angle
                        ? 'border-orange-500 bg-orange-50/20 dark:bg-orange-950/20 text-orange-500 ring-2 ring-orange-500/20 font-bold'
                        : 'border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-200'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Which pages */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                Apply Rotation To
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All Pages' },
                  { id: 'odd', label: 'Odd Pages Only' },
                  { id: 'even', label: 'Even Pages Only' },
                  { id: 'custom', label: 'Custom Range' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPageSelection(opt.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      pageSelection === opt.id
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent'
                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border-gray-100 dark:border-zinc-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {pageSelection === 'custom' && (
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder={`e.g. 1, 3-5 (Max: ${file.pageCount})`}
                    value={customPages}
                    onChange={(e) => setCustomPages(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRotate}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Rotating Pages...
                </>
              ) : (
                <>
                  <RotateCw size={18} /> Apply Rotation ({rotationAngle}°)
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
