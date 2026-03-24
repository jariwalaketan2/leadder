'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PricingTier, CapacityOption } from '@/lib/types/database'

export interface SelectedCell {
  capacityId: string
  tier: 'good' | 'better' | 'best'
}

interface BulkPriceEditorProps {
  open: boolean
  onClose: () => void
  selectedCells: SelectedCell[]
  businessId: string
  productId: string
  currentTiers: PricingTier[]
  capacities: CapacityOption[]
  onTiersUpdate: (tiers: PricingTier[]) => void
}

type AdjustmentType = 'percent' | 'fixed'
type Direction = 'increase' | 'decrease'

export function BulkPriceEditor({
  open,
  onClose,
  selectedCells,
  businessId,
  productId,
  currentTiers,
  capacities,
  onTiersUpdate,
}: BulkPriceEditorProps) {
  const supabase = createClient()
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('percent')
  const [direction, setDirection] = useState<Direction>('increase')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  function getCurrentPrice(capacityId: string, tier: 'good' | 'better' | 'best'): number | null {
    return currentTiers.find(t => t.capacity_option_id === capacityId && t.tier === tier)?.price ?? null
  }

  function calcNewPrice(current: number | null): number | null {
    if (current === null) return null
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) return current

    let newPrice: number
    if (adjustmentType === 'percent') {
      newPrice = direction === 'increase'
        ? current * (1 + val / 100)
        : current * (1 - val / 100)
    } else {
      newPrice = direction === 'increase' ? current + val : current - val
    }

    return Math.max(0, Math.round(newPrice * 100) / 100)
  }

  const preview = selectedCells
    .map(cell => {
      const current = getCurrentPrice(cell.capacityId, cell.tier)
      const next = calcNewPrice(current)
      const cap = capacities.find(c => c.id === cell.capacityId)
      return { cap, tier: cell.tier, current, next, capacityId: cell.capacityId }
    })
    .filter(p => p.current !== null)

  async function applyBulk() {
    setSaving(true)
    try {
      const updates: any[] = []

      for (const { capacityId, tier, next } of preview) {
        if (next === null) continue
        const existing = currentTiers.find(
          t => t.capacity_option_id === capacityId && t.tier === tier
        )

        if (existing) {
          updates.push(
            supabase
              .from('pricing_tiers')
              .update({ price: next, updated_at: new Date().toISOString() })
              .eq('id', existing.id)
              .then(r => r)
          )
        }
      }

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)
      if (errors.length > 0) throw new Error('Some updates failed')

      const { data: refreshed } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('business_id', businessId)
        .eq('product_id', productId)

      if (refreshed) onTiersUpdate(refreshed)
      toast.success(`Updated ${updates.length} price${updates.length !== 1 ? 's' : ''}`)
      onClose()
    } catch (err) {
      console.error('Bulk update error:', err)
      toast.error('Failed to apply bulk update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Price Editor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={v => setAdjustmentType(v as AdjustmentType)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="percent" id="percent" />
                <Label htmlFor="percent">Percentage (%)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed Amount ($)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <RadioGroup
              value={direction}
              onValueChange={v => setDirection(v as Direction)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="increase" id="increase" />
                <Label htmlFor="increase">Increase</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="decrease" id="decrease" />
                <Label htmlFor="decrease">Decrease</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Amount {adjustmentType === 'percent' ? '(%)' : '($)'}</Label>
            <Input
              type="number"
              min="0"
              step={adjustmentType === 'percent' ? '0.1' : '1'}
              placeholder={adjustmentType === 'percent' ? 'e.g. 10' : 'e.g. 500'}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="max-w-[160px]"
            />
          </div>

          {preview.length > 0 && amount && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="rounded-md border border-border divide-y divide-border max-h-40 overflow-y-auto">
                {preview.map(({ cap, tier, current, next }) => (
                  <div
                    key={`${cap?.id}|${tier}`}
                    className="flex items-center justify-between px-3 py-1.5 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {cap?.label} / <span className="capitalize">{tier}</span>
                    </span>
                    <span>
                      <span className="line-through text-muted-foreground mr-2">
                        ${current?.toLocaleString()}
                      </span>
                      <span className="font-semibold text-foreground">
                        ${next?.toLocaleString()}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={applyBulk}
            disabled={saving || !amount || preview.filter(p => p.current !== null).length === 0}
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Apply to {preview.filter(p => p.current !== null).length} Cells
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
