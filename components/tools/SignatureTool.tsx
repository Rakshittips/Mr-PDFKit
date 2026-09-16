'use client'

import React, { useState, useRef, useEffect } from 'react'
import { PenTool, FileText, Loader2, UploadCloud, Eraser, Check } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { addSignature, formatBytes } from '@/lib/pdfEngine'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

interface SignatureToolProps {
  initialFile?: PipelinedFile | null
  onBack?: () => void
  onAddActivity?: (activity: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

export default function SignatureTool({ initialFile, onBack, onAddActivity, onSendToTool }: SignatureToolProps) {
  const [file, setFile] = useState<{ name: string; size: number; pageCount: number; buffer: Uint8Array } | null>(null)
  const [targetPage, setTargetPage] = useState(1)
  const [penColor, setPenColor] = useState<'#000000' | '#1e3a8a' | '#dc2626'>('#000000')
  const [sigMode, setSigMode] = useState<'draw' | 'upload'>('draw')
  const [posX, setPosX] = useState(70) // percentage
  const [posY, setPosY] = useState(10) // percentage
  const [sigWidth, setSigWidth] = useState(140)
  const [sigHeight, setSigHeight] = useState(60)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultBuffer, setResultBuffer] = useState<Uint8Array | null>(null)
  const [uploadedSig, setUploadedSig] = useState<{ buffer: Uint8Array; type: 'png' | 'jpeg' } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sigImgInputRef = useRef<HTMLInputElement>(null)

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

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasDrawn(true)
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = penColor
    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSigImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const buffer = new Uint8Array(await f.arrayBuffer())
    const type = f.type.includes('png') ? 'png' : 'jpeg'
    setUploadedSig({ buffer, type })
  }

  const handleApply = async () => {
    if (!file) return

    let imageBuffer: Uint8Array | null = null
    let imageType: 'png' | 'jpeg' = 'png'

    if (sigMode === 'draw') {
      const canvas = canvasRef.current
      if (!canvas || !hasDrawn) {
        alert('Please draw your signature first.')
        return
      }
      const dataUrl = canvas.toDataURL('image/png')
      const base64 = dataUrl.split(',')[1]
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      imageBuffer = bytes
      imageType = 'png'
    } else {
      if (!uploadedSig) {
        alert('Please upload a signature image.')
        return
      }
      imageBuffer = uploadedSig.buffer
      imageType = uploadedSig.type
    }

    setLoading(true)
    try {
      const signed = await addSignature(file.buffer, {
        pageIndex: targetPage - 1,
        imageBuffer,
        imageType,
        x: posX,
        y: posY,
        width: sigWidth,
        height: sigHeight,
      })
      setResultBuffer(signed)
      const outName = `${file.name.replace('.pdf', '')}-signed.pdf`
      onAddActivity?.({
        tool: 'Signature',
        fileName: outName,
        timestamp: Date.now(),
        size: signed.byteLength,
      })
    } catch (err) {
      console.error(err)
      alert('Failed to stamp signature onto PDF.')
    } finally {
      setLoading(false)
    }
  }

  if (resultBuffer) {
    return (
      <SuccessState
        message="Signature Applied Successfully!"
        buffer={resultBuffer}
        fileName={`${file?.name.replace('.pdf', '')}-signed.pdf`}
        originalSize={file?.size}
        onStartOver={() => {
          setResultBuffer(null)
          setFile(null)
          clearCanvas()
          setUploadedSig(null)
        }}
        onSendToTool={onSendToTool}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <ToolHeader
        title="Sign"
        highlight="PDF"
        description="Draw your digital signature or upload an image stamp, then position it precisely on any document page."
        onBack={onBack}
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-[2.5rem] p-12 text-center cursor-pointer transition-all border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-pink-400 dark:hover:border-pink-500"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileInput(e.target.files)}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <div className="w-20 h-20 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={36} />
          </div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Select or drop a PDF to sign
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 font-medium">
            Place your official electronic signature on the document
          </p>
          <button
            type="button"
            className="px-6 py-3.5 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
          >
            Browse PDF
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center">
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

          {/* Signature creation and configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Pad */}
            <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSigMode('draw')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        sigMode === 'draw'
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      Draw Signature
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigMode('upload')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        sigMode === 'upload'
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400'
                      }`}
                    >
                      Upload Stamp
                    </button>
                  </div>

                  {sigMode === 'draw' && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 font-bold"
                      title="Clear drawing"
                    >
                      <Eraser size={14} /> Clear
                    </button>
                  )}
                </div>

                {sigMode === 'draw' ? (
                  <div>
                    <div className="border border-gray-200 dark:border-zinc-700 rounded-2xl overflow-hidden bg-white touch-none">
                      <canvas
                        ref={canvasRef}
                        width={360}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-40 cursor-crosshair block"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-gray-400 font-semibold">
                        Sign inside the box above
                      </span>
                      <div className="flex items-center gap-2">
                        {[
                          { color: '#000000', label: 'Black' },
                          { color: '#1e3a8a', label: 'Blue' },
                          { color: '#dc2626', label: 'Red' },
                        ].map((c) => (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setPenColor(c.color as any)}
                            style={{ backgroundColor: c.color }}
                            className={`w-6 h-6 rounded-full transition-transform ${
                              penColor === c.color ? 'ring-2 ring-pink-500 ring-offset-2 scale-110' : 'opacity-70'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => sigImgInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-2xl p-8 text-center cursor-pointer hover:border-pink-500 transition-colors"
                  >
                    <input
                      type="file"
                      ref={sigImgInputRef}
                      onChange={handleSigImageUpload}
                      accept="image/png,image/jpeg"
                      className="hidden"
                    />
                    {uploadedSig ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-sm">
                        <Check size={18} /> Signature Image Loaded
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={28} className="mx-auto text-gray-400 mb-2" />
                        <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 block">
                          Upload transparent PNG or JPG signature
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Placement settings */}
            <div className="bg-white dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Placement & Page Settings
              </h4>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Target Page
                </label>
                <select
                  value={targetPage}
                  onChange={(e) => setTargetPage(parseInt(e.target.value, 10))}
                  className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-pink-500"
                >
                  {Array.from({ length: file.pageCount }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Page {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Horizontal Position: {posX}%
                </label>
                <input
                  type="range"
                  min={5}
                  max={85}
                  value={posX}
                  onChange={(e) => setPosX(parseInt(e.target.value, 10))}
                  className="w-full accent-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Vertical Position: {posY}% from bottom
                </label>
                <input
                  type="range"
                  min={5}
                  max={85}
                  value={posY}
                  onChange={(e) => setPosY(parseInt(e.target.value, 10))}
                  className="w-full accent-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Width: {sigWidth}pt
                  </label>
                  <input
                    type="range"
                    min={80}
                    max={250}
                    value={sigWidth}
                    onChange={(e) => setSigWidth(parseInt(e.target.value, 10))}
                    className="w-full accent-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Height: {sigHeight}pt
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={120}
                    value={sigHeight}
                    onChange={(e) => setSigHeight(parseInt(e.target.value, 10))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleApply}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Stamping Signature...
                </>
              ) : (
                <>
                  <PenTool size={18} /> Apply Signature to Page {targetPage}
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
