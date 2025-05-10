"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, File, X, FileText, FileImage, FileAudio, FileVideo, FileBadge } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  file: File | null
  onFileChange: (file: File | null) => void
}

export function FileUploader({ file, onFileChange }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0])
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type.split("/")[0]

    switch (type) {
      case "image":
        return <FileImage className="h-10 w-10 text-blue-400" />
      case "audio":
        return <FileAudio className="h-10 w-10 text-purple-400" />
      case "video":
        return <FileVideo className="h-10 w-10 text-pink-400" />
      case "text":
        return <FileText className="h-10 w-10 text-teal-400" />
      default:
        if (file.name.endsWith(".encrypted")) {
          return <FileBadge className="h-10 w-10 text-amber-400" />
        }
        return <File className="h-10 w-10 text-slate-400" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  return (
    <div className="w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileInputChange} className="hidden" />

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300",
              isDragging ? "border-teal-400 bg-teal-400/10" : "border-slate-600 hover:border-slate-500 bg-slate-800/50",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Upload className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-2 text-sm font-medium text-slate-300">Click to upload or drag and drop</p>
              <p className="mt-1 text-xs text-slate-500">Any file type supported</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-4 border border-slate-700"
            onClick={handleButtonClick}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-4">{getFileIcon(file)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-2 p-1 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
