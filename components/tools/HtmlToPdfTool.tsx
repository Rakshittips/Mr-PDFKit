'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Globe,
  Code,
  Upload,
  Sparkles,
  Loader2,
  RefreshCw,
  Sliders,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Eye,
} from 'lucide-react'
import ToolHeader from '../shared/ToolHeader'
import PrivacyBadge from '../shared/PrivacyBadge'
import SuccessState from '../shared/SuccessState'
import { convertHtmlElementToPdf } from '@/lib/pdfEngine'
import { ActivityEntry } from '@/lib/types'

interface HtmlToPdfToolProps {
  onBack: () => void
  onAddActivity: (act: Omit<ActivityEntry, 'id'>) => void
  onSendToTool?: (toolId: string, buffer: Uint8Array, fileName: string) => void
}

type InputMode = 'url' | 'code' | 'upload'

const HTML_PRESETS = [
  {
    id: 'invoice',
    name: 'Modern Invoice',
    html: `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 32px; color: #1e293b; background: #ffffff;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 32px;">
    <div>
      <h1 style="font-size: 28px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;">INVOICE</h1>
      <p style="color: #64748b; margin: 0; font-size: 14px;">Invoice #: <strong style="color: #334155;">INV-2026-089</strong></p>
      <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Date: <strong>March 16, 2026</strong></p>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 20px; font-weight: 800; color: #e11d48; margin-bottom: 4px;">Acme Digital Inc.</div>
      <p style="color: #64748b; margin: 0; font-size: 13px; line-height: 1.5;">100 Innovation Way, Suite 400<br/>San Francisco, CA 94105<br/>billing@acmedigital.io</p>
    </div>
  </div>

  <div style="display: flex; justify-content: space-between; margin-bottom: 32px; background: #f8fafc; padding: 20px; border-radius: 12px;">
    <div>
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px;">Billed To</div>
      <div style="font-weight: 700; color: #0f172a; font-size: 16px;">Apex Ventures LLC</div>
      <div style="color: #64748b; font-size: 13px; margin-top: 4px; line-height: 1.4;">Attn: Sarah Jenkins<br/>452 Market St, New York, NY 10001</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 6px;">Payment Details</div>
      <div style="color: #334155; font-size: 13px;">Due Date: <strong>April 15, 2026</strong></div>
      <div style="color: #334155; font-size: 13px; margin-top: 4px;">Terms: <strong>Net 30 Days</strong></div>
    </div>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
    <thead>
      <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
        <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Description</th>
        <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: center;">Hours</th>
        <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: right;">Rate</th>
        <th style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px; font-size: 14px; font-weight: 600; color: #1e293b;">Core Web Platform Development<br/><span style="font-size: 12px; color: #64748b; font-weight: 400;">Full-stack React & Next.js architecture implementation</span></td>
        <td style="padding: 16px; font-size: 14px; color: #475569; text-align: center;">40</td>
        <td style="padding: 16px; font-size: 14px; color: #475569; text-align: right;">$150.00</td>
        <td style="padding: 16px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">$6,000.00</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px; font-size: 14px; font-weight: 600; color: #1e293b;">Client-Side PDF Processing Engine<br/><span style="font-size: 12px; color: #64748b; font-weight: 400;">Zero-server document security & manipulation module</span></td>
        <td style="padding: 16px; font-size: 14px; color: #475569; text-align: center;">25</td>
        <td style="padding: 16px; font-size: 14px; color: #475569; text-align: right;">$160.00</td>
        <td style="padding: 16px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">$4,000.00</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 16px; font-size: 14px; font-weight: 600; color: #1e293b;">Responsive UI / UX Design & Testing<br/><span style="font-size: 12px; color: #64748b; font-weight: 400;">Accessible mobile and desktop adaptive layout verification</span></td>
        <td style="padding: 16px; font-size: 14px; color: #475569; text-align: center;">15</td>
        <td style="padding: 16px; font-size: 14px; color: #475569; text-align: right;">$140.00</td>
        <td style="padding: 16px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">$2,100.00</td>
      </tr>
    </tbody>
  </table>

  <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
    <div style="width: 280px; background: #f8fafc; padding: 20px; border-radius: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; color: #64748b;">
        <span>Subtotal:</span>
        <span style="font-weight: 600; color: #334155;">$12,100.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #64748b;">
        <span>Tax (0% B2B):</span>
        <span style="font-weight: 600; color: #334155;">$0.00</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #e2e8f0; font-size: 18px; font-weight: 800; color: #0f172a;">
        <span>Total Due:</span>
        <span style="color: #e11d48;">$12,100.00</span>
      </div>
    </div>
  </div>

  <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; text-align: center; color: #94a3b8; font-size: 12px;">
    Thank you for your business! Please remit payment via ACH or wire transfer within 30 days.
  </div>
</div>`,
  },
  {
    id: 'report',
    name: 'Executive Report',
    html: `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #0f172a; background: #ffffff;">
  <div style="border-left: 6px solid #2563eb; padding-left: 20px; margin-bottom: 36px;">
    <span style="text-transform: uppercase; font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #2563eb;">Quarterly Performance Review</span>
    <h1 style="font-size: 32px; font-weight: 900; margin: 6px 0 0 0; color: #1e293b;">Q1 2026 Executive Summary</h1>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 36px;">
    <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border: 1px solid #dbeafe;">
      <div style="font-size: 12px; font-weight: 600; color: #3b82f6;">Active Users</div>
      <div style="font-size: 28px; font-weight: 800; color: #1e3a8a; margin-top: 4px;">428,950</div>
      <div style="font-size: 12px; color: #16a34a; margin-top: 4px; font-weight: 600;">+24.8% vs last quarter</div>
    </div>
    <div style="background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7;">
      <div style="font-size: 12px; font-weight: 600; color: #16a34a;">Documents Processed</div>
      <div style="font-size: 28px; font-weight: 800; color: #14532d; margin-top: 4px;">1,842,100</div>
      <div style="font-size: 12px; color: #16a34a; margin-top: 4px; font-weight: 600;">100% Client-Side Privacy</div>
    </div>
    <div style="background: #faf5ff; padding: 20px; border-radius: 12px; border: 1px solid #f3e8ff;">
      <div style="font-size: 12px; font-weight: 600; color: #9333ea;">Avg. Processing Latency</div>
      <div style="font-size: 28px; font-weight: 800; color: #581c87; margin-top: 4px;">320 ms</div>
      <div style="font-size: 12px; color: #16a34a; margin-top: 4px; font-weight: 600;">Fast local WASM/JS</div>
    </div>
  </div>

  <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #1e293b;">Key Strategic Takeaways</h2>
  <p style="font-size: 15px; line-height: 1.7; color: #475569; margin-bottom: 20px;">
    Document processing in 2026 has definitively transitioned towards privacy-centric, on-device compute. Customers in legal, healthcare, and enterprise banking environments require complete cryptographic isolation where their data never leaves the client device.
  </p>
  <ul style="font-size: 14px; line-height: 1.8; color: #334155; margin-bottom: 32px;">
    <li><strong>Client-Side Resilience:</strong> Eliminates server bandwidth expenses and data breach liabilities.</li>
    <li><strong>Broad Format Compatibility:</strong> Unified workflows spanning PDF, HTML, raster graphics, and structured forms.</li>
    <li><strong>Continuous Offline Availability:</strong> Full execution capacity even when operating in disconnected or air-gapped networks.</li>
  </ul>
</div>`,
  },
  {
    id: 'certificate',
    name: 'Certificate of Completion',
    html: `<div style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 48px 36px; border: 12px double #e2e8f0; background: #ffffff; text-align: center; color: #1e293b;">
  <div style="text-transform: uppercase; font-size: 14px; letter-spacing: 4px; color: #64748b; font-weight: 600; margin-bottom: 16px;">Certificate of Achievement</div>
  <h1 style="font-size: 38px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; font-family: 'Times New Roman', serif;">Mr PDFKit Digital Certification</h1>
  <p style="font-size: 16px; color: #64748b; font-style: italic; margin-bottom: 24px;">This certifies that</p>
  <div style="font-size: 32px; font-weight: 700; color: #e11d48; border-bottom: 2px solid #e11d48; display: inline-block; padding-bottom: 8px; margin-bottom: 24px; min-width: 320px;">Alex Morgan</div>
  <p style="font-size: 16px; line-height: 1.6; color: #334155; max-width: 540px; margin: 0 auto 40px auto;">
    has successfully completed the advanced course on <strong>Secure Local PDF Engineering & Document Cryptography</strong>.
  </p>
  <div style="display: flex; justify-content: space-around; margin-top: 48px; padding-top: 24px;">
    <div style="text-align: center; width: 200px;">
      <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 8px; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #334155;">Elena Vance</div>
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Program Director</div>
    </div>
    <div style="text-align: center; width: 200px;">
      <div style="border-bottom: 1px solid #94a3b8; margin-bottom: 8px; font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #334155;">March 2026</div>
      <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">Date Issued</div>
    </div>
  </div>
</div>`,
  },
]

