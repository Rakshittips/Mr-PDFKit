'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Tags, ShieldAlert, FileText, Loader2, UploadCloud, CheckCircle2 } from 'lucide-react'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { getMetadata, editMetadata, formatBytes, PdfMetadata } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface MetadataToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function MetadataTool({ initialFile, onBack, onAddActivity, onSendToTool }: MetadataToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; buffer: Uint8Array } | null>(null)
  const [meta, setMeta] = useState<PdfMetadata>({
    title: '',
    author: '',
    subject: '',
    keywords: [],
    creator: '',
    producer: '',
  })
  const [keywordStr, setKeywordStr] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBuffer = async (buffer: Uint8Array, name: string) => {
    try {
      const data = await getMetadata(buffer)
      setFile({ name, size: buffer.byteLength, buffer })
      setMeta({
        title: data.title || '',
        author: data.author || '',
        subject: data.subject || '',
        keywords: data.keywords || [],
        creator: data.creator || '',
        producer: data.producer || '',
      })
      setKeywordStr((data.keywords || []).join(', '))
    } catch {
      alert('Could not read PDF metadata.')
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

  const handleSave = async (sanitize = false) => {
    if (!file) return
    setLoading(true)
    try {
      const kw = keywordStr.split(',').map((k) => k.trim()).filter(Boolean)
      const updated = await editMetadata(
        file.buffer,
        {
          title: meta.title,
          author: meta.author,
          subject: meta.subject,
          keywords: kw,
          creator: meta.creator,
          producer: meta.producer,
        },
        sanitize
      )
      setResultBuffer(updated)
      const outName = `${file.name.replace('.pdf', '')}-${sanitize ? 'sanitized' : 'metadata'}.pdf`
      onAddActivity?.({
        tool: 'Metadata',
        fileName: outName,
        timestamp: Date.now(),
        size: updated.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to update metadata.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="PDF Metadata Updated Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-updated.pdf`}
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
        title="PDF"
        highlight="Metadata"
        description="Inspect and edit hidden PDF metadata (Title, Author, Producer) or sanitize all personal identifiers for complete anonymity."
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
              ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/20 scale-[1.01]'
              : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-cyan-400 dark:hover:border-cyan-500'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to view metadata
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Inspect hidden author tags and sanitize your documents
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 flex items-center justify-center">
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

          {/* Form */}
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                Document Properties
              </span>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
              >
                <ShieldAlert size={14} />
                Sanitize All (Remove All Data)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={meta.title}
                  onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                  placeholder="Document Title"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={meta.author}
                  onChange={(e) => setMeta({ ...meta, author: e.target.value })}
                  placeholder="Author Name"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={meta.subject}
                  onChange={(e) => setMeta({ ...meta, subject: e.target.value })}
                  placeholder="Document Subject"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={keywordStr}
                  onChange={(e) => setKeywordStr(e.target.value)}
                  placeholder="pdf, report, confidential"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Creator Application
                </label>
                <input
                  type="text"
                  value={meta.creator}
                  onChange={(e) => setMeta({ ...meta, creator: e.target.value })}
                  placeholder="e.g. PaperKnife"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Producer / Generator
                </label>
                <input
                  type="text"
                  value={meta.producer}
                  onChange={(e) => setMeta({ ...meta, producer: e.target.value })}
                  placeholder="e.g. PaperKnife Zero-Server"
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Saving Metadata...
                </>
              ) : (
                <>
                  <Tags size={18} /> Update Document Properties
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
