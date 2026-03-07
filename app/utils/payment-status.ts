export type PaymentStatus = 'paid' | 'pending' | 'partial' | 'refunded'

export const getPaymentStatusPillClass = (status?: string) => {
  switch (status as PaymentStatus) {
    case 'paid':
      return 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
    case 'partial':
      return 'bg-orange-500/10 text-orange-700 border-orange-300'
    case 'refunded':
      return 'bg-rose-500/10 text-rose-700 border-rose-300'
    case 'pending':
    default:
      return 'bg-amber-500/10 text-amber-700 border-amber-300'
  }
}

export const getPaymentStatusTextClass = (status?: string) => {
  switch (status as PaymentStatus) {
    case 'paid':
      return 'text-emerald-700'
    case 'partial':
      return 'text-orange-700'
    case 'refunded':
      return 'text-rose-700'
    case 'pending':
    default:
      return 'text-amber-700'
  }
}
