'use client'

import type { SaleUnit } from '@/lib/types'

const unitLabels: Record<SaleUnit, string> = {
  unit: 'uds',
  meter: 'm',
  centimeter: 'cm',
}

interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  saleUnit: SaleUnit
  disabled?: boolean
  min?: number
  max?: number
}

export default function QuantityInput({
  value,
  onChange,
  saleUnit,
  disabled,
  min = 0,
  max,
}: QuantityInputProps) {
  const step = saleUnit === 'unit' ? 1 : 0.01

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === '') {
      onChange(0)
      return
    }
    let num = parseFloat(raw)
    if (!isNaN(num)) {
      if (saleUnit === 'unit') num = Math.floor(num)
      onChange(num)
    }
  }

  return (
    <div className="relative">
      <input
        type="number"
        value={value || ''}
        onChange={handleChange}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        className="w-full rounded-lg border border-border bg-bg-page px-3.5 py-2.5 pr-10 text-sm text-text-body outline-none ring-2 ring-transparent focus:ring-accent/40 focus:border-accent transition-colors disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
        {unitLabels[saleUnit]}
      </span>
    </div>
  )
}

export function formatQuantity(quantity: number, saleUnit: SaleUnit): string {
  const formatted = saleUnit === 'unit' ? quantity.toString() : quantity.toFixed(2)
  return `${formatted} ${unitLabels[saleUnit]}`
}
