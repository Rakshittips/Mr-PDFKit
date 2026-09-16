'use client'

import React, { useState, useMemo } from 'react'
import { Search, Sparkles, ShieldCheck, ArrowRight, X, Clock, Trash2 } from 'lucide-react'
import { Tool, ToolCategory, ActivityEntry } from '@/lib/types'
import { toolsData } from '@/lib/toolsData'
import { formatBytes } from '@/lib/pdfEngine'

interface WebViewProps {
  onSelectTool: (toolId: string) => void
  activityHistory: ActivityEntry[]
  onClearHistory: () => void
}

const CATEGORIES: { id: ToolCategory | 'All'; label: string }[] = [
  { id: 'All', label: 'All Tools' },
  { id: 'Edit', label: 'Edit' },
  { id: 'Secure', label: 'Secure' },
  { id: 'Convert', label: 'Convert' },
  { id: 'Optimize', label: 'Optimize' },
]

export default function WebView({ onSelectTool, activityHistory, onClearHistory }: WebViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'All'>('All')
  const [showHistory, setShowHistory] = useState(false)

  const filteredTools = useMemo(() => {
    return toolsData.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'All' || tool.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Hero Banner */}
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-wider mb-5">
          <ShieldCheck size={14} className="text-rose-500" />
          <span>Zero-Server • 100% Client-Side Privacy</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-950 dark:text-white mb-4 leading-none">
          The Swiss Army Knife for{' '}
          <span className="text-rose-500">PDFs</span>
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
          Manipulate, edit, convert, and protect your PDF documents completely inside your browser. No files are ever sent to a remote server.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-xl mx-auto relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search all 17 PDF tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const count =
              cat.id === 'All'
                ? toolsData.length
                : toolsData.filter((t) => t.category === cat.id).length

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gray-950 dark:bg-white text-white dark:text-gray-950 shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 border border-gray-200/80 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-gray-950'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 mb-14">
        {filteredTools.map((tool) => {
          const Icon = tool.icon
          return (
            <div
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative bg-white dark:bg-zinc-900/70 border border-gray-200/80 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-500 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/5 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${tool.bg} ${tool.color} transition-transform group-hover:scale-110`}>
                    <Icon size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                    {tool.category}
                  </span>
                </div>

                <h3 className="text-lg font-black text-gray-950 dark:text-white tracking-tight mb-1.5 group-hover:text-rose-500 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 leading-relaxed">
                  {tool.desc}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-bold text-gray-400 group-hover:text-rose-500 transition-colors">
                <span className="uppercase tracking-wider text-[11px]">Open Tool</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          )
        })}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-sm font-semibold">
            No tools found matching &quot;{searchQuery}&quot; in {selectedCategory}.
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory('All')
            }}
            className="mt-3 text-xs font-bold text-rose-500 uppercase tracking-wider hover:underline"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Zero Server Architecture Guarantee Footer Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-zinc-950 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-emerald-500 w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Privacy First Architecture
              </span>
            </div>
            <h3 className="text-2xl font-black text-gray-950 dark:text-white mb-2">
              Your files never leave your device
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 leading-relaxed">
              Every operation — from merging and splitting to encryption and watermarking — runs 100% locally in your browser using modern WebAssembly and JavaScript engines. No backend servers receive your files.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activityHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:border-gray-300 transition-colors shadow-sm"
              >
                <Clock size={15} />
                <span>Recent Activity ({activityHistory.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Activity Drawer/Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Clock className="text-rose-500" size={18} />
                <h3 className="text-base font-black text-gray-900 dark:text-white">
                  Recent Activity Log
                </h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto py-3 space-y-2">
              {activityHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-gray-900 dark:text-white block truncate">
                      {item.fileName}
                    </span>
                    <span className="text-gray-400 text-[11px]">
                      {item.tool} • {formatBytes(item.size || 0)}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-400 shrink-0 ml-2">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  onClearHistory()
                  setShowHistory(false)
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600"
              >
                <Trash2 size={14} /> Clear History
              </button>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 dark:text-zinc-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
