'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import WebView from '@/components/WebView'
import OpenPdfTool from '@/components/tools/OpenPdfTool'
import MergeTool from '@/components/tools/MergeTool'
import SplitTool from '@/components/tools/SplitTool'
import CompressTool from '@/components/tools/CompressTool'
import ProtectTool from '@/components/tools/ProtectTool'
import UnlockTool from '@/components/tools/UnlockTool'
import RotateTool from '@/components/tools/RotateTool'
import RearrangeTool from '@/components/tools/RearrangeTool'
import PageNumberTool from '@/components/tools/PageNumberTool'
import WatermarkTool from '@/components/tools/WatermarkTool'
import MetadataTool from '@/components/tools/MetadataTool'
import SignatureTool from '@/components/tools/SignatureTool'
import GrayscaleTool from '@/components/tools/GrayscaleTool'
import PdfToImageTool from '@/components/tools/PdfToImageTool'
import ImageToPdfTool from '@/components/tools/ImageToPdfTool'
import ExtractImagesTool from '@/components/tools/ExtractImagesTool'
import PdfToTextTool from '@/components/tools/PdfToTextTool'
import HtmlToPdfTool from '@/components/tools/HtmlToPdfTool'
import RepairTool from '@/components/tools/RepairTool'
import { PipelinedFile, ActivityEntry } from '@/lib/types'

export default function Home() {
  const [activeToolId, setActiveToolId] = useState<string | null>(null)
  const [pipelinedFile, setPipelinedFile] = useState<PipelinedFile | null>(null)
  const [activityHistory, setActivityHistory] = useState<ActivityEntry[]>([])

  // Load activity history and parse URL param on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mrpdfkit-activity') || localStorage.getItem('paperknife-activity')
      if (saved) {
        setActivityHistory(JSON.parse(saved))
      }
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const toolParam = params.get('tool')
      if (toolParam) {
        setActiveToolId(toolParam)
      }
    }
  }, [])

  const handleSelectTool = (toolId: string) => {
    setActiveToolId(toolId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tool', toolId)
      window.history.pushState({}, '', url.toString())
    }
  }

  const handleNavigateHome = () => {
    setActiveToolId(null)
    setPipelinedFile(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.delete('tool')
      window.history.pushState({}, '', url.toString())
    }
  }

  const handleSendToTool = (toolId: string, buffer: Uint8Array, fileName: string) => {
    setPipelinedFile({
      name: fileName,
      buffer,
      type: 'application/pdf',
    })
    handleSelectTool(toolId)
  }

  const handleAddActivity = (act: Omit<ActivityEntry, 'id'>) => {
    const newEntry: ActivityEntry = {
      ...act,
      id: Math.random().toString(),
    }
    setActivityHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 30)
      try {
        localStorage.setItem('mrpdfkit-activity', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  const handleClearHistory = () => {
    setActivityHistory([])
    try {
      localStorage.removeItem('mrpdfkit-activity')
      localStorage.removeItem('paperknife-activity')
    } catch {
      // ignore
    }
  }

  const renderTool = () => {
    switch (activeToolId) {
      case 'open-pdf':
        return (
          <OpenPdfTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'merge':
        return (
          <MergeTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'split':
        return (
          <SplitTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'compress':
        return (
          <CompressTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'protect':
        return (
          <ProtectTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'unlock':
        return (
          <UnlockTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'rotate-pdf':
        return (
          <RotateTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'rearrange-pdf':
        return (
          <RearrangeTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'page-numbers':
        return (
          <PageNumberTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'watermark':
        return (
          <WatermarkTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'metadata':
        return (
          <MetadataTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'signature':
        return (
          <SignatureTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'grayscale':
        return (
          <GrayscaleTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'pdf-to-image':
        return (
          <PdfToImageTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'image-to-pdf':
        return (
          <ImageToPdfTool
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'extract-images':
        return (
          <ExtractImagesTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'pdf-to-text':
        return (
          <PdfToTextTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
          />
        )
      case 'html-to-pdf':
        return (
          <HtmlToPdfTool
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      case 'repair':
        return (
          <RepairTool
            initialFile={pipelinedFile}
            onBack={handleNavigateHome}
            onAddActivity={handleAddActivity}
            onSendToTool={handleSendToTool}
          />
        )
      default:
        return (
          <WebView
            onSelectTool={handleSelectTool}
            activityHistory={activityHistory}
            onClearHistory={handleClearHistory}
          />
        )
    }
  }

  return (
    <Layout
      currentToolId={activeToolId}
      onNavigateHome={handleNavigateHome}
      onSelectTool={handleSelectTool}
      activityCount={activityHistory.length}
      onClearHistory={handleClearHistory}
    >
      {renderTool()}
    </Layout>
  )
}
