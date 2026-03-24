const TON_TO_SQFT: Record<string, string> = {
  '1': 'up to 600',
  '1.5': '600 – 900',
  '2': '900 – 1,200',
  '2.5': '1,200 – 1,500',
  '3': '1,500 – 1,800',
  '3.5': '1,800 – 2,100',
  '4': '2,100 – 2,400',
  '5': '2,400 – 3,000',
}

export function getSqftRange(value: string, unit: string): string | null {
  const u = unit.toLowerCase()
  if (u.includes('sq')) return `${value} ${unit}`
  if (u === 'ton' || u === 'tons') return TON_TO_SQFT[value.trim()] ?? null
  if (u === 'btu' || u === 'btuh') {
    const tons = (parseInt(value.replace(/[^0-9]/g, '')) / 12000).toFixed(1)
    return TON_TO_SQFT[tons] ?? null
  }
  return null
}
