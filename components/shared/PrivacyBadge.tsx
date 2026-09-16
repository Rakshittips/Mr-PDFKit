'use client'

import React from 'react'
import { ShieldCheck } from 'lucide-react'

export default function PrivacyBadge() {
  return (
    <div className="flex items-center justify-center gap-2 mt-8 text-xs font-semibold text-gray-400 dark:text-zinc-500">
      <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
      <span>Zero-Server Architecture • 100% local in your browser</span>
    </div>
  )
}
