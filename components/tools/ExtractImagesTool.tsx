'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Images, Download, FileText, Loader2, UploadCloud, Archive } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { extractImagesFromPdf, downloadFile, formatBytes, createBlobFromBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface ExtractImagesToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function ExtractImagesTool({ initialFile, onBack, onAddActivity, onSendToTool }: ExtractImagesToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<{ name: string; buffer: Uint8Array; type: string; previewUrl: string }[]>([])
  const [zipBuffer, setZipBuffer] = useState<Uint8Array | null>(null)
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

  const handleExtract = async () => {
    if (!file) return
    setLoading(true)
    try {
      const res = await extractImagesFromPdf(file.buffer)
      if (res.images.length === 0) {
        alert('No embedded images found in this PDF document.')
        setLoading(false)
        return
      }

      const mapped = res.images.map((img) => ({
        name: img.name,
        buffer: img.buffer,
        type: img.type,
        previewUrl: URL.createObjectURL(createBlobFromBytes(img.buffer, img.type)),
      }))
      setImages(mapped)
      setZipBuffer(res.zipData)

      onAddActivity?.({
        tool: 'Extract Images',
        fileName: `${file.name} (${res.images.length} images)`,
        timestamp: Date.now(),
        size: res.zipData.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to extract images from PDF.')
    } finally {
      setLoading(false)
    }
  }

  if (zipBuffer && images.length > 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <ToolHeader
          title="Extracted"
          highlight="Images"
          description={`Successfully pulled ${images.length} images from ${file?.name}.`}
          onBack={() => {
            setImages([])
            setZipBuffer(null)
          }}
        />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              {images.length} Images Extracted
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Total ZIP size: {formatBytes(zipBuffer.byteLength)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => downloadFile(zipBuffer, `${file?.name.replace('.pdf', '')}-images.zip`, 'application/zip')}
              className="flex items-center gap-2 px-6 py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
            >
              <Archive size={16} /> Download All (ZIP)
            </button>
            <button
              onClick={() => {
                setImages([])
                setZipBuffer(null)
                setFile(null)
              }}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 uppercase tracking-wider"
            >
              Process Another
            </button>
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-2xl p-3 flex flex-col justify-between group shadow-sm hover:border-yellow-500/30 transition-all"
            >
              <div className="h-36 bg-gray-50 dark:bg-zinc-800/40 rounded-xl overflow-hidden flex items-center justify-center mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 dark:text-zinc-300 truncate max-w-[120px]">
                  {img.name}
                </span>
                <button
                  onClick={() => downloadFile(img.buffer, img.name, img.type)}
                  className="p-1.5 text-gray-400 hover:text-yellow-500 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-950/30 transition-colors"
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
        title="Extract"
        highlight="Images"
        description="Extract all embedded photography, illustrations, and figures from your PDF documents in full original quality."
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
              ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-yellow-400 dark:hover:border-yellow-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to extract images
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Pull out embedded photos, graphics, and figures
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 flex items-center justify-center">
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
                Scan & Extract All Graphic Assets
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                PaperKnife will inspect the raw XObject dictionary and streams to recover every embedded JPG and PNG.
              </p>
            </div>

            <button
              onClick={handleExtract}
              disabled={loading}
              className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-yellow-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Scanning Document...
                </>
              ) : (
                <>
                  <Images size={18} /> Extract Images Now
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
