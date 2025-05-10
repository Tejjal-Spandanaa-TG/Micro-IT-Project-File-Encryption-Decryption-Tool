"use client"

import { useState } from "react"
import { Eye, EyeOff, ShieldAlert, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
  placeholder?: string
}

export function PasswordInput({
  value,
  onChange,
  disabled = false,
  label = "Password",
  placeholder = "Enter password",
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const getPasswordStrength = (
    password: string,
  ): {
    strength: "weak" | "medium" | "strong"
    color: string
    width: string
    icon: JSX.Element
  } => {
    if (!password)
      return {
        strength: "weak",
        color: "bg-slate-700",
        width: "0%",
        icon: <ShieldAlert className="h-4 w-4 text-slate-500" />,
      }

    const hasLowercase = /[a-z]/.test(password)
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    const isLongEnough = password.length >= 8

    const criteria = [hasLowercase, hasUppercase, hasNumber, hasSpecial, isLongEnough]
    const metCriteria = criteria.filter(Boolean).length

    if (metCriteria <= 2)
      return {
        strength: "weak",
        color: "bg-red-500",
        width: "33%",
        icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
      }
    if (metCriteria <= 4)
      return {
        strength: "medium",
        color: "bg-amber-500",
        width: "66%",
        icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
      }
    return {
      strength: "strong",
      color: "bg-green-500",
      width: "100%",
      icon: <ShieldCheck className="h-4 w-4 text-green-500" />,
    }
  }

  const passwordStrength = getPasswordStrength(value)

  return (
    <div className="space-y-2">
      <Label htmlFor="password" className="text-slate-300">
        {label}
      </Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-teal-500/20"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
          onClick={togglePasswordVisibility}
          disabled={disabled}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
        </Button>
      </div>

      {value && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              {passwordStrength.icon}
              <span className="ml-1 text-slate-400">
                Password strength:
                <span
                  className={`ml-1 font-medium ${
                    passwordStrength.strength === "weak"
                      ? "text-red-500"
                      : passwordStrength.strength === "medium"
                        ? "text-amber-500"
                        : "text-green-500"
                  }`}
                >
                  {passwordStrength.strength}
                </span>
              </span>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: passwordStrength.width }}
              transition={{ duration: 0.3 }}
              className={`h-full ${passwordStrength.color}`}
            />
          </div>
        </motion.div>
      )}

      <p className="text-xs text-slate-500">
        Use a strong password you can remember. If you forget it, your encrypted file cannot be recovered.
      </p>
    </div>
  )
}
