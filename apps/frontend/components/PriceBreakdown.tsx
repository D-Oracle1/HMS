'use client'

interface PriceBreakdownProps {
  basePrice: number
  nights: number
  taxRate?: number
  serviceFeeRate?: number
  discount?: number
  currency?: string
  showDetails?: boolean
}

export function PriceBreakdown({
  basePrice,
  nights,
  taxRate = 0.075, // 7.5% default tax
  serviceFeeRate = 0.05, // 5% default service fee
  discount = 0,
  currency = '₦',
  showDetails = true
}: PriceBreakdownProps) {
  const subtotal = basePrice * nights
  const discountAmount = discount > 0 ? subtotal * (discount / 100) : 0
  const subtotalAfterDiscount = subtotal - discountAmount
  const taxAmount = subtotalAfterDiscount * taxRate
  const serviceFee = subtotalAfterDiscount * serviceFeeRate
  const total = subtotalAfterDiscount + taxAmount + serviceFee

  const formatPrice = (amount: number) => {
    return `${currency}${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  if (!showDetails) {
    return (
      <div className="text-right">
        <div className="text-2xl font-bold text-slate-900">
          {formatPrice(total)}
        </div>
        <div className="text-sm text-slate-600">Total for {nights} night{nights > 1 ? 's' : ''}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Price Breakdown</h3>

      <div className="space-y-3">
        {/* Base Price */}
        <div className="flex justify-between text-slate-700">
          <span>
            {formatPrice(basePrice)} × {nights} night{nights > 1 ? 's' : ''}
          </span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Discount ({discount}%)
            </span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        {/* Subtotal after discount */}
        {discount > 0 && (
          <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-200">
            <span>Subtotal</span>
            <span>{formatPrice(subtotalAfterDiscount)}</span>
          </div>
        )}

        {/* Service Fee */}
        <div className="flex justify-between text-slate-600 text-sm">
          <span>Service fee ({serviceFeeRate * 100}%)</span>
          <span>{formatPrice(serviceFee)}</span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-slate-600 text-sm">
          <span>Taxes ({taxRate * 100}%)</span>
          <span>{formatPrice(taxAmount)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between text-lg font-bold text-slate-900 pt-4 border-t-2 border-slate-300">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {/* No Hidden Fees Badge */}
      <div className="flex items-center justify-center gap-2 pt-2 text-sm text-green-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">No hidden fees</span>
      </div>

      {/* Payment Info */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-slate-700">
        <p className="text-center">
          You won't be charged yet. Complete your booking to finalize payment.
        </p>
      </div>
    </div>
  )
}

// Compact version for cards
export function CompactPriceBreakdown({
  basePrice,
  nights,
  taxRate = 0.075,
  serviceFeeRate = 0.05,
  discount = 0,
  currency = '₦'
}: Omit<PriceBreakdownProps, 'showDetails'>) {
  const subtotal = basePrice * nights
  const discountAmount = discount > 0 ? subtotal * (discount / 100) : 0
  const subtotalAfterDiscount = subtotal - discountAmount
  const taxAmount = subtotalAfterDiscount * taxRate
  const serviceFee = subtotalAfterDiscount * serviceFeeRate
  const total = subtotalAfterDiscount + taxAmount + serviceFee

  const formatPrice = (amount: number) => {
    return `${currency}${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        {discount > 0 && (
          <span className="text-sm text-slate-500 line-through">
            {formatPrice(subtotal)}
          </span>
        )}
        <span className="text-xl font-bold text-slate-900">
          {formatPrice(total)}
        </span>
      </div>
      <div className="text-xs text-slate-600">
        Includes taxes & fees
      </div>
      {discount > 0 && (
        <div className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
          {discount}% OFF
        </div>
      )}
    </div>
  )
}
