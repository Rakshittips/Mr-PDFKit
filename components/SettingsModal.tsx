'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Settings,
  Moon,
  Sun,
  Laptop,
  ShieldCheck,
  Trash2,
  Github,
  Check,
  FileText,
  Database,
  ExternalLink,
} from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  onClearHistory?: () => void
  activityCount?: number
}

export default function SettingsModal({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  onClearHistory,
  activityCount = 0,
}: SettingsModalProps) {
  const [defaultPageSize, setDefaultPageSize] = useState<'a4' | 'letter'>('a4')
  const [historyClearedMsg, setHistoryClearedMsg] = useState(false)

  useEffect(() => {
    try {
      const savedPageSize = localStorage.getItem('mrpdfkit-pagesize')
      if (savedPageSize === 'letter' || savedPageSize === 'a4') {
        setDefaultPageSize(savedPageSize)
      }
    } catch {
      // ignore
    }
  }, [])

  if (!isOpen) return null

  const handlePageSizeChange = (val: 'a4' | 'letter') => {
    setDefaultPageSize(val)
    try {
      localStorage.setItem('mrpdfkit-pagesize', val)
    } catch {
      // ignore
    }
  }

  const handleClearHistoryClick = () => {
    if (onClearHistory) {
      onClearHistory()
      setHistoryClearedMsg(true)
      setTimeout(() => setHistoryClearedMsg(false), 2500)
    }
  }

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        id="settings-modal-card"
        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-500">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 dark:text-white">
                Settings
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Mr PDFKit Preferences & Storage
              </p>
            </div>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Appearance & Theme */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Appearance
          </label>
          <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              {darkMode ? (
                <Moon size={18} className="text-rose-500" />
              ) : (
                <Sun size={18} className="text-amber-500" />
              )}
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">
                  Dark Mode
                </div>
                <div className="text-[11px] text-gray-400">
                  {darkMode ? 'Dark canvas enabled' : 'Clean light canvas enabled'}
                </div>
              </div>
            </div>
            <button
              id="toggle-dark-mode-settings"
              onClick={onToggleDarkMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                darkMode
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-700 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-600'
              }`}
            >
              {darkMode ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>

        {/* Section 2: Default Document Settings */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Document Defaults
          </label>
          <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white">
                <FileText size={15} className="text-rose-500" />
                Default Page Standard
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handlePageSizeChange('a4')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    defaultPageSize === 'a4'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'
                  }`}
                >
                  A4
                </button>
                <button
                  onClick={() => handlePageSizeChange('letter')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    defaultPageSize === 'letter'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-300'
                  }`}
                >
                  US Letter
                </button>
              </div>
            </div>
            <p className="text-[11px] text-gray-400">
              Used when generating new PDF pages, exports, or blank canvases.
            </p>
          </div>
        </div>

        {/* Section 3: Privacy & Local Storage */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Privacy & Local Storage
          </label>
          <div className="p-3.5 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl border border-gray-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  Zero-Server Execution Guarantee
                </div>
                <div className="text-gray-500 dark:text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                  Your PDF documents are parsed and edited purely in device memory. No files or metadata are uploaded to any server.
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200/60 dark:border-zinc-700/60 flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-zinc-300 flex items-center gap-1.5 font-medium">
                <Database size={14} className="text-gray-400" />
                <span>History Items ({activityCount})</span>
              </div>
              <button
                onClick={handleClearHistoryClick}
                disabled={activityCount === 0}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                <Trash2 size={13} />
                {historyClearedMsg ? 'Cleared!' : 'Clear Log'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: About & Links */}
        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 font-semibold">
            <span>Mr PDFKit</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-black">
              v2.0
            </span>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300 hover:text-rose-500 dark:hover:text-rose-400 font-bold transition-colors"
          >
            <Github size={14} />
            <span>GitHub</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
