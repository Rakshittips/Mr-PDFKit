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
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
    <div className="min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0c0d0e] text-gray-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onClearHistory={onClearHistory}
        activityCount={activityCount}
      />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200/70 dark:border-zinc-800/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 focus:outline-none group text-left"
            >
              <Logo size={32} />
              <div>
                <span className="text-lg font-black tracking-tight text-gray-950 dark:text-white flex items-center gap-1.5">
                  Mr PDFKit
                  <span className="text-[10px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 dark:bg-rose-500/20">
                    v2.0
                  </span>
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
                      const active = tool.id === currentToolId
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
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

          {/* Right actions: 3 Icons on Top RHS (GitHub, Settings, Theme) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Zero-Server Pill on larger screens */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold mr-1">
              <ShieldCheck size={14} />
              <span>Zero-Server</span>
            </div>

            {/* Icon 1: GitHub */}
            <a
              id="top-nav-github-btn"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
              title="GitHub Repository"
              aria-label="GitHub Repository"
            >
              <Github size={19} />
            </a>

            {/* Icon 2: Settings */}
            <button
              id="top-nav-settings-btn"
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={19} />
            </button>

            {/* Icon 3: Dark/Light Mode Theme Toggle */}
            <button
              id="top-nav-theme-btn"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-950 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors ml-1"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 max-h-[75vh] overflow-y-auto space-y-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  onNavigateHome()
                }}
                className="text-left font-bold text-sm text-gray-900 dark:text-white hover:text-rose-500"
              >
                All Tools Overview
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setSettingsOpen(true)
                  }}
                  className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                  title="Settings"
                >
                  <Settings size={18} />
                </button>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
                  title="GitHub"
                >
                  <Github size={18} />
                </a>
              </div>
            </div>

            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 pt-2">
              Select a Tool
            </div>
            <div className="grid grid-cols-1 gap-1">
              {toolsData.map((tool) => {
                const Icon = tool.icon
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      onSelectTool(tool.id)
                    }}
                    className="flex items-center gap-3 w-full p-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-zinc-900"
                  >
                    <div className={`p-1.5 rounded-lg ${tool.bg} ${tool.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {tool.title}
                      </div>
                      <div className="text-[10px] text-gray-400">{tool.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-gray-200/70 dark:border-zinc-800/70 bg-white/50 dark:bg-zinc-950/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-400 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-bold text-gray-700 dark:text-zinc-300">Mr PDFKit</span>
            <span>— The Privacy-First PDF Toolkit. No tracking. No ads. No servers.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={onNavigateHome}
              className="hover:text-rose-500 transition-colors"
            >
              All 17 Tools
            </button>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <ShieldCheck size={14} /> 100% In-Browser Execution
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