export default function HtmlToPdfTool({ onBack, onAddActivity, onSendToTool }: HtmlToPdfToolProps) {
  const [mode, setMode] = useState<InputMode>('url')
  const [urlInput, setUrlInput] = useState('https://example.com')
  const [htmlContent, setHtmlContent] = useState(HTML_PRESETS[0].html)
  const [documentTitle, setDocumentTitle] = useState('webpage-document')

  // Layout Configuration
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [marginSize, setMarginSize] = useState<number>(20)
  const [quality, setQuality] = useState<number>(2)

  // Loading and State
  const [isFetchingUrl, setIsFetchingUrl] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [fetchSuccessMsg, setFetchSuccessMsg] = useState<string | null>(null)

  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState<string>('')
  const [result, setResult] = useState<{ buffer: Uint8Array; pageCount: number; fileName: string } | null>(null)

  const previewContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch URL content via server route to avoid browser CORS blocks
  const handleFetchUrl = async (targetUrl?: string) => {
    const urlToFetch = targetUrl || urlInput.trim()
    if (!urlToFetch) return

    setIsFetchingUrl(true)
    setFetchError(null)
    setFetchSuccessMsg(null)

    try {
      let finalUrl = urlToFetch
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl
        setUrlInput(finalUrl)
      }

      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: finalUrl }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch webpage.')
      }

      setHtmlContent(data.html)
      if (data.title) {
        const cleanTitle = data.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
        setDocumentTitle(cleanTitle || 'website-page')
      }
      setFetchSuccessMsg(`Loaded "${data.title || finalUrl}" successfully!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch website'
      setFetchError(msg)
    } finally {
      setIsFetchingUrl(false)
    }
  }

  // Handle uploaded .html file
  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setHtmlContent(text)
        const baseName = file.name.replace(/\.[^/.]+$/, '')
        setDocumentTitle(baseName)
        setFetchSuccessMsg(`Loaded file "${file.name}"`)
        setFetchError(null)
      }
    }
    reader.readAsText(file)
  }

  // Convert rendered HTML element to PDF
  const handleConvertToPdf = async () => {
    if (!previewContainerRef.current) return
    setIsConverting(true)
    setConversionProgress('Rendering document to high-resolution canvas...')

    try {
      await new Promise((r) => setTimeout(r, 100))

      setConversionProgress('Generating vector PDF layout...')
      const { buffer, pageCount } = await convertHtmlElementToPdf(previewContainerRef.current, {
        pageSize,
        orientation,
        margin: marginSize,
        quality,
      })

      const outName = `${documentTitle.trim() || 'document'}.pdf`
      setResult({
        buffer,
        pageCount,
        fileName: outName,
      })

      onAddActivity({
        tool: 'HTML to PDF',
        fileName: outName,
        timestamp: Date.now(),
        size: buffer.byteLength,
      })
    } catch (err: unknown) {
      alert('Error during conversion: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsConverting(false)
      setConversionProgress('')
    }
  }

  if (result) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SuccessState
          message={`Successfully converted HTML into a ${result.pageCount}-page PDF document!`}
          buffer={result.buffer}
          fileName={result.fileName}
          onStartOver={() => setResult(null)}
          onSendToTool={onSendToTool}
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ToolHeader
        title="HTML & Website"
        highlight="to PDF"
        description="Convert any public website URL, raw HTML code, or local web document into high-fidelity PDF documents."
        onBack={onBack}
      />

      <div className="mb-6 flex justify-center">
        <PrivacyBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input and Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mode Switcher */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-2 shadow-sm flex">
            <button
              onClick={() => setMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'url'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Globe size={16} />
              Website URL
            </button>
            <button
              onClick={() => setMode('code')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'code'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Code size={16} />
              HTML Editor
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                mode === 'upload'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Upload size={16} />
              Upload .html
            </button>
          </div>

          {/* Mode 1: URL Input */}
          {mode === 'url' && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Enter Website URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFetchUrl()
                  }}
                  placeholder="https://example.com"
                  className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
                <button
                  onClick={() => handleFetchUrl()}
                  disabled={isFetchingUrl || !urlInput.trim()}
                  className="px-5 py-3 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-sm rounded-2xl hover:bg-rose-500 dark:hover:bg-rose-500 dark:hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {isFetchingUrl ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Fetch
                </button>
              </div>

              {/* Quick sample websites */}
              <div>
                <span className="text-xs text-gray-400 dark:text-zinc-500 block mb-2 font-medium">Quick Examples:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setUrlInput('https://example.com')
                      handleFetchUrl('https://example.com')
                    }}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 text-xs font-semibold text-gray-600 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    example.com
                  </button>
                  <button
                    onClick={() => {
                      setUrlInput('https://news.ycombinator.com')
                      handleFetchUrl('https://news.ycombinator.com')
                    }}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 text-xs font-semibold text-gray-600 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    news.ycombinator.com
                  </button>
                  <button
                    onClick={() => {
                      setUrlInput('https://en.wikipedia.org/wiki/PDF')
                      handleFetchUrl('https://en.wikipedia.org/wiki/PDF')
                    }}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800 text-xs font-semibold text-gray-600 dark:text-zinc-300 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Wikipedia (PDF)
                  </button>
                </div>
              </div>

              {fetchError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{fetchError}</span>
                </div>
              )}

              {fetchSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <FileCheck size={16} className="shrink-0 mt-0.5" />
                  <span>{fetchSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: HTML Editor & Presets */}
          {mode === 'code' && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Select Preset Template
                </label>
                <span className="text-xs text-rose-500 font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  Live Preview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {HTML_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setHtmlContent(preset.html)
                      setDocumentTitle(preset.id)
                    }}
                    className="p-2.5 bg-gray-50 dark:bg-zinc-800/70 hover:bg-gray-100 dark:hover:bg-zinc-700/80 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-200 transition-all text-center border border-gray-200/50 dark:border-zinc-700/50"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
                  HTML & Inline CSS Code
                </label>
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={9}
                  className="w-full p-4 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-2xl text-xs font-mono text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500 leading-relaxed"
                  placeholder="<div>Paste or write custom HTML here...</div>"
                />
              </div>
            </div>
          )}

          {/* Mode 3: Upload .html file */}
          {mode === 'upload' && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-zinc-800/30"
              >
                <Upload size={32} className="mx-auto text-gray-400 dark:text-zinc-500 mb-3" />
                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">
                  Click or drag and drop an HTML file
                </p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                  Supports standard .html and .htm files
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={handleHtmlFileUpload}
                  className="hidden"
                />
              </div>

              {fetchSuccessMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <FileCheck size={16} className="shrink-0 mt-0.5" />
                  <span>{fetchSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Page Formatting & PDF Configuration Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              <Sliders size={14} />
              PDF Page Settings
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  Page Format
                </label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-zinc-200"
                >
                  <option value="a4">A4 (Standard)</option>
                  <option value="letter">Letter (US)</option>
                  <option value="legal">Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-zinc-200"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  Page Margins
                </label>
                <select
                  value={marginSize}
                  onChange={(e) => setMarginSize(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-zinc-200"
                >
                  <option value={0}>None (0 pt)</option>
                  <option value={10}>Compact (10 pt)</option>
                  <option value={20}>Standard (20 pt)</option>
                  <option value={36}>Generous (36 pt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                  Resolution Scale
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-zinc-200"
                >
                  <option value={2}>High (2x Retina)</option>
                  <option value={1}>Standard (1x Fast)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">
                Output File Name
              </label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="document-name"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-gray-800 dark:text-zinc-200 font-mono"
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleConvertToPdf}
            disabled={isConverting || !htmlContent.trim()}
            className="w-full py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white font-black text-base rounded-2xl shadow-xl shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-3"
          >
            {isConverting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>{conversionProgress || 'Converting...'}</span>
              </>
            ) : (
              <>
                <Globe size={20} />
                <span>Convert to PDF</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Document Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-gray-400 dark:text-zinc-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Live Document Render
              </h3>
            </div>
            <div className="text-xs font-medium text-gray-400 dark:text-zinc-500">
              Format: {pageSize.toUpperCase()} &bull; {orientation}
            </div>
          </div>

          {/* Render Frame Window */}
          <div className="bg-gray-100 dark:bg-zinc-950 p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 overflow-x-auto min-h-[500px] flex justify-center items-start shadow-inner">
            <div
              id="html-render-target"
              ref={previewContainerRef}
              className="bg-white text-slate-900 shadow-2xl rounded-sm transition-all duration-200"
              style={{
                width: orientation === 'landscape' ? '842px' : '595px',
                minHeight: orientation === 'landscape' ? '595px' : '842px',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                color: '#0f172a',
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>

          <p className="text-xs text-center text-gray-400 dark:text-zinc-500">
            Preview is sized to real printable proportions. Multi-page web content will be automatically sliced with proper page margins.
          </p>
        </div>
      </div>
    </div>
  )
}
