'use client'

import React, { useState, useRef } from 'react'
import { ImagePlus, Trash2, ArrowUp, ArrowDown, Loader2, UploadCloud, Check } from 'lucide-react'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { imagesToPdf, formatBytes } from '@/lib/pdfEngine'
import { ActivityEntry } from '@/lib/types'

interface ImageItem {
  id: string
  name: string
  size: number
  buffer: Uint8Array
  type: string
  previewUrl: string
}

interface ImageToPdfToolProps {
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function ImageToPdfTool({ onBack, onAddActivity, onSendToTool }: ImageToPdfToolProps) {
  const [images, setImages] = useState<ImageItem[]>([])
  const [pageSize, setPageSize] = useState<'fit' | 'a4' | 'letter'>('fit')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [margin, setMargin] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null)
  const [outFileName, setOutFileName] = useState('paperknife-images.pdf')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    const newItems: ImageItem[] = []

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i]
      if (!f.type.startsWith('image/')) continue
      const buffer = new Uint8Array(await f.arrayBuffer())
      const previewUrl = URL.createObjectURL(new Blob([buffer], { type: f.type }))
      newItems.push({
        id: Math.random().toString(),
        name: f.name,
        size: f.size,
        buffer,
        type: f.type,
        previewUrl,
      })
    }

    setImages((prev) => [...prev, ...newItems])
  }

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return
    const next = [...images]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp
    setImages(next)
  }

  const handleConvert = async () => {
    if (images.length === 0) return
    setLoading(true)
    try {
      const pdf = await imagesToPdf(
        images.map((img) => ({ buffer: img.buffer, type: img.type })),
        { pageSize, orientation, margin }
      )
      setResultBuffer(pdf)
      const fileName = outFileName.endsWith('.pdf') ? outFileName : `${outFileName}.pdf`
      onAddActivity?.({
        tool: 'Image to PDF',
        fileName,
        timestamp: Date.now(),
        size: pdf.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to generate PDF from images.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="PDF Created From Images Successfully!"
        buffer={resultBuffer}
        fileName={outFileName}
        originalSize={images.reduce((acc, img) => acc + img.size, 0)}
        onStartOver={() => {
          setResultBuffer(null)
          setImages([])
        }}
        onSendToTool={onSendToTool}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="Image to"
        highlight="PDF"
        description="Convert JPG, PNG, and WebP images into a single polished PDF document. Drag to arrange pages in sequence."
        onBack={onBack}
      />

      {images.length === 0 ? (
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
              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-teal-400 dark:hover:border-teal-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/20 text-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop images
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Supports JPG, PNG, and WebP photos and scans
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
          >
            Browse Images
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Images Grid */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                {images.length} {images.length === 1 ? 'image' : 'images'} selected
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-bold text-teal-500 hover:text-teal-600 uppercase tracking-wider"
              >
                + Add More Images
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFiles(e.target.files)}
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded-lg bg-teal-500 text-white text-[11px] font-black">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[90px]">
                      {formatBytes(img.size)}
                    </span>
                  </div>

                  <div className="h-28 bg-black/5 dark:bg-black/30 rounded-xl overflow-hidden flex items-center justify-center mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-zinc-700/50">
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => moveImage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-20 rounded"
                        title="Move left"
                      >
                        <ArrowUp size={14} className="-rotate-90" />
                      </button>
                      <button
                        onClick={() => moveImage(idx, 'down')}
                        disabled={idx === images.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-20 rounded"
                        title="Move right"
                      >
                        <ArrowDown size={14} className="-rotate-90" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeImage(img.id)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Remove image"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
              Page Layout Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Page Size
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'fit', label: 'Match Image' },
                    { id: 'a4', label: 'A4' },
                    { id: 'letter', label: 'US Letter' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setPageSize(s.id as any)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        pageSize === s.id
                          ? 'border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {pageSize !== 'fit' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Orientation
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: 'portrait', label: 'Portrait' },
                      { id: 'landscape', label: 'Landscape' },
                    ].map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOrientation(o.id as any)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          orientation === o.id
                            ? 'border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                            : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Margin
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 0, label: 'No Margin' },
                    { id: 20, label: 'Small' },
                    { id: 40, label: 'Big' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMargin(m.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        margin === m.id
                          ? 'border-teal-500 bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <input
              type="text"
              value={outFileName}
              onChange={(e) => setOutFileName(e.target.value)}
              className="w-full sm:w-64 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-teal-500"
              placeholder="Output file name"
            />

            <button
              onClick={handleConvert}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-teal-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creating PDF...
                </>
              ) : (
                <>
                  <ImagePlus size={18} /> Convert {images.length} Images to PDF
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
