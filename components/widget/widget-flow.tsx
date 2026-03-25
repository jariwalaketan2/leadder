'use client'

import { useState } from 'react'
import { getSqftRange } from '@/lib/utils/hvac'
import {
  Check, ArrowLeft, Loader2,
  User, Mail, Phone, Search,
  Snowflake, Thermometer, Flame, Wind, Zap, Fan, Droplets, Wrench, Settings,
  Home, Building2, DoorOpen, ArrowDownToLine, MoveDown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProductConfig {
  product_id: string
  price_range_pct: number
  multi_unit_discount_pct: number
  attic_additional_cost: number
  basement_additional_cost: number
  closet_additional_cost: number
  garage_additional_cost: number
  crawl_space_additional_cost: number
}

interface WidgetData {
  business: {
    id: string
    name: string
    slug: string
    primaryColor: string
    logoUrl: string | null
  }
  products: Array<{
    id: string
    name: string
    slug: string
    category: string
    description: string
    icon: string
    display_order: number
    capacity_options: Array<{
      id: string
      label: string
      value: string
      unit: string
      display_order: number
    }>
  }>
  pricingTiers: Array<{
    id: string
    product_id: string
    capacity_option_id: string | null
    tier: string
    price: number
    warranty_years: number | null
    features: string[]
    scope_of_work: string | null
  }>
  productConfigs: ProductConfig[]
  systemConfigs: Array<{
    product_id: string
    tier: string
    efficiency_description: string | null
  }>
  settings: {
    widget_title: string
    widget_subtitle: string
    widget_thank_you_message: string
    price_range_pct?: number
  }
}

type Step = 'capacity' | 'location' | 'qty' | 'pricing' | 'contact' | 'confirmation'

// Confirmation card tier colors: green / amber / blue
const CONF_TIER_STYLES: Record<string, { badge: string; headerBg: string; priceCls: string }> = {
  good:   { badge: 'bg-green-100 text-green-700',  headerBg: 'bg-green-50  border-green-200',  priceCls: 'text-green-700'  },
  better: { badge: 'bg-amber-100 text-amber-700',  headerBg: 'bg-amber-50  border-amber-200',  priceCls: 'text-amber-700'  },
  best:   { badge: 'bg-blue-100  text-blue-700',   headerBg: 'bg-blue-50   border-blue-200',   priceCls: 'text-blue-700'   },
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRODUCT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Snowflake, Thermometer, Flame, Wind, Zap, Fan, Droplets, Wrench, Settings,
}


const TIER_STYLES: Record<string, {
  badge: string; dot: string; fill: string; border: string; selBorder: string; popBg: string
}> = {
  good:   { badge: 'bg-emerald-100 text-emerald-700', dot: 'border-emerald-400', fill: 'bg-emerald-500', border: 'border-gray-200', selBorder: 'border-emerald-500', popBg: '' },
  better: { badge: 'bg-indigo-600 text-white',        dot: 'border-indigo-600',  fill: 'bg-indigo-600',  border: 'border-indigo-200', selBorder: 'border-indigo-600', popBg: 'bg-indigo-50/60' },
  best:   { badge: 'bg-violet-100 text-violet-700',   dot: 'border-violet-500',  fill: 'bg-violet-500',  border: 'border-gray-200', selBorder: 'border-violet-500', popBg: '' },
}

const LOCATION_OPTIONS = [
  { key: 'attic',       label: 'Attic',       description: 'Indoor unit in the attic space',   Icon: Home },
  { key: 'garage',      label: 'Garage',      description: 'Indoor unit in the garage area',   Icon: Building2 },
  { key: 'closet',      label: 'Closet',      description: 'Indoor unit in a closet',          Icon: DoorOpen },
  { key: 'basement',    label: 'Basement',    description: 'Indoor unit in the basement',      Icon: ArrowDownToLine },
  { key: 'crawl_space', label: 'Crawl Space', description: 'Indoor unit in the crawl space',  Icon: MoveDown },
]

// ─── Small UI primitives ──────────────────────────────────────────────────────

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div className={`w-5 h-5 rounded-full border-2 mx-auto mt-3 flex items-center justify-center transition-colors ${
      selected ? 'border-indigo-600' : 'border-gray-300'
    }`}>
      {selected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
    </div>
  )
}

