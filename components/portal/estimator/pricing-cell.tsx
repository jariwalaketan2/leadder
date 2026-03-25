'use client'

import { useState, useRef, useEffect } from 'react'

interface PricingCellProps {
  price: number | null
  capacityId: string
  tier: 'good' | 'better' | 'best'
  disabled?: boolean
  onChange: (capacityId: string, tier: 'good' | 'better' | 'best', price: number | null) => void
}

export function PricingCell({
  price,
  capacityId,
  tier,
  disabled = false,
  onChange
}: PricingCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(price?.toString() || '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setValue(price?.toString() || '')
  }, [price])

  const handleClick = () => {
    if (disabled) return
    setIsEditing(true)
    setValue(price?.toString() || '')
  }

  const validatePrice = (val: string): number | null => {
    if (!val || val.trim() === '') return null
    
    const num = parseFloat(val)
    
    // Validation rules
    if (isNaN(num)) return null
    if (num < 0) return null
    if (num > 999999.99) return null
    
    // Round to 2 decimals
    return Math.round(num * 100) / 100
  }

  const handleApply = () => {
    const validatedPrice = validatePrice(value)
    if (validatedPrice !== price) {
      onChange(capacityId, tier, validatedPrice)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApply()
    } else if (e.key === 'Escape') {
      setValue(price?.toString() || '')
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    handleApply()
  }

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full px-2 py-1 text-center text-lg font-semibold border-2 border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="0.00"
          step="0.01"
          min="0"
          max="999999.99"
        />
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`w-full px-2 py-2 text-center rounded transition-colors border ${
        disabled
          ? 'cursor-not-allowed border-transparent'
          : price !== null
            ? 'border-transparent hover:border-border hover:bg-muted/50 cursor-pointer'
            : 'border-dashed border-border hover:border-primary hover:bg-muted/50 cursor-pointer'
      }`}
    >
      {price !== null ? (
        <span className="text-lg font-semibold text-foreground">
          ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          + Set price
        </span>
      )}
    </button>
  )
}
