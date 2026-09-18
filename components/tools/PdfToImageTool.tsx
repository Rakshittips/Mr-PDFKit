'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FileImage, Download, FileText, Loader2, UploadCloud, Archive } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { pdfToImages, downloadFile, formatBytes, createBlobFromBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface PdfToImageToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function PdfToImageTool({ initialFile, onBack, onAddActivity, onSendToTool }: PdfToImageToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [format, setFormat] = useState<'png' | 'jpeg'>('png')
  const [scale, setScale] = useState<number>(1.5)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [result, setResult] = useState<{
    images: { name: string; buffer: Uint8Array; type: string; previewUrl: string }[]
    zipData: Uint8Array
  } | null>(null)
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
    setProgress(null)
    try {
      const res = await pdfToImages(file.buffer, {
        format,
        scale,
        onProgress: (current, total) => setProgress({ current, total }),
      })
      const mapped = res.images.map((img) => ({
        name: img.name,
        buffer: img.buffer,
        type: img.type,
        previewUrl: URL.createObjectURL(createBlobFromBytes(img.buffer, img.type)),
      }))
      setResult({ images: mapped, zipData: res.zipData })

      onAddActivity?.({
        tool: 'PDF to PNG',
        fileName: `${file.name} (${mapped.length} images)`,
        timestamp: Date.now(),
        size: res.zipData.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to convert PDF pages to images.')
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ToolHeader
          title="PDF to"
          highlight="PNG"
          description={`Rendered ${result.images.length} ${result.images.length === 1 ? 'page' : 'pages'} from ${file?.name}.`}
          onBack={() => {
            setResult(null)
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm min-w-0">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-gray-900 dark:text-white truncate">
              {result.images.length} {result.images.length === 1 ? 'Page' : 'Pages'} Converted to {format.toUpperCase()}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Archive size: {formatBytes(result.zipData.byteLength)}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() =>
                downloadFile(
                  result.zipData,
                  `${file?.name.replace('.pdf', '')}-${format}-pages.zip`,
                  'application/zip'
                )
              }
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-lime-500 hover:bg-lime-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-lime-500/20 active:scale-95 transition-all"
            >
              <Archive size={16} /> Download All (ZIP)
            </button>
            <button
              onClick={() => {
                setResult(null)
                setFile(null)
              }}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 uppercase tracking-wider px-2 py-1"
            >
              Process Another
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {result.images.map((img, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between group shadow-sm hover:border-lime-500/30 transition-all"
            >
              <div className="h-40 bg-gray-50 dark:bg-zinc-800/40 rounded-xl overflow-hidden flex items-center justify-center mb-3 p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between min-w-0 gap-2">
                <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 truncate flex-1" title={img.name}>
                  {img.name}
                </span>
                <button
                  onClick={() => downloadFile(img.buffer, img.name, img.type)}
                  className="p-1.5 text-gray-400 hover:text-lime-500 rounded-lg hover:bg-lime-50 dark:hover:bg-lime-950/30 transition-colors shrink-0"
                  title="Download Image"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <PrivacyBadge />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="PDF to"
        highlight="PNG"
        description="Convert every page of your PDF into high-resolution PNG images with crystal clear fidelity."
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
          className={`border-2 border-dashed rounded-[2.5rem] p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-lime-500 bg-lime-50/50 dark:bg-lime-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-lime-400 dark:hover:border-lime-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-lime-50 dark:bg-lime-900/20 text-lime-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to convert
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Generate high-resolution PNG or JPEG pages
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-lime-500 hover:bg-lime-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-lime-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-4 sm:p-6 flex items-center justify-between gap-3 shadow-sm min-w-0 max-w-full">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-lime-50 dark:bg-lime-900/20 text-lime-500 flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate block" title={file.name}>
                  {file.name}
                </h4>
                <p className="text-xs text-gray-400 font-medium truncate">
                  {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} • {formatBytes(file.size)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setFile(null)}
              className="shrink-0 text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-wider px-2 py-1"
            >
              Change File
            </button>
          </div>

          {/* Configuration */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Image Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'png', label: 'PNG', sub: 'Lossless Quality' },
                    { id: 'jpeg', label: 'JPEG', sub: 'Compact Size' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center text-center ${
                        format === f.id
                          ? 'border-lime-500 bg-lime-50 text-lime-600 dark:bg-lime-950/30 dark:text-lime-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="leading-tight">{f.label}</span>
                      <span className="text-[10px] opacity-75 font-normal leading-tight mt-0.5">{f.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Resolution / Quality
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 1.0, label: '100%', sub: 'Standard' },
                    { val: 1.5, label: '150%', sub: 'Medium' },
                    { val: 2.0, label: '200%', sub: 'HD' },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setScale(s.val)}
                      className={`py-2.5 px-1.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center text-center ${
                        scale === s.val
                          ? 'border-lime-500 bg-lime-50 text-lime-600 dark:bg-lime-950/30 dark:text-lime-400'
                          : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="leading-tight">{s.label}</span>
                      <span className="text-[10px] opacity-75 font-normal leading-tight mt-0.5">{s.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConvert}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-lime-500 hover:bg-lime-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-lime-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {progress
                    ? `Rendering Page ${progress.current} of ${progress.total}...`
                    : 'Rendering Pages with PDF Engine...'}
                </>
              ) : (
                <>
                  <FileImage size={18} /> Convert {file.pageCount} {file.pageCount === 1 ? 'Page' : 'Pages'} to {format.toUpperCase()}
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
