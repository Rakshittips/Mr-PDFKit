'use client'

import React from 'react'

export const MrPdfKitLogo = ({
  size = 24,
  className = '',
  iconColor = '#F43F5E',
  partColor
}: {
  size?: number
  className?: string
  iconColor?: string
  partColor?: string
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M4 4L21 12H9L4 4Z" fill={iconColor} />
    <path
      d="M4 20L21 12H9L4 20Z"
      fill={partColor || 'currentColor'}
      className={!partColor ? 'fill-zinc-950 dark:fill-white' : ''}
    />
  </svg>
)

export const PaperKnifeLogo = MrPdfKitLogo

export default MrPdfKitLogo
