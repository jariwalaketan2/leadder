'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { BusinessProductConfig } from '@/lib/types/database'

const supabase = createClient()

interface PricingSettingsProps {
  businessId: string
  productId: string
  productConfig: BusinessProductConfig | null
  onConfigUpdate: (config: BusinessProductConfig) => void
}

export function PricingSettings({
  businessId,
  productId,
  productConfig,
  onConfigUpdate,
}: PricingSettingsProps) {

  const [priceRangePct, setPriceRangePct] = useState(
    productConfig?.price_range_pct?.toString() ?? '10'
  )
  const [multiUnitDiscount, setMultiUnitDiscount] = useState(
    productConfig?.multi_unit_discount_pct?.toString() ?? '0'
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const pct = parseFloat(priceRangePct) || 0
      const discount = parseFloat(multiUnitDiscount) || 0

      if (pct < 0 || pct > 100) {
        toast.error('Price range must be between 0 and 100')
        return
      }
      if (discount < 0 || discount > 100) {
        toast.error('Discount must be between 0 and 100')
        return
      }

      const payload = {
        business_id: businessId,
        product_id: productId,
        price_range_pct: pct,
        multi_unit_discount_pct: discount,
        updated_at: new Date().toISOString(),
      }

      let result
      if (productConfig) {
        result = await supabase
          .from('business_product_configs')
          .update(payload)
          .eq('id', productConfig.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('business_product_configs')
          .insert({ ...payload, is_enabled: true })
          .select()
          .single()
      }

      if (result.error) throw result.error
      onConfigUpdate(result.data)
      toast.success('Settings saved')
    } catch (err) {
      console.error('Error saving settings:', err)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const exampleBase = 8000
  const pct = parseFloat(priceRangePct) || 0
  const exampleHigh = Math.round(exampleBase * (1 + pct / 100))
  const priceExample = pct > 0
    ? `$${exampleBase.toLocaleString()} – $${exampleHigh.toLocaleString()}`
    : `$${exampleBase.toLocaleString()}`

  const discountPct = parseFloat(multiUnitDiscount) || 0
  const discountExample = discountPct > 0
    ? `2 units × $8,000 = $16,000 → $${(16000 * (1 - discountPct / 100)).toLocaleString()}`
    : 'No discount applied'

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Pricing Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Range */}
        <div className="space-y-2">
          <Label>Price Range Percentage</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              value={priceRangePct}
              onChange={e => setPriceRangePct(e.target.value)}
              className="max-w-[120px]"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Example with {pct}%: <span className="font-medium text-foreground">{priceExample}</span>
          </p>
        </div>

        {/* Multi-Unit Discount */}
        <div className="space-y-2">
          <Label>Multi-Unit Discount</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              value={multiUnitDiscount}
              onChange={e => setMultiUnitDiscount(e.target.value)}
              className="max-w-[120px]"
            />
            <span className="text-sm text-muted-foreground">% off when qty &gt; 1</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {discountExample}
          </p>
        </div>

        <Button onClick={save} disabled={saving} size="sm">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}
