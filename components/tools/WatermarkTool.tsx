'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Type, FileText, Loader2, UploadCloud } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { addWatermark, formatBytes, WatermarkOptions } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface WatermarkToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function WatermarkTool({ initialFile, onBack, onAddActivity, onSendToTool }: WatermarkToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.3)
  const [rotation, setRotation] = useState(-45)
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState<WatermarkOptions['color']>('red')
  const [pages, setPages] = useState<WatermarkOptions['pages']>('all')
  const [customRange, setCustomRange] = useState('')
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
    if (!file || !text.trim()) return
    setLoading(true)
    try {
      const watermarked = await addWatermark(file.buffer, {
        text,
        opacity,
        rotation,
        fontSize,
        color,
        pages,
        customRange,
      })
      setResultBuffer(watermarked)
      const outName = `${file.name.replace('.pdf', '')}-watermarked.pdf`
      onAddActivity?.({
        tool: 'Watermark',
        fileName: outName,
        timestamp: Date.now(),
        size: watermarked.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to apply watermark.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="Watermark Applied Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-watermarked.pdf`}
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
        title="Watermark"
        highlight="PDF"
        description="Stamp custom security or branding watermarks across pages with custom angle, transparency, and color."
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
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-purple-400 dark:hover:border-purple-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to watermark
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Brand or protect your document with custom text
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center">
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

          {/* Watermark Configuration */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 space-y-6 shadow-sm">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Watermark Text
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {['CONFIDENTIAL', 'DRAFT', 'DO NOT COPY', 'SAMPLE', 'ORIGINAL'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setText(preset)}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-500 rounded-xl text-xs font-bold text-gray-600 dark:text-zinc-300 transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter custom watermark text..."
                className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-base font-bold text-gray-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
              {/* Color */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Color
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'red', bg: 'bg-red-500' },
                    { id: 'gray', bg: 'bg-gray-500' },
                    { id: 'blue', bg: 'bg-blue-500' },
                    { id: 'black', bg: 'bg-zinc-900' },
                    { id: 'green', bg: 'bg-emerald-500' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id as any)}
                      className={`w-8 h-8 rounded-full ${c.bg} transition-transform ${
                        color === c.id ? 'ring-4 ring-purple-500/30 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Angle: {rotation}°
                </label>
                <div className="flex gap-2">
                  {[-45, 0, 45, 90].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotation(deg)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        rotation === deg
                          ? 'border-purple-500 bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleApply}
              disabled={loading || !text.trim()}
              className="w-full sm:w-auto px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Watermarking...
                </>
              ) : (
                <>
                  <Type size={18} /> Apply Watermark
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
