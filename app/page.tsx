"use client"

import { useState, useEffect } from "react"
import { FileUploader } from "@/components/file-uploader"
import { PasswordInput } from "@/components/password-input"
import { encryptFile, decryptFile } from "@/lib/crypto"
import { Lock, Unlock, FileText, Download, ShieldCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<"encrypt" | "decrypt">("encrypt")
  const [result, setResult] = useState<{
    success: boolean
    fileName?: string
    url?: string
    fileSize?: string
  } | null>(null)

  const { toast } = useToast()

  // Simulate progress during processing
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isProcessing) {
      setProgress(0)
      interval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 15
          const newProgress = Math.min(prev + increment, 95) // Cap at 95% until complete
          return newProgress
        })
      }, 300)
    } else if (progress > 0) {
      // When processing completes, jump to 100%
      setProgress(100)
      // Reset progress after animation completes
      const timeout = setTimeout(() => {
        setProgress(0)
      }, 1000)
      return () => clearTimeout(timeout)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isProcessing, progress])

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile)
    setResult(null)
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
    else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB"
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
  }

  const handleEncrypt = async () => {
    if (!file || !password) return

    // Password confirmation check
    if (activeTab === "encrypt" && password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      })
      return
    }

    try {
      setIsProcessing(true)
      setResult(null)

      // Actual encryption
      const encryptedData = await encryptFile(file, password)

      // Create downloadable blob
      const blob = new Blob([encryptedData], { type: "application/octet-stream" })
      const url = URL.createObjectURL(blob)

      setResult({
        success: true,
        fileName: `${file.name}.encrypted`,
        url,
        fileSize: formatFileSize(blob.size),
      })

      if (encryptedData) {
        // Clear password after successful encryption
        setPassword("")
        setConfirmPassword("")
      }

      toast({
        title: "Encryption successful!",
        description: "Your file has been encrypted and is ready to download.",
      })
    } catch (error) {
      console.error("Encryption error:", error)
      toast({
        variant: "destructive",
        title: "Encryption failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecrypt = async () => {
    if (!file || !password) return

    try {
      setIsProcessing(true)
      setResult(null)

      // Actual decryption
      const decryptedData = await decryptFile(file, password)

      // Extract original filename (remove .encrypted extension if present)
      let originalFileName = file.name
      if (originalFileName.endsWith(".encrypted")) {
        originalFileName = originalFileName.slice(0, -10)
      }

      // Create downloadable blob
      const blob = new Blob([decryptedData])
      const url = URL.createObjectURL(blob)

      setResult({
        success: true,
        fileName: originalFileName,
        url,
        fileSize: formatFileSize(blob.size),
      })

      if (decryptedData) {
        // Clear password after successful decryption
        setPassword("")
      }

      toast({
        title: "Decryption successful!",
        description: "Your file has been decrypted and is ready to download.",
      })
    } catch (error) {
      console.error("Decryption error:", error)
      toast({
        variant: "destructive",
        title: "Decryption failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    // Download the file
    if (result?.url) {
      const link = document.createElement("a")
      link.href = result.url
      link.download = result.fileName || "download"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Reset the form after download
      setTimeout(() => {
        setFile(null)
        setPassword("")
        setConfirmPassword("")
        setResult(null)
        setProgress(0)
      }, 1000)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500"
          >
            Secure File Vault
          </motion.h1>
          <p className="mt-2 text-slate-300">Encrypt and decrypt your files with military-grade security</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-slate-700">
          {/* Tab Navigation */}
          <div className="flex mb-6 bg-slate-900/50 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab("encrypt")
                setPassword("")
                setConfirmPassword("")
                setResult(null)
              }}
              className={cn(
                "flex items-center justify-center flex-1 py-2 rounded-md transition-all duration-200",
                activeTab === "encrypt"
                  ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Lock className="h-4 w-4 mr-2" />
              Encrypt
            </button>
            <button
              onClick={() => {
                setActiveTab("decrypt")
                setPassword("")
                setConfirmPassword("")
                setResult(null)
              }}
              className={cn(
                "flex items-center justify-center flex-1 py-2 rounded-md transition-all duration-200",
                activeTab === "decrypt"
                  ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white"
                  : "text-slate-400 hover:text-white",
              )}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Decrypt
            </button>
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: activeTab === "encrypt" ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <FileUploader file={file} onFileChange={handleFileChange} />

            <PasswordInput
              value={password}
              onChange={handlePasswordChange}
              disabled={isProcessing}
              label={activeTab === "encrypt" ? "Create Password" : "Enter Password"}
              placeholder={activeTab === "encrypt" ? "Create a strong password" : "Enter your decryption password"}
            />

            {activeTab === "encrypt" && (
              <PasswordInput
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                disabled={isProcessing}
                label="Confirm Password"
                placeholder="Confirm your password"
              />
            )}

            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress
                  value={progress}
                  className="h-2 bg-slate-700"
                  indicatorClassName="bg-gradient-to-r from-teal-500 to-blue-500"
                />
              </div>
            )}

            <Button
              onClick={activeTab === "encrypt" ? handleEncrypt : handleDecrypt}
              disabled={!file || !password || isProcessing || (activeTab === "encrypt" && !confirmPassword)}
              className={cn(
                "w-full py-6 relative overflow-hidden transition-all",
                activeTab === "encrypt"
                  ? "bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600",
              )}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {activeTab === "encrypt" ? "Encrypting..." : "Decrypting..."}
                </span>
              ) : (
                <span className="flex items-center">
                  {activeTab === "encrypt" ? (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Encrypt File
                    </>
                  ) : (
                    <>
                      <Unlock className="h-5 w-5 mr-2" />
                      Decrypt File
                    </>
                  )}
                </span>
              )}
            </Button>
          </motion.div>

          {/* Result Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 bg-slate-900/70 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-teal-500 to-blue-500 p-3 rounded-lg mr-4">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{result.fileName}</h3>
                  <p className="text-sm text-slate-400">{result.fileSize}</p>
                </div>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-blue-500 rounded-md hover:from-teal-600 hover:to-blue-600 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs">End-to-end encryption</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Your files never leave your device. All encryption happens in your browser.
          </p>
        </div>
      </motion.div>
    </main>
  )
}
