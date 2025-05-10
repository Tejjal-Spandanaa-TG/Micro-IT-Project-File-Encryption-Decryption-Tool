"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface ActionButtonProps {
  icon: ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function ActionButton({
  icon,
  label,
  onClick,
  disabled = false,
  isLoading = false,
  variant = "default",
}: ActionButtonProps) {
  return (
    <Button variant={variant} onClick={onClick} disabled={disabled || isLoading} className="flex-1">
      {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : icon}
      {label}
    </Button>
  )
}
