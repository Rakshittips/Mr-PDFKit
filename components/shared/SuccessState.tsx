'use client'

import React, { useState } from 'react'
import { Download, CheckCircle2, Share2, RotateCcw, ArrowRight, Eye, Sparkles } from 'lucide-react'
import { downloadFile, formatBytes, createBlobFromBytes } from '@/lib/pdfEngine'
import { toolsData } from '@/lib/toolsData'

interface SuccessStateProps {
  message: string
  buffer: Uint8Array
  fileName: string
  mimeType?: string
  originalSize?: number
  onStartOver: () => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function SuccessState({
  message,
  buffer,
  fileName,
  mimeType = 'application/pdf',
  originalSize,
  onStartOver,
  onSendToTool,
}: SuccessStateProps) {
  const [showPipelineDropdown, setShowPipelineDropdown] = useState(false)
  const currentSize = buffer.byteLength
  const savings = originalSize && originalSize > currentSize
    ? Math.round(((originalSize - currentSize) / originalSize) * 100)
    : null

  const handleDownload = () => {
    downloadFile(buffer, fileName, mimeType)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        const file = new File([createBlobFromBytes(buffer, mimeType)], fileName, { type: mimeType })
        await navigator.share({
          files: [file],
          title: fileName,
          text: 'Processed securely with PaperKnife',
        })
      } else {
        handleDownload()
      }
    } catch {
      handleDownload()
    }
  }

  const handlePreview = () => {
    const blob = createBlobFromBytes(buffer, mimeType)
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-xl mx-auto text-center py-8 px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/10">
        <CheckCircle2 size={40} className="animate-bounce" />
      </div>

      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
        {message}
      </h2>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full text-xs font-semibold text-gray-600 dark:text-zinc-300 mb-6">
        <span className="truncate max-w-[220px]">{fileName}</span>
        <span>•</span>
        <span>{formatBytes(currentSize)}</span>
        {savings !== null && savings > 0 && (
          <span className="text-emerald-500 font-bold">(-{savings}%)</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
        >
          <Download size={18} strokeWidth={2.5} />
          Download {mimeType === 'application/zip' ? 'ZIP' : 'PDF'}
        </button>

        {mimeType === 'application/pdf' && (
          <button
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 px-5 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 text-gray-700 dark:text-zinc-200 rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
            title="Preview in new tab"
          >
            <Eye size={18} />
            Preview
          </button>
        )}

        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-5 py-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 text-gray-700 dark:text-zinc-200 rounded-2xl font-black uppercase text-xs tracking-wider transition-all"
          title="Share"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Pipeline: Continue editing in another tool */}
      {onSendToTool && mimeType === 'application/pdf' && (
        <div className="relative mb-6">
          <button
            onClick={() => setShowPipelineDropdown(!showPipelineDropdown)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 dark:bg-zinc-900/60 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-xs font-bold text-gray-600 dark:text-zinc-400 transition-all"
          >
            <Sparkles size={16} className="text-rose-500" />
            <span>Continue editing this file in another tool...</span>
            <ArrowRight size={14} className="ml-1" />
          </button>

          {showPipelineDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl p-2 z-30 max-h-60 overflow-y-auto grid grid-cols-2 gap-1 text-left">
              {toolsData
                .filter((t) => t.id !== 'image-to-pdf')
                .map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setShowPipelineDropdown(false)
                        onSendToTool(tool.id, buffer, fileName)
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 text-left transition-colors"
                    >
                      <div className={`p-1.5 rounded-lg ${tool.bg} ${tool.color}`}>
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate">
                        {tool.title}
                      </span>
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      )}

      <div>
        <button
          onClick={onStartOver}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-rose-500 transition-colors py-2"
        >
          <RotateCcw size={14} />
          Process another file
        </button>
      </div>
    </div>
  )
}