function IconBox({ Icon }: { Icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto mb-3">
      <Icon className="w-6 h-6 text-white" />
    </div>
  )
}

function SelectCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border-2 bg-white p-5 text-center transition-all hover:border-indigo-400 ${
        selected ? 'border-indigo-600 shadow-sm' : 'border-gray-200'
      }`}
    >
      {children}
    </div>
  )
}

function FormInput({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        {...props}
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-[#1a1a3e] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WidgetFlow({ data }: { data: WidgetData }) {
  const [selectedProduct, setSelectedProduct] = useState<typeof data.products[0] | null>(null)
  const [introActive, setIntroActive] = useState(false)
  const [step, setStep] = useState<Step>('capacity')
  const [selectedCapacity, setSelectedCapacity] = useState<{ id: string; label: string; value: string; unit: string; sqft: string | null } | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [unitQty, setUnitQty] = useState(1)
  const [selectedTier, setSelectedTier] = useState<typeof data.pricingTiers[0] | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cityZip, setCityZip] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set())

  // ── Helpers ──

  const getProductConfig = (productId: string) =>
    data.productConfigs?.find(c => c.product_id === productId)

  const getEfficiencyDescription = (productId: string, tier: string) =>
    data.systemConfigs?.find(c => c.product_id === productId && c.tier === tier)?.efficiency_description ?? null

  const hasLocationStep = (productId: string) => {
    const cfg = getProductConfig(productId)
    if (!cfg) return false
    return [
      cfg.attic_additional_cost, cfg.basement_additional_cost,
      cfg.closet_additional_cost, cfg.garage_additional_cost,
      cfg.crawl_space_additional_cost,
    ].some(c => c > 0)
  }

  const getActiveSteps = (productId?: string): Step[] => {
    const id = productId ?? selectedProduct?.id ?? ''
    const product = data.products.find(p => p.id === id)
    const isService = product?.category === 'service' || !product?.capacity_options?.length
    const steps: Step[] = []
    if (product?.capacity_options?.length) steps.push('capacity')
    if (id && hasLocationStep(id)) steps.push('location')
    if (!isService) steps.push('qty')
    if (isService) steps.push('pricing') // services: single price confirmation
    steps.push('contact', 'confirmation')
    return steps
  }

  const getLocationCost = (productId: string, location: string): number => {
    const cfg = getProductConfig(productId)
    if (!cfg || !location) return 0
    const map: Record<string, number> = {
      attic: cfg.attic_additional_cost,
      basement: cfg.basement_additional_cost,
      closet: cfg.closet_additional_cost,
      garage: cfg.garage_additional_cost,
      crawl_space: cfg.crawl_space_additional_cost,
    }
    return map[location] ?? 0
  }

  // Returns the adjusted base price (location + qty) without range formatting — used for DB storage
  const calcAdjustedPrice = (price: number): number => {
    const cfg = selectedProduct ? getProductConfig(selectedProduct.id) : undefined
    const locationCost = selectedProduct ? getLocationCost(selectedProduct.id, selectedLocation) : 0
    const discountPct = cfg?.multi_unit_discount_pct ?? 0
    let base = price + locationCost
    if (unitQty > 1 && discountPct > 0) {
      base = base * unitQty * (1 - discountPct / 100)
    } else if (unitQty > 1) {
      base = base * unitQty
    }
    return Math.round(base)
  }

  const formatPrice = (price: number): string => {
    const cfg = selectedProduct ? getProductConfig(selectedProduct.id) : undefined
    const pct = cfg?.price_range_pct ?? data.settings.price_range_pct ?? 0
    const base = calcAdjustedPrice(price)
    if (pct > 0) {
      const high = Math.round(base * (1 + pct / 100))
      return `$${base.toLocaleString()} – $${high.toLocaleString()}`
    }
    return `$${base.toLocaleString()}`
  }

  const getTiersForSelection = () => {
    if (!selectedProduct) return []
    return data.pricingTiers
      .filter(t => {
        if (t.product_id !== selectedProduct.id) return false
        return selectedCapacity
          ? t.capacity_option_id === selectedCapacity.id
          : t.capacity_option_id === null
      })
      .sort((a, b) => {
        const order = { good: 0, better: 1, best: 2 }
        return order[a.tier as keyof typeof order] - order[b.tier as keyof typeof order]
      })
  }

  const advanceFrom = (currentStep: Step, productId?: string) => {
    const activeSteps = getActiveSteps(productId)
    const idx = activeSteps.indexOf(currentStep)
    if (idx >= 0 && idx < activeSteps.length - 1) {
      setStep(activeSteps[idx + 1])
    }
  }

  // ── Handlers ──

  const handleTabSelect = (product: typeof data.products[0]) => {
    setSelectedProduct(product)
    setIntroActive(true)
    setSelectedCapacity(null)
    setSelectedLocation('')
    setUnitQty(1)
    setSelectedTier(null)
    setExpandedTiers(new Set())
  }

  const handleStartEstimate = () => {
    if (!selectedProduct) return
    setIntroActive(false)
    const steps = getActiveSteps(selectedProduct.id)
    setStep(steps[0])
  }

  const handleBack = () => {
    if (!selectedProduct) return
    const activeSteps = getActiveSteps()
    const currentIndex = activeSteps.indexOf(step)
    if (currentIndex <= 0) {
      setIntroActive(true)
      return
    }
    const prevStep = activeSteps[currentIndex - 1]
    if (prevStep === 'capacity') { setSelectedCapacity(null); setSelectedLocation(''); setUnitQty(1) }
    else if (prevStep === 'location') { setSelectedLocation(''); setUnitQty(1) }
    else if (prevStep === 'qty') { setUnitQty(1) }
    else if (prevStep === 'pricing') { setSelectedTier(null) } // services only
    setStep(prevStep)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) return
    setSubmitting(true)

    const parts = fullName.trim().split(' ')
    const firstName = parts[0]
    const lastName = parts.slice(1).join(' ') || parts[0]

    const isService = selectedProduct?.category === 'service' || !selectedProduct?.capacity_options?.length

    // For equipment: calculate all 3 adjusted prices; for services: use selectedTier
    let priceGood: number | null = null
    let priceBetter: number | null = null
    let priceBest: number | null = null
    let quotedPrice: number | null = null
    let tierSelected: string | null = null
    let pricingTierId: string | null = null

    if (isService && selectedTier) {
      quotedPrice = calcAdjustedPrice(selectedTier.price)
      tierSelected = selectedTier.tier
      pricingTierId = selectedTier.id
    } else if (!isService) {
      const tiers = getTiersForSelection()
      const tierMap = Object.fromEntries(tiers.map(t => [t.tier, t]))
      priceGood   = tierMap.good   ? calcAdjustedPrice(tierMap.good.price)   : null
      priceBetter = tierMap.better ? calcAdjustedPrice(tierMap.better.price) : null
      priceBest   = tierMap.best   ? calcAdjustedPrice(tierMap.best.price)   : null
    }

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: data.business.id,
          productId: selectedProduct?.id,
          capacityOptionId: selectedCapacity?.id,
          pricingTierId,
          productName: selectedProduct?.name,
          capacityLabel: selectedCapacity?.label,
          tierSelected,
          quotedPrice,
          priceGood,
          priceBetter,
          priceBest,
          firstName,
          lastName,
          email,
          phone,
          city: cityZip,
          address: null,
          state: null,
          zip: null,
        }),
      })
      if (res.ok) {
        setSubmitted(true)
        setStep('confirmation')
      }
    } catch (err) {
      console.error('Error submitting lead:', err)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Progress ──

  const activeSteps = selectedProduct ? getActiveSteps() : []
  const currentStepIndex = activeSteps.indexOf(step)
  const totalSteps = activeSteps.length - 1 // exclude confirmation from denominator
  const progress = step === 'confirmation'
    ? 100
    : selectedProduct && currentStepIndex >= 0
      ? ((currentStepIndex + 1) / totalSteps) * 100
      : 0

  const sortedProducts = [...data.products].sort((a, b) => a.display_order - b.display_order)

  // ── Render ──

  return (
    <div className="min-h-screen bg-[#f7f8fc] flex flex-col" style={{ colorScheme: 'light' }}>

      {/* ── Product Tabs ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {sortedProducts.map(product => {
              const IconComponent = PRODUCT_ICONS[product.icon] || Settings
              const isActive = selectedProduct?.id === product.id
              return (
                <button
                  key={product.id}
                  onClick={() => handleTabSelect(product)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {product.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">

        {/* Global landing — no product selected yet */}
        {!selectedProduct && (
          <div className="text-center py-24 max-w-2xl mx-auto">
            {sortedProducts.length === 0 ? (
              <p className="text-gray-400">No services are currently available.</p>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-[#1a1a3e] mb-4 leading-tight">
                  {data.settings.widget_title}
                </h1>
                <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
                  {data.settings.widget_subtitle}
                </p>
                <button
                  onClick={() => handleTabSelect(sortedProducts[0])}
                  className="px-10 py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        )}

        {/* Per-product landing — shown after tab click before estimation starts */}
        {selectedProduct && introActive && (() => {
          const IconComponent = PRODUCT_ICONS[selectedProduct.icon] || Settings
          return (
            <div className="text-center py-20 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-md">
                <IconComponent className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-[#1a1a3e] mb-3">{selectedProduct.name}</h2>
              {selectedProduct.description && (
                <p className="text-gray-500 text-base mb-10 max-w-sm mx-auto leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}
              <button
                onClick={handleStartEstimate}
                className="px-10 py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-base hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Start Estimate
              </button>
            </div>
          )
        })()}

        {/* Confirmation */}
        {selectedProduct && !introActive && step === 'confirmation' && submitted && (() => {
          const isService = selectedProduct.category === 'service' || !selectedProduct.capacity_options?.length
          const tiers = getTiersForSelection()
          const capLine = selectedCapacity
            ? selectedCapacity.sqft
              ? `${selectedCapacity.label} • ${selectedCapacity.sqft} sq ft`
              : selectedCapacity.label
            : null

          return (
            <div className="py-8">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#1a1a3e] mb-2">You&apos;re all set!</h2>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">{data.settings.widget_thank_you_message}</p>
              </div>

              {/* Equipment — 3 informational tier cards */}
              {!isService && tiers.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {tiers.map(tier => {
                    const ts = CONF_TIER_STYLES[tier.tier] ?? CONF_TIER_STYLES.good
                    const eff = getEfficiencyDescription(selectedProduct.id, tier.tier)
                    const scope = tier.scope_of_work?.trim() ?? ''
                    const isExpanded = expandedTiers.has(tier.tier)
                    const PREVIEW = 120

                    return (
                      <div key={tier.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
                        {/* Card header */}
                        <div className={`px-5 pt-4 pb-3 border-b ${ts.headerBg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${ts.badge}`}>
                              {tier.tier}
                            </span>
                            {tier.tier === 'better' && (
                              <span className="text-xs bg-amber-500 text-white font-semibold px-2 py-0.5 rounded-full">
                                Most Popular
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-[#1a1a3e] text-sm">{selectedProduct.name}</p>
                          {capLine && <p className="text-xs text-gray-400 mt-0.5">{capLine}</p>}
                        </div>

                        {/* Card body */}
                        <div className="p-5 space-y-4 flex-1">
                          {/* Estimated price */}
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Estimated Price</p>
                            <p className={`text-xl font-bold ${ts.priceCls}`}>{formatPrice(tier.price)}</p>
                          </div>

                          {/* Unit efficiency */}
                          {eff && (
                            <div className="bg-gray-50 rounded-xl p-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Unit Efficiency</p>
                              <p className="text-sm text-gray-600 leading-relaxed">{eff}</p>
                            </div>
                          )}

                          {/* What's included */}
                          {scope && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">What&apos;s Included</p>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {isExpanded || scope.length <= PREVIEW
                                  ? scope
                                  : scope.slice(0, PREVIEW) + '…'}
                              </p>
                              {scope.length > PREVIEW && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedTiers(prev => {
                                    const next = new Set(prev)
                                    isExpanded ? next.delete(tier.tier) : next.add(tier.tier)
                                    return next
                                  })}
                                  className="text-xs text-indigo-600 hover:text-indigo-700 mt-1.5 font-medium"
                                >
                                  {isExpanded ? 'See Less' : 'See More'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Equipment — no tiers configured */}
              {!isService && tiers.length === 0 && (
                <p className="text-center text-gray-400 text-sm">Contact us for a custom quote.</p>
              )}

              {/* Service — simple single-price summary */}
              {isService && selectedTier && (
                <div className="max-w-sm mx-auto bg-white rounded-2xl border border-gray-200 p-5 text-left">
                  <h3 className="font-semibold text-[#1a1a3e] mb-3">Your Quote</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Service</span>
                      <span className="font-medium text-[#1a1a3e]">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
                      <span className="text-gray-500">Estimated Price</span>
                      <span className="text-xl font-bold text-indigo-600">{formatPrice(selectedTier.price)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Steps */}
        {selectedProduct && !introActive && step !== 'confirmation' && (
          <>
            {/* Back + Progress */}
            <div className="mb-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, progress)}%` }}
                />
              </div>
            </div>

            {/* ── Step: Capacity ── */}
            {step === 'capacity' && (
              <>
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-[#1a1a3e]">Select System Size</h2>
                  <p className="text-gray-500 mt-1">What size system do you need?</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[...selectedProduct.capacity_options]
                    .sort((a, b) => a.display_order - b.display_order)
                    .map(cap => (
                      <SelectCard
                        key={cap.id}
                        selected={selectedCapacity?.id === cap.id}
                        onClick={() => {
                          setSelectedCapacity({ id: cap.id, label: cap.label, value: cap.value, unit: cap.unit, sqft: getSqftRange(cap.value, cap.unit) })
                          advanceFrom('capacity')
                        }}
                      >
                        <IconBox Icon={Home} />
                        {(() => {
                          const sqft = getSqftRange(cap.value, cap.unit)
                          return sqft ? (
                            <>
                              <p className="font-semibold text-[#1a1a3e] text-sm">{sqft} sq ft</p>
                              <p className="text-xs text-gray-400 mt-0.5">{cap.label}</p>
                            </>
                          ) : (
                            <p className="font-semibold text-[#1a1a3e] text-sm">{cap.label}</p>
                          )
                        })()}
                        <RadioDot selected={selectedCapacity?.id === cap.id} />
                      </SelectCard>
                    ))}
                </div>
              </>
            )}

            {/* ── Step: Location ── */}
            {step === 'location' && (
              <>
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-[#1a1a3e]">Indoor Unit Location</h2>
                  <p className="text-gray-500 mt-1">Where will the indoor unit be installed?</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(() => {
                    const cfg = getProductConfig(selectedProduct.id)
                    const costMap: Record<string, number> = {
                      attic: cfg?.attic_additional_cost ?? 0,
                      garage: cfg?.garage_additional_cost ?? 0,
                      closet: cfg?.closet_additional_cost ?? 0,
                      basement: cfg?.basement_additional_cost ?? 0,
                      crawl_space: cfg?.crawl_space_additional_cost ?? 0,
                    }
                    return LOCATION_OPTIONS
                      .filter(l => (costMap[l.key] ?? 0) > 0)
                      .map(loc => (
                        <SelectCard
                          key={loc.key}
                          selected={selectedLocation === loc.key}
                          onClick={() => {
                            setSelectedLocation(loc.key)
                            advanceFrom('location')
                          }}
                        >
                          <IconBox Icon={loc.Icon} />
                          <p className="font-semibold text-[#1a1a3e] text-sm">{loc.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{loc.description}</p>
                          <RadioDot selected={selectedLocation === loc.key} />
                        </SelectCard>
                      ))
                  })()}
                </div>
              </>
            )}

            {/* ── Step: Qty ── */}
            {step === 'qty' && (
              <>
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-bold text-[#1a1a3e]">How many units need to be replaced?</h2>
                </div>
                <div className="flex gap-3 justify-center flex-wrap">
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectCard
                      key={n}
                      selected={unitQty === n}
                      onClick={() => {
                        setUnitQty(n)
                        advanceFrom('qty')
                      }}
                    >
                      <p className="text-4xl font-bold text-[#1a1a3e] w-16 leading-none py-1">{n}</p>
                      <RadioDot selected={unitQty === n} />
                    </SelectCard>
                  ))}
                </div>
              </>
            )}

            {/* ── Step: Pricing ── */}
            {step === 'pricing' && (() => {
              const tiers = getTiersForSelection()
              const isService = tiers.length === 1

              if (tiers.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                    <p className="text-gray-500">Pricing not yet configured. Please contact us directly.</p>
                  </div>
                )
              }

              // ── Single-price service card ──
              if (isService) {
                const tier = tiers[0]
                const descLines = tier.features?.length > 0
                  ? tier.features
                  : (tier.scope_of_work ?? '').split('\n').filter(Boolean)

                return (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-[#1a1a3e]">{selectedProduct?.name}</h2>
                      <p className="text-gray-500 mt-1">Here&apos;s what&apos;s included</p>
                    </div>
                    <div className="max-w-md mx-auto bg-white rounded-2xl border-2 border-indigo-600 shadow-sm p-7 text-center">
                      <p className="text-4xl font-bold text-indigo-600 mb-1">{formatPrice(tier.price)}</p>
                      {tier.warranty_years && (
                        <p className="text-xs text-gray-400 mb-4">{tier.warranty_years}-yr warranty</p>
                      )}
                      {descLines.length > 0 && (
                        <ul className="text-left space-y-2 mb-6">
                          {descLines.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                              <Check className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTier(tier)
                          advanceFrom('pricing')
                        }}
                        className="w-full py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Continue
                      </button>
                    </div>
                  </>
                )
              }

              // ── Multi-tier equipment picker ──
              return (
                <>
                  <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-[#1a1a3e]">Choose Your Package</h2>
                    <p className="text-gray-500 mt-1">Select the option that fits your needs</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {tiers.map(tier => {
                      const ts = TIER_STYLES[tier.tier] ?? TIER_STYLES.good
                      const isSelected = selectedTier?.id === tier.id
                      const eff = selectedProduct ? getEfficiencyDescription(selectedProduct.id, tier.tier) : null
                      const capLine = selectedCapacity
                        ? selectedCapacity.sqft
                          ? `${selectedCapacity.label} · ${selectedCapacity.sqft} sq ft`
                          : selectedCapacity.label
                        : null

                      return (
                        <div
                          key={tier.id}
                          onClick={() => { setSelectedTier(tier); advanceFrom('pricing') }}
                          className={`cursor-pointer rounded-2xl border-2 p-5 transition-all hover:shadow-md ${ts.popBg} ${
                            isSelected ? ts.selBorder + ' shadow-sm' : ts.border
                          }`}
                        >
                          {/* Tier badge */}
                          <div className="flex items-center justify-between mb-3">
                            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${ts.badge}`}>
                              {tier.tier}
                            </span>
                            {tier.tier === 'better' && (
                              <span className="text-xs bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full">
                                Most Popular
                              </span>
                            )}
                          </div>

                          {/* Capacity context */}
                          {capLine && (
                            <p className="text-xs text-gray-400 mb-2">{capLine}</p>
                          )}

                          {/* Warranty */}
                          {tier.warranty_years && (
                            <p className="text-xs text-gray-400 mb-3">{tier.warranty_years}-yr warranty</p>
                          )}

                          {/* Efficiency description */}
                          {eff && (
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">{eff}</p>
                          )}

                          {/* Radio */}
                          <div className={`w-5 h-5 rounded-full border-2 mt-3 flex items-center justify-center transition-colors ${isSelected ? ts.dot : 'border-gray-300'}`}>
                            {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${ts.fill}`} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}

            {/* ── Step: Contact ── */}
            {step === 'contact' && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[#1a1a3e]">Almost there! Tell us about yourself</h2>
                  <p className="text-gray-500 mt-1">We&apos;ll use this information to prepare your personalized quote</p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-3">
                  <FormInput
                    icon={User}
                    required
                    placeholder="Full Name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                  <FormInput
                    icon={Mail}
                    required
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <FormInput
                    icon={Phone}
                    required
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                  {/* City / ZIP with clear button */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      placeholder="City or ZIP Code"
                      value={cityZip}
                      onChange={e => setCityZip(e.target.value)}
                      className="w-full pl-10 pr-9 py-3 rounded-xl border border-gray-200 bg-white text-[#1a1a3e] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {cityZip && (
                      <button
                        type="button"
                        onClick={() => setCityZip('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center rounded-full"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Consent */}
                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      required
                      checked={consent}
                      onChange={e => setConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-xs text-gray-500 leading-relaxed">
                      I authorize {data.business.name} to contact me about my quote by call or text.
                      Consent is not required to purchase.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting || !consent}
                    className="w-full py-3.5 rounded-full bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      : 'Get My Quote'
                    }
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <p className="text-center py-4 text-xs text-gray-400">
        Powered by{' '}
        <span className="text-indigo-500 font-medium">{data.business.name}</span>
      </p>
    </div>
  )
}
