'use client'

import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface ToolHeaderProps {
  title: string
  highlight?: string
  description: string
  onBack?: () => void
}

export default function ToolHeader({ title, highlight, description, onBack }: ToolHeaderProps) {
  return (
    <div className="relative text-center mb-6 md:mb-12 px-1 max-w-full">
      {onBack && (
        <button
          onClick={onBack}
          className="md:hidden absolute left-0 top-0 p-2.5 bg-gray-100 dark:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-700/80 rounded-xl text-gray-600 dark:text-zinc-300 hover:text-rose-500 transition-colors z-10 active:scale-95"
          title="Back to tools"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <h1 className={`text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-2.5 break-words max-w-full ${onBack ? 'px-11 sm:px-0' : 'px-2'}`}>
        {title}{' '}
        {highlight && <span className="text-rose-500">{highlight}</span>}
      </h1>
      <p className="text-xs sm:text-sm md:text-base text-gray-500 dark:text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed px-2">
        {description}
      </p>
    </div>
  )
}
