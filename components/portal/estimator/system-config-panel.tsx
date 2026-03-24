'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, CopyCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { TierSystemConfiguration, CapacityOption, PricingTier } from '@/lib/types/database'

interface SystemConfigPanelProps {
  businessId: string
  productId: string
  systemConfig: TierSystemConfiguration[]
  capacities: CapacityOption[]
  tiers: PricingTier[]
  onConfigUpdate: (newConfig: TierSystemConfiguration[]) => void
  onTiersUpdate: (newTiers: PricingTier[]) => void
}

type TierType = 'good' | 'better' | 'best'

const tierColors: Record<TierType, string> = {
  good: 'data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400',
  better: 'data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400',
  best: 'data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400',
}

const TIER_ORDER: TierType[] = ['good', 'better', 'best']

function getConfig(systemConfig: TierSystemConfiguration[], tier: TierType): Partial<TierSystemConfiguration> {
  return systemConfig.find(c => c.tier === tier) ?? {}
}

export function SystemConfigPanel({
  businessId,
  productId,
  systemConfig,
  capacities,
  tiers,
  onConfigUpdate,
  onTiersUpdate,
}: SystemConfigPanelProps) {
  const supabase = createClient()

  // Local editable state per tier
  const [configs, setConfigs] = useState<Record<TierType, {
    efficiency_description: string
    warranty_years: string
    warranty_terms: string
    scope_of_work: string
  }>>({
    good: {
      efficiency_description: getConfig(systemConfig, 'good').efficiency_description ?? '',
      warranty_years: getConfig(systemConfig, 'good').warranty_years?.toString() ?? '',
      warranty_terms: getConfig(systemConfig, 'good').warranty_terms ?? '',
      scope_of_work: getConfig(systemConfig, 'good').scope_of_work ?? '',
    },
    better: {
      efficiency_description: getConfig(systemConfig, 'better').efficiency_description ?? '',
      warranty_years: getConfig(systemConfig, 'better').warranty_years?.toString() ?? '',
      warranty_terms: getConfig(systemConfig, 'better').warranty_terms ?? '',
      scope_of_work: getConfig(systemConfig, 'better').scope_of_work ?? '',
    },
    best: {
      efficiency_description: getConfig(systemConfig, 'best').efficiency_description ?? '',
      warranty_years: getConfig(systemConfig, 'best').warranty_years?.toString() ?? '',
      warranty_terms: getConfig(systemConfig, 'best').warranty_terms ?? '',
      scope_of_work: getConfig(systemConfig, 'best').scope_of_work ?? '',
    },
  })

  const [savingTier, setSavingTier] = useState<TierType | null>(null)
  const [applyingAll, setApplyingAll] = useState(false)

  function updateField(tier: TierType, field: string, value: string) {
    setConfigs(prev => ({
      ...prev,
      [tier]: { ...prev[tier], [field]: value },
    }))
  }

  async function saveTierConfig(tier: TierType) {
    setSavingTier(tier)
    try {
      const cfg = configs[tier]
      const payload = {
        business_id: businessId,
        product_id: productId,
        tier,
        efficiency_description: cfg.efficiency_description || null,
        warranty_years: cfg.warranty_years ? parseInt(cfg.warranty_years) : null,
        warranty_terms: cfg.warranty_terms || null,
        scope_of_work: cfg.scope_of_work || null,
        updated_at: new Date().toISOString(),
      }

      const existing = systemConfig.find(c => c.tier === tier)
      let result

      if (existing) {
        result = await supabase
          .from('tier_system_configurations')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from('tier_system_configurations')
          .insert(payload)
          .select()
          .single()
      }

      if (result.error) throw result.error

      const updated = systemConfig.filter(c => c.tier !== tier)
      onConfigUpdate([...updated, result.data])
      toast.success(`${tier.charAt(0).toUpperCase() + tier.slice(1)} tier saved`)
    } catch (err) {
      console.error('Error saving tier config:', err)
      toast.error('Failed to save tier configuration')
    } finally {
      setSavingTier(null)
    }
  }

  async function applyToAll() {
    setApplyingAll(true)
    try {
      const enabledCapacities = capacities.filter(c => c.is_enabled)
      if (enabledCapacities.length === 0) {
        toast.error('No enabled capacities to apply to')
        return
      }

      const updates: any[] = []

      for (const capacity of enabledCapacities) {
        for (const tier of TIER_ORDER) {
          const cfg = configs[tier]
          const warrantyYears = cfg.warranty_years ? parseInt(cfg.warranty_years) : null
          const scopeOfWork = cfg.scope_of_work || null

          const existing = tiers.find(
            t => t.capacity_option_id === capacity.id && t.tier === tier
          )

          if (existing) {
            updates.push(
              supabase
                .from('pricing_tiers')
                .update({
                  warranty_years: warrantyYears,
                  scope_of_work: scopeOfWork,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .then(r => r)
            )
          } else {
            updates.push(
              supabase
                .from('pricing_tiers')
                .insert({
                  business_id: businessId,
                  product_id: productId,
                  capacity_option_id: capacity.id,
                  tier,
                  price: 0,
                  warranty_years: warrantyYears,
                  scope_of_work: scopeOfWork,
                  is_active: true,
                })
                .then(r => r)
            )
          }
        }
      }

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)
      if (errors.length > 0) throw new Error('Some updates failed')

      // Refresh tiers
      const { data: refreshedTiers } = await supabase
        .from('pricing_tiers')
        .select('*')
        .eq('business_id', businessId)
        .eq('product_id', productId)

      if (refreshedTiers) onTiersUpdate(refreshedTiers)
      toast.success(`Applied to ${enabledCapacities.length} capacities`)
    } catch (err) {
      console.error('Error applying to all:', err)
      toast.error('Failed to apply configurations')
    } finally {
      setApplyingAll(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">System Configuration</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={applyToAll}
            disabled={applyingAll}
          >
            {applyingAll ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CopyCheck className="w-4 h-4 mr-2" />
            )}
            Apply to All Capacities
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure tier descriptions, warranties, and scope of work. Use "Apply to All" to push to every capacity.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="good">
          <TabsList className="mb-4">
            {TIER_ORDER.map(tier => (
              <TabsTrigger key={tier} value={tier} className={tierColors[tier]}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {TIER_ORDER.map(tier => (
            <TabsContent key={tier} value={tier} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Efficiency Description</Label>
                  <Input
                    placeholder="e.g. 14 SEER Standard Efficiency"
                    value={configs[tier].efficiency_description}
                    onChange={e => updateField(tier, 'efficiency_description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Warranty (years)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    placeholder="e.g. 10"
                    value={configs[tier].warranty_years}
                    onChange={e => updateField(tier, 'warranty_years', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Warranty Terms</Label>
                <Input
                  placeholder="e.g. Parts & labor, 10-year manufacturer warranty"
                  value={configs[tier].warranty_terms}
                  onChange={e => updateField(tier, 'warranty_terms', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Scope of Work</Label>
                <Textarea
                  placeholder="Describe what's included in this tier..."
                  rows={3}
                  value={configs[tier].scope_of_work}
                  onChange={e => updateField(tier, 'scope_of_work', e.target.value)}
                />
              </div>

              <Button
                onClick={() => saveTierConfig(tier)}
                disabled={savingTier === tier}
                size="sm"
              >
                {savingTier === tier && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
