import { LucideIcon } from 'lucide-react'

export type Theme = 'light' | 'dark' | 'system'
export type ViewMode = 'web' | 'android'
export type ToolCategory = 'Edit' | 'Secure' | 'Convert' | 'Optimize'

export interface Tool {
  id: string
  title: string
  desc: string
  icon: LucideIcon
  implemented?: boolean
  path: string
  category: ToolCategory
  color: string
  bg: string
}

export interface ActivityEntry {
  id: string
  tool: string
  fileName: string
  timestamp: number
  size?: number
  savedSize?: number
}

export interface PipelinedFile {
  buffer: Uint8Array
  name: string
  type?: string
  originalBuffer?: Uint8Array
}
