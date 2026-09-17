'use client'

import React, { useState, useEffect } from 'react'
import {
  Sun,
  Moon,
  ShieldCheck,
  Github,
  Settings,
  History,
  ChevronDown,
  Sparkles,
  Layers,
  Scissors,
  Zap,
  Lock,
  Home,
  Pencil,
  ArrowRight,
} from 'lucide-react'
import Logo from './Logo'
import SettingsModal from './SettingsModal'
import { toolsData } from '@/lib/toolsData'

interface LayoutProps {
  children: React.ReactNode
  currentToolId: string | null
  onNavigateHome: () => void
  onSelectTool: (id: string) => void
  activityCount: number
  onClearHistory?: () => void
}

export default function Layout({
  children,
  currentToolId,
  onNavigateHome,
  onSelectTool,
  activityCount,
  onClearHistory,
}: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    // Check local storage or system preference
    const isDark =
      localStorage.getItem('mrpdfkit-dark') === 'true' ||
      localStorage.getItem('paperknife-dark') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('mrpdfkit-dark', String(next))
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const currentTool = toolsData.find((t) => t.id === currentToolId)

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-[#fafafa] dark:bg-[#0c0d0e] text-gray-900 dark:text-zinc-100 transition-colors duration-200 overflow-x-hidden">
      {/* Top Navigation */}
      <header className="w-full max-w-full bg-white dark:bg-zinc-950 border-b border-gray-200/70 dark:border-zinc-800/70 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo (Matching Screenshot) */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button
              id="top-nav-logo-btn"
              onClick={() => {
                setSettingsOpen(false)
                onNavigateHome()
              }}
              className="flex items-center gap-2 sm:gap-3 focus:outline-none group text-left cursor-pointer shrink-0"
            >
              {/* Rounded Squircle with neon orange-to-rose gradient border */}
              <div className="relative p-[2px] rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-500 via-rose-500 to-orange-400 shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[14px] bg-zinc-950 flex items-center justify-center">
                  <Pencil size={17} className="text-rose-400 -rotate-45 sm:w-[19px] sm:h-[19px]" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-black tracking-tight text-gray-950 dark:text-white whitespace-nowrap font-syne">
                  Mr PDFKit
                </span>
                <span className="text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-gray-100 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 text-gray-500 dark:text-zinc-400 font-semibold hidden xs:inline-block">
                  v1.1
                </span>
              </div>
            </button>

            {/* Quick Tools Selector Dropdown (Desktop) */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition-colors"
              >
                <span>{currentTool ? currentTool.title : 'Tools'}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {toolsDropdownOpen && (
                <div
                  onMouseLeave={() => setToolsDropdownOpen(false)}
                  className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto"
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 py-1.5">
                    All PDF Tools
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {toolsData.map((tool) => {
                      const Icon = tool.icon
                      const active = tool.id === currentToolId && !settingsOpen
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setSettingsOpen(false)
                            setToolsDropdownOpen(false)
                            onSelectTool(tool.id)
                          }}
                          className={`flex items-center gap-3 w-full p-2 rounded-xl text-left transition-colors ${
                            active
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold'
                              : 'hover:bg-gray-50 dark:hover:bg-zinc-800/60 text-gray-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg ${tool.bg} ${tool.color}`}>
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{tool.title}</div>
                            <div className="text-[10px] text-gray-400 truncate">{tool.desc}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right actions: Line of separate distinct box containers [Home] [Settings] [Brightness] [GitHub] */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Zero-Server Pill on larger screens */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold mr-1 border border-emerald-200/50 dark:border-emerald-800/40">
              <ShieldCheck size={14} />
              <span>Zero-Server</span>
            </div>

            {/* 1. Home Icon Box */}
            <button
              id="top-nav-home-btn"
              onClick={() => {
                setSettingsOpen(false)
                onNavigateHome()
              }}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                !currentToolId && !settingsOpen
                  ? 'bg-gray-200 dark:bg-zinc-800 border-2 border-gray-400 dark:border-zinc-700 text-gray-950 dark:text-white'
                  : 'bg-white dark:bg-[#18191d] border border-gray-200 dark:border-zinc-800/80 text-gray-600 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/80'
              }`}
              title="Home"
              aria-label="Home"
            >
              <Home size={17} className="sm:w-[19px] sm:h-[19px]" />
            </button>

            {/* 2. Settings Icon Box */}
            <button
              id="top-nav-settings-btn"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                settingsOpen
                  ? 'bg-gray-200 dark:bg-zinc-800 border-2 border-gray-400 dark:border-zinc-700 text-gray-950 dark:text-white'
                  : 'bg-white dark:bg-[#18191d] border border-gray-200 dark:border-zinc-800/80 text-gray-600 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/80'
              }`}
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={17} className="sm:w-[19px] sm:h-[19px]" />
            </button>

            {/* 3. Brightness / Theme Toggle Box */}
            <button
              id="top-nav-theme-btn"
              onClick={toggleDarkMode}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white dark:bg-[#18191d] border border-gray-200 dark:border-zinc-800/80 flex items-center justify-center text-gray-600 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-all cursor-pointer shadow-xs"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle brightness mode"
            >
              {darkMode ? (
                <Sun size={17} className="text-amber-400 fill-amber-400/20 sm:w-[19px] sm:h-[19px]" />
              ) : (
                <Moon size={17} className="text-zinc-700 dark:text-zinc-300 sm:w-[19px] sm:h-[19px]" />
              )}
            </button>

            {/* 4. GitHub Box */}
            <a
              id="top-nav-github-btn"
              href="https://github.com/Rakshittips/Mr-PDFKit"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white dark:bg-[#18191d] border border-gray-200 dark:border-zinc-800/80 flex items-center justify-center text-gray-600 dark:text-zinc-300 hover:text-gray-950 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/80 transition-all shadow-xs"
              title="GitHub Repository"
              aria-label="GitHub Repository"
            >
              <Github size={17} className="sm:w-[19px] sm:h-[19px]" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area: switches cleanly between Tools and Settings right below the top navbar */}
      <main className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
        {settingsOpen ? (
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            onClearHistory={onClearHistory}
            activityCount={activityCount}
          />
        ) : (
          children
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-full overflow-x-hidden border-t border-gray-200/70 dark:border-zinc-800/70 bg-[#fafafa] dark:bg-[#0c0d0e] py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Main Arranged Bento Box */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-center">
              
              {/* Box 1: Brand & Core Privacy Promise */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative p-[2px] rounded-xl bg-gradient-to-tr from-rose-500 via-rose-500 to-orange-400 shadow-xs shrink-0">
                    <div className="w-8 h-8 rounded-[10px] bg-zinc-950 flex items-center justify-center">
                      <Pencil size={15} className="text-rose-400 -rotate-45" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-gray-950 dark:text-white">
                      Mr PDFKit
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 font-bold">
                      v1.1
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-zinc-200">
                    The Privacy-First PDF Toolkit
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">
                    Complete client-side document processing directly inside your browser.
                  </p>
                </div>

                {/* Privacy Guarantee Pills in Boxes */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 text-xs font-semibold border border-gray-200/70 dark:border-zinc-700/60 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    No tracking
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 text-xs font-semibold border border-gray-200/70 dark:border-zinc-700/60 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    No ads
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gray-50 dark:bg-zinc-800/80 text-gray-700 dark:text-zinc-300 text-xs font-semibold border border-gray-200/70 dark:border-zinc-700/60 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    No servers
                  </span>
                </div>
              </div>

              {/* Box 2 & 3: Tools & Execution Cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Box 2: All 17 Tools Card Button */}
                <button
                  id="footer-btn-all-tools"
                  onClick={() => {
                    setSettingsOpen(false)
                    onNavigateHome()
                  }}
                  className="p-4 rounded-2xl bg-gray-50 hover:bg-rose-50/50 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-gray-200/80 dark:border-zinc-700/70 hover:border-rose-300 dark:hover:border-rose-500/50 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Layers size={18} />
                    </div>
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-sm font-black text-gray-950 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    All {toolsData.length} Tools
                  </div>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                    Merge, split, edit & convert suite
                  </div>
                </button>

                {/* Box 3: 100% In-Browser Execution Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50 text-left shadow-2xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      Verified
                    </span>
                  </div>
                  <div className="text-sm font-black text-emerald-900 dark:text-emerald-300">
                    100% In-Browser Execution
                  </div>
                  <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                    Zero uploads • WebAssembly powered
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Bottom Bar / Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-zinc-400 px-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 dark:text-zinc-300">Mr PDFKit</span>
              <span>•</span>
              <span>Privacy-first offline document engineering</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                id="footer-link-home"
                onClick={() => {
                  setSettingsOpen(false)
                  onNavigateHome()
                }}
                className="hover:text-rose-500 transition-colors font-medium cursor-pointer"
              >
                Home
              </button>
              <span>•</span>
              <button
                id="footer-link-settings"
                onClick={() => setSettingsOpen(true)}
                className="hover:text-rose-500 transition-colors font-medium cursor-pointer"
              >
                Settings & About
              </button>
              <span>•</span>
              <a
                id="footer-link-github"
                href="https://github.com/Rakshittips/Mr-PDFKit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-rose-500 transition-colors font-medium"
              >
                GitHub
              </a>
              <span>•</span>
              <a
                id="footer-link-telegram"
                href="https://t.me/Mr_Rakshit_2_0"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-sky-500 transition-colors font-medium"
              >
                Telegram
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
