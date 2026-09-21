export interface Money {
  amount: number
  currency: string
}

const CURRENCY_DIGITS: Record<string, number> = {
  XOF: 0,
  XAF: 0,
  XPF: 0,
  KMF: 0,
  GNF: 0,
  JPY: 0,
  BIF: 0,
  CLP: 0,
  MGA: 0,
  RWF: 0,
}

export function getMoneyDigits(currency: string): number {
  return CURRENCY_DIGITS[currency.toUpperCase()] ?? 2
}

export function formatMoney(
  amount: number,
  currency: string,
  options: { locale?: string; digits?: number } = {},
): string {
  const digits = options.digits ?? getMoneyDigits(currency)
  return new Intl.NumberFormat(options.locale ?? 'fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export function formatBytes(bytes: number, locale = 'fr-FR'): string {
  if (!Number.isFinite(bytes) || bytes < 0) return ''
  if (bytes === 0) return '0 o'
  const units = ['o', 'Ko', 'Mo', 'Go', 'To']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${new Intl.NumberFormat(locale).format(value)} ${units[index]}`
}