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
    <div className="relative text-center mb-8 md:mb-12">
      {onBack && (
        <button
          onClick={onBack}
          className="md:hidden absolute left-0 top-0 p-3 bg-gray-50 dark:bg-zinc-900 rounded-2xl text-gray-500 hover:text-rose-500 transition-colors"
          title="Back to tools"
        >
          <ArrowLeft size={18} />
        </button>
      )}

      <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-3">
        {title}{' '}
        {highlight && <span className="text-rose-500">{highlight}</span>}
      </h1>
      <p className="text-sm md:text-base text-gray-500 dark:text-zinc-400 font-medium max-w-xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  )
}
