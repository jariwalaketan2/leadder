'use client'

import { useState, useEffect } from 'react'
import { Product, CapacityOption, PricingTier } from '@/lib/types/database'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProductWithCapacities extends Product {
  capacity_options: CapacityOption[]
}

interface ProductPricingModalProps {
  product: ProductWithCapacities
  existingTiers: PricingTier[]
  businessId: string
  isOpen: boolean
  onClose: () => void
  onTiersUpdated: (tiers: PricingTier[]) => void
}

interface TierFormData {
  good: { price: string; warranty: string; features: string; scope: string }
  better: { price: string; warranty: string; features: string; scope: string }
  best: { price: string; warranty: string; features: string; scope: string }
}

const defaultTierData = {
  good: { 
    price: '', 
    warranty: '5', 
    features: 'Standard efficiency equipment\nBasic installation\n1-year labor warranty\nManufacturer parts warranty', 
    scope: 'Complete system installation including standard equipment, basic ductwork modifications if needed, electrical connections, condensate drain, thermostat wiring, and startup testing.' 
  },
  better: { 
    price: '', 
    warranty: '10', 
    features: 'High-efficiency equipment (16+ SEER)\nPremium installation\n2-year labor warranty\nExtended parts warranty\nProgrammable thermostat included', 
    scope: 'Premium system installation with high-efficiency equipment, thorough ductwork inspection and sealing, upgraded electrical connections, condensate pump if needed, smart thermostat installation, complete system balancing, and extended testing.' 
  },
  best: { 
    price: '', 
    warranty: '12', 
    features: 'Top-tier efficiency equipment (18+ SEER)\nWhite-glove installation\n5-year labor warranty\nLifetime parts warranty\nSmart thermostat with WiFi\nAnnual maintenance included (1st year)', 
    scope: 'Elite system installation featuring top-of-the-line equipment, complete ductwork optimization, premium electrical upgrades, advanced air quality accessories, smart home integration, comprehensive system commissioning, first year of preventive maintenance, and priority service scheduling.' 
  },
}

