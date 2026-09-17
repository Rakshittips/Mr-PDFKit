'use client'

import React, { useEffect } from 'react'

export default function NotFound() {
  useEffect(() => {
    // If running on GitHub Pages and a deep link was hit, redirect to base path
    if (typeof window !== 'undefined') {
      window.location.replace('/')
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-xl font-bold mb-2">Page Not Found</h1>
      <p className="text-sm text-zinc-400 max-w-sm mb-6">
        Redirecting you to the home page...
      </p>
      <a
        href="./"
        className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        Go to Home
      </a>
    </div>
  )
}
