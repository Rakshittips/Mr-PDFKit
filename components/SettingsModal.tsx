'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Settings,
  Moon,
  Sun,
  ShieldCheck,
  Trash2,
  Check,
  FileText,
  Database,
  ExternalLink,
  Heart,
  Sparkles,
  Sliders,
  Smartphone,
  Copy,
  ChevronLeft,
  ArrowLeft,
  User,
  Code2,
  Send,
  ChevronRight,
  Instagram,
  Youtube,
} from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  darkMode: boolean
  onToggleDarkMode: () => void
  onClearHistory?: () => void
  activityCount?: number
}

type TabType = 'about' | 'fuel' | 'preferences'
type SubViewType = 'main' | 'sponsor' | 'hallOfFame'

export default function SettingsModal({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  onClearHistory,
  activityCount = 0,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('about')
  const [subView, setSubView] = useState<SubViewType>('main')
  const [defaultPageSize, setDefaultPageSize] = useState<'a4' | 'letter'>('a4')
  const [historyClearedMsg, setHistoryClearedMsg] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedUpi, setCopiedUpi] = useState(false)

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

  // Scroll to top when settings is opened
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [isOpen])

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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.origin)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const hallOfFameSupporters = [
    { name: 'David K.', tier: 'Champion', badge: '🏆', date: 'Sept 2026' },
    { name: 'Sarah Lin', tier: 'Champion', badge: '🏆', date: 'Sept 2026' },
    { name: 'Alex M.', tier: 'Booster', badge: '🚀', date: 'Aug 2026' },
    { name: 'Arjun Verma', tier: 'Booster', badge: '🚀', date: 'Aug 2026' },
    { name: 'Maria Santos', tier: 'Coffee', badge: '☕', date: 'July 2026' },
    { name: 'Felix Weber', tier: 'Coffee', badge: '☕', date: 'July 2026' },
  ]

  return (
    <div
      id="settings-page-content"
      className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col space-y-6 animate-in fade-in duration-150 overflow-x-hidden"
    >
        {/* Full-Width Tab Navigation */}
        <div className="p-1 bg-gray-100 dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 rounded-2xl flex shrink-0 shadow-xs gap-1">
          <button
            id="tab-about"
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'about'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <User size={15} />
            <span>About Me</span>
          </button>
          <button
            id="tab-fuel-engine"
            onClick={() => {
              setActiveTab('fuel')
              setSubView('main')
            }}
            className={`flex-1 py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'fuel'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Heart size={15} className={activeTab === 'fuel' ? 'fill-rose-500 text-rose-500' : ''} />
            <span className="truncate">Fuel the Engine</span>
          </button>
          <button
            id="tab-preferences"
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sliders size={15} />
            <span className="truncate">Preferences</span>
          </button>
        </div>

        {/* Tab 0: About Me View (Rakshittips by Developer) */}
        {activeTab === 'about' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Developer Hero Card */}
            <div className="p-6 sm:p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 text-center shadow-xs">
              {/* App / Developer Squircle Badge */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 shadow-md">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-7 sm:w-8 h-1 sm:h-1.5 rounded-full bg-white" />
                  <div className="w-5 sm:w-6 h-1 sm:h-1.5 rounded-full bg-white" />
                  <div className="w-3.5 sm:w-4 h-1 sm:h-1.5 rounded-full bg-white" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider mb-2.5">
                <Sparkles size={13} />
                <span>Developer Profile</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
                Rakshittips by Developer
              </h2>
              <p className="text-xs sm:text-sm font-bold text-rose-500 dark:text-rose-400 mt-1">
                Creator & Lead Developer of Mr PDFKit
              </p>

              <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed mt-4 max-w-lg mx-auto font-medium">
                Passionate about building modern, privacy-first, zero-server web utilities. Committed to creating tools that are ultra-fast, ad-free, and keep your personal documents completely secure on your own device.
              </p>

              {/* Badges / Highlights */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  100% Client-Side
                </span>
                <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1.5">
                  <Heart size={13} className="text-rose-500 fill-rose-500" />
                  Zero Telemetry
                </span>
                <span className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs font-bold">
                  v1.0.0 Active
                </span>
              </div>
            </div>

            {/* About Rakshittips Story / Philosophy */}
            <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200/80 dark:border-zinc-800 shadow-xs space-y-3">
              <h3 className="text-base font-black text-gray-950 dark:text-white flex items-center gap-2">
                <span>The Story & Mission</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-normal">
                Most web-based PDF converters upload confidential contracts, bank statements, personal identification, and invoices to remote cloud servers, putting privacy and sensitive data at risk.
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed font-normal">
                <strong className="text-gray-900 dark:text-white">Rakshittips</strong> engineered Mr PDFKit with a strict zero-server guarantee: all 17 document tools execute 100% inside your browser using WebAssembly. Your files never leave your device.
              </p>
            </div>

            {/* Links & Community (Exact layout from user screenshot) */}
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-1 text-left">
                Links & Community
              </div>

              <div className="space-y-2.5">
                {/* Telegram Channel */}
                <a
                  id="about-link-telegram"
                  href="https://t.me/Mr_Rakshit_2_0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-gray-800 dark:text-zinc-200 group-hover:bg-sky-50 dark:group-hover:bg-sky-950/40 group-hover:text-sky-500 transition-colors">
                      <Send size={18} className="-rotate-12 translate-x-0.5 -translate-y-0.5 text-sky-500" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">
                        Telegram Channel
                      </div>
                      <div className="text-xs text-gray-400 dark:text-zinc-400 mt-0.5">
                        Official announcements and discussion (@Rakshittips)
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* GitHub Repository */}
                <a
                  id="about-link-github"
                  href="https://github.com/Rakshittips/Mr-PDFKit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-gray-800 dark:text-zinc-200 group-hover:bg-rose-50 dark:group-hover:bg-rose-950/40 group-hover:text-rose-500 transition-colors">
                      <Code2 size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">
                        GitHub Repository
                      </div>
                      <div className="text-xs text-gray-400 dark:text-zinc-400 mt-0.5">
                        Source code, issues, and contributions
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* Instagram */}
                <a
                  id="about-link-instagram"
                  href="https://www.instagram.com/mr._rakshit_2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-amber-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-amber-500/20 border border-pink-500/20 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform">
                      <Instagram size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-pink-500 transition-colors">
                        Instagram
                      </div>
                      <div className="text-xs text-gray-400 dark:text-zinc-400 mt-0.5">
                        @mr._rakshit_2.0
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all" />
                </a>

                {/* YouTube */}
                <a
                  id="about-link-youtube"
                  href="https://youtube.com/@mr._rakshit_2.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform">
                      <Youtube size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors">
                        YouTube Channel
                      </div>
                      <div className="text-xs text-gray-400 dark:text-zinc-400 mt-0.5">
                        @mr._rakshit_2.0
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Fuel the Engine View */}
        {activeTab === 'fuel' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {subView === 'main' && (
              <div className="space-y-6">
                {/* Privacy is a Human Right Headline */}
                <div className="text-center pt-2 sm:pt-4 px-2">
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-950 dark:text-white tracking-tight leading-tight">
                    Privacy is a <br />
                    <span className="text-rose-500">Human Right.</span>
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400 leading-relaxed mt-3 max-w-lg mx-auto font-normal">
                    Mr PDFKit is an absolute document engine. No servers, no tracking, no compromises. We transform your browser into a self-contained document laboratory.
                  </p>
                </div>

                {/* Fuel the Engine Card (Matching exact screenshot in full-screen glory) */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#ff3b5c] via-[#f43f5e] to-[#e11d48] p-7 sm:p-9 text-white text-center shadow-2xl shadow-rose-500/25 border border-rose-400/30">
                  {/* Heart Badge */}
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <Heart className="fill-white text-white" size={30} />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2.5">
                    Fuel the Engine.
                  </h3>
                  <p className="text-sm sm:text-base text-white/95 leading-relaxed max-w-md mx-auto mb-8 font-medium">
                    Mr PDFKit is self-funded and ad-free. Your support ensures the project stays alive and free for everyone.
                  </p>

                  {/* Action Buttons */}
                  <div className="max-w-sm mx-auto space-y-3">
                    <button
                      id="btn-sponsor"
                      onClick={() => setSubView('sponsor')}
                      className="w-full py-3.5 px-6 rounded-2xl bg-white text-rose-600 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 hover:bg-rose-50 shadow-md shadow-black/10 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                    >
                      <Heart className="fill-rose-500 text-rose-500" size={16} />
                      <span>Sponsor</span>
                    </button>

                    <button
                      id="btn-hall-of-fame"
                      onClick={() => setSubView('hallOfFame')}
                      className="w-full py-3.5 px-6 rounded-2xl bg-rose-700/40 border border-white/25 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 hover:bg-rose-700/60 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                    >
                      <Sparkles size={16} className="text-amber-200 fill-amber-200/30" />
                      <span>Hall of Fame</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Subview: Sponsor Dialog */}
            {subView === 'sponsor' && (
              <div className="space-y-5 animate-in fade-in duration-150 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSubView('main')}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    <ChevronLeft size={18} /> Back to Overview
                  </button>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-500">
                    Sponsorship
                  </span>
                </div>

                <div className="p-5 bg-rose-50/70 dark:bg-rose-950/40 rounded-3xl border border-rose-200/60 dark:border-rose-900/50 text-center">
                  <Heart className="fill-rose-500 text-rose-500 mx-auto mb-2.5" size={28} />
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">
                    Support Mr PDFKit
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                    Help keep 100% private, zero-server local PDF tools free and maintained for everyone.
                  </p>
                </div>

                {/* Instant UPI Payment Box */}
                <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-xs">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Direct Support via UPI
                        </div>
                        <div className="text-sm font-bold text-gray-950 dark:text-white">
                          Instant UPI Transfer
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                      Zero Fees
                    </span>
                  </div>

                  {/* UPI ID Box with 1-Click Copy */}
                  <div className="flex items-center justify-between p-3.5 sm:p-4 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 rounded-2xl gap-2">
                    <div className="min-w-0 pr-2">
                      <div className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-wider">
                        UPI ID / VPA
                      </div>
                      <div className="text-sm sm:text-base font-mono font-black text-gray-950 dark:text-white select-all break-all">
                        rakshitdhakariya6@oksbi
                      </div>
                    </div>
                    <button
                      id="btn-copy-upi-id"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          navigator.clipboard?.writeText('rakshitdhakariya6@oksbi')
                          setCopiedUpi(true)
                          setTimeout(() => setCopiedUpi(false), 2000)
                        }
                      }}
                      className={`px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                        copiedUpi
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-rose-500 text-white hover:bg-rose-600 shadow-xs'
                      }`}
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedUpi ? 'Copied!' : 'Copy UPI'}</span>
                    </button>
                  </div>

                  {/* Direct Pay via UPI App button */}
                  <a
                    id="btn-pay-via-upi-intent"
                    href="upi://pay?pa=rakshitdhakariya6@oksbi&pn=Rakshit&cu=INR&tn=Support%20Mr%20PDFKit"
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-99 cursor-pointer"
                  >
                    <Smartphone size={16} />
                    <span>Pay via UPI App</span>
                    <ExternalLink size={14} />
                  </a>

                  {/* Supported Apps Badges */}
                  <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <div className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 text-center mb-2">
                      Supported Apps & Payment Methods:
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'Cred', 'Any Bank App'].map((app) => (
                        <span
                          key={app}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-[11px] font-semibold text-gray-600 dark:text-zinc-300 border border-gray-200/60 dark:border-zinc-700/60"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Payment & Share Links */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <a
                    id="btn-telegram-dm-sponsor"
                    href="https://t.me/Mr_Rakshit_2_0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-[#229ED9] hover:bg-[#1e8ec3] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md shadow-sky-500/20 active:scale-98"
                  >
                    <Send size={16} />
                    <span>Telegram Dm @Rakshittips</span>
                    <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-200 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    {copiedLink ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Share / Donation Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Subview: Hall of Fame */}
            {subView === 'hallOfFame' && (
              <div className="space-y-5 animate-in fade-in duration-150 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSubView('main')}
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    <ChevronLeft size={18} /> Back to Overview
                  </button>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
                    <Sparkles size={14} /> Hall of Fame
                  </span>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                    Community Wall of Honor
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">
                    Thank you to everyone helping fund privacy-first, zero-server document engineering!
                  </p>
                </div>

                <div className="space-y-2.5">
                  {hallOfFameSupporters.map((supporter, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 text-xs sm:text-sm shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{supporter.badge}</span>
                        <div>
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {supporter.name}
                          </span>
                          <span className="text-[11px] text-rose-500 font-bold uppercase">
                            {supporter.tier} Backer
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {supporter.date}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSubView('sponsor')}
                  className="w-full py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors"
                >
                  <Heart size={15} className="fill-current" />
                  <span>Join the Hall of Fame</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Preferences View */}
        {activeTab === 'preferences' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Appearance Section */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-1">
                Appearance & Theme
              </label>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                      <Moon size={20} />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                      <Sun size={20} />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      Dark Mode
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {darkMode ? 'Dark canvas enabled' : 'Clean light canvas enabled'}
                    </div>
                  </div>
                </div>
                <button
                  id="toggle-dark-mode-settings"
                  onClick={onToggleDarkMode}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                    darkMode
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700'
                  }`}
                >
                  {darkMode ? 'Dark Enabled' : 'Light Enabled'}
                </button>
              </div>
            </div>

            {/* Document Defaults Section */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-1">
                Document Defaults
              </label>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white">
                    <FileText size={17} className="text-rose-500" />
                    Default Page Standard
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageSizeChange('a4')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        defaultPageSize === 'a4'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      A4 Standard
                    </button>
                    <button
                      onClick={() => handlePageSizeChange('letter')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        defaultPageSize === 'letter'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      US Letter
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400">
                  Used when generating new PDF pages, exports, or blank canvases.
                </p>
              </div>
            </div>

            {/* Privacy & Local Storage Section */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-1">
                Privacy & Local Storage
              </label>
              <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 space-y-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-xs sm:text-sm">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      Zero-Server Execution Guarantee
                    </div>
                    <div className="text-gray-500 dark:text-zinc-400 text-xs mt-1 leading-relaxed">
                      Your PDF documents are parsed and edited purely in local device memory using WebAssembly. No files or metadata are ever uploaded to any server.
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-zinc-300 flex items-center gap-2 font-medium">
                    <Database size={15} className="text-gray-400" />
                    <span>Recent History Items ({activityCount})</span>
                  </div>
                  <button
                    onClick={handleClearHistoryClick}
                    disabled={activityCount === 0}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    {historyClearedMsg ? 'Cleared!' : 'Clear Log'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
