export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatQuantity(quantity: number, unit: string): string {
  const formatted = unit === 'unit' ? quantity.toString() : quantity.toFixed(2)
  const unitLabel = unit === 'meter' ? 'm' : unit === 'centimeter' ? 'cm' : 'uds'
  return `${formatted} ${unitLabel}`
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