export function ProductPricingModal({
  product,
  existingTiers,
  businessId,
  isOpen,
  onClose,
  onTiersUpdated,
}: ProductPricingModalProps) {
  const [selectedCapacity, setSelectedCapacity] = useState<CapacityOption | null>(null)
  const [formData, setFormData] = useState<TierFormData>(defaultTierData)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const hasCapacities = product.capacity_options && product.capacity_options.length > 0

  // Initialize selected capacity
  useEffect(() => {
    if (hasCapacities && product.capacity_options.length > 0) {
      setSelectedCapacity(product.capacity_options[0])
    } else {
      setSelectedCapacity(null)
    }
  }, [product, hasCapacities])

  // Load existing tier data when capacity changes
  useEffect(() => {
    if (!isOpen) return

    const capacityId = selectedCapacity?.id || null
    const tiersForCapacity = existingTiers.filter(
      t => t.capacity_option_id === capacityId
    )

    const newFormData = { ...defaultTierData }
    
    tiersForCapacity.forEach(tier => {
      const tierKey = tier.tier as keyof TierFormData
      newFormData[tierKey] = {
        price: tier.price?.toString() || '',
        warranty: tier.warranty_years?.toString() || '',
        features: Array.isArray(tier.features) ? tier.features.join('\n') : '',
        scope: tier.scope_of_work || '',
      }
    })

    setFormData(newFormData)
  }, [selectedCapacity, existingTiers, isOpen])

  const handleInputChange = (
    tier: keyof TierFormData,
    field: keyof TierFormData['good'],
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: value }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const capacityId = selectedCapacity?.id || null
      const tiersToUpsert: Array<{
        business_id: string
        product_id: string
        capacity_option_id: string | null
        tier: string
        price: number
        warranty_years: number | null
        features: string[]
        scope_of_work: string | null
      }> = []

      for (const tierKey of ['good', 'better', 'best'] as const) {
        const data = formData[tierKey]
        if (data.price && parseFloat(data.price) > 0) {
          tiersToUpsert.push({
            business_id: businessId,
            product_id: product.id,
            capacity_option_id: capacityId,
            tier: tierKey,
            price: parseFloat(data.price),
            warranty_years: data.warranty ? parseInt(data.warranty) : null,
            features: data.features.split('\n').filter(f => f.trim()),
            scope_of_work: data.scope || null,
          })
        }
      }

      // Delete existing tiers for this product/capacity
      await supabase
        .from('pricing_tiers')
        .delete()
        .eq('business_id', businessId)
        .eq('product_id', product.id)
        .eq('capacity_option_id', capacityId)

      // Insert new tiers
      if (tiersToUpsert.length > 0) {
        const { data: newTiers, error } = await supabase
          .from('pricing_tiers')
          .insert(tiersToUpsert)
          .select()

        if (error) throw error

        // Update parent with new tiers
        const otherTiers = existingTiers.filter(t => t.capacity_option_id !== capacityId)
        onTiersUpdated([...otherTiers, ...(newTiers || [])])
      } else {
        // No tiers to save, just remove existing
        const otherTiers = existingTiers.filter(t => t.capacity_option_id !== capacityId)
        onTiersUpdated(otherTiers)
      }

      toast.success('Pricing saved successfully')
    } catch (error) {
      console.error('Error saving pricing:', error)
      toast.error('Failed to save pricing')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const capacityId = selectedCapacity?.id || null
      
      await supabase
        .from('pricing_tiers')
        .delete()
        .eq('business_id', businessId)
        .eq('product_id', product.id)
        .eq('capacity_option_id', capacityId)

      const otherTiers = existingTiers.filter(t => t.capacity_option_id !== capacityId)
      onTiersUpdated(otherTiers)
      setFormData(defaultTierData)
      
      toast.success('Pricing deleted')
    } catch (error) {
      console.error('Error deleting pricing:', error)
      toast.error('Failed to delete pricing')
    } finally {
      setSaving(false)
    }
  }

  const hasPricing = formData.good.price || formData.better.price || formData.best.price

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            Configure Pricing: {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Capacity Selection */}
          {hasCapacities && (
            <div className="space-y-3">
              <Label className="text-foreground">Select Capacity</Label>
              <div className="flex flex-wrap gap-2">
                {product.capacity_options
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((capacity) => {
                    const isSelected = selectedCapacity?.id === capacity.id
                    const hasExistingTiers = existingTiers.some(
                      t => t.capacity_option_id === capacity.id
                    )
                    return (
                      <Button
                        key={capacity.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCapacity(capacity)}
                        className={isSelected ? 'bg-primary text-primary-foreground' : ''}
                      >
                        {capacity.label}
                        {hasExistingTiers && !isSelected && (
                          <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary text-xs">
                            Set
                          </Badge>
                        )}
                      </Button>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Tier Configuration */}
          <Tabs defaultValue="good" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="good" className="data-[state=active]:bg-background">
                Good
              </TabsTrigger>
              <TabsTrigger value="better" className="data-[state=active]:bg-background">
                Better
              </TabsTrigger>
              <TabsTrigger value="best" className="data-[state=active]:bg-background">
                Best
              </TabsTrigger>
            </TabsList>

            {(['good', 'better', 'best'] as const).map((tier) => (
              <TabsContent key={tier} value={tier} className="mt-4">
                <Card className="bg-muted/30 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-foreground capitalize flex items-center gap-2">
                      {tier} Tier
                      {tier === 'good' && <Badge variant="outline" className="text-xs">Budget</Badge>}
                      {tier === 'better' && <Badge variant="outline" className="text-xs">Recommended</Badge>}
                      {tier === 'best' && <Badge variant="outline" className="text-xs">Premium</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${tier}-price`} className="text-foreground">
                          Price ($)
                        </Label>
                        <Input
                          id={`${tier}-price`}
                          type="number"
                          placeholder="0.00"
                          value={formData[tier].price}
                          onChange={(e) => handleInputChange(tier, 'price', e.target.value)}
                          className="bg-input border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${tier}-warranty`} className="text-foreground">
                          Warranty (years)
                        </Label>
                        <Input
                          id={`${tier}-warranty`}
                          type="number"
                          placeholder="5"
                          value={formData[tier].warranty}
                          onChange={(e) => handleInputChange(tier, 'warranty', e.target.value)}
                          className="bg-input border-border text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${tier}-features`} className="text-foreground">
                        Features (one per line)
                      </Label>
                      <Textarea
                        id={`${tier}-features`}
                        placeholder="Standard equipment&#10;Basic installation&#10;1-year labor warranty"
                        value={formData[tier].features}
                        onChange={(e) => handleInputChange(tier, 'features', e.target.value)}
                        rows={4}
                        className="bg-input border-border text-foreground resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${tier}-scope`} className="text-foreground">
                        Scope of Work
                      </Label>
                      <Textarea
                        id={`${tier}-scope`}
                        placeholder="Describe what's included in this tier..."
                        value={formData[tier].scope}
                        onChange={(e) => handleInputChange(tier, 'scope', e.target.value)}
                        rows={3}
                        className="bg-input border-border text-foreground resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {hasPricing ? (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={saving}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Pricing
              </Button>
            ) : (
              <div />
            )}
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Pricing
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
