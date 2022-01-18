import { RadioGroup } from '@headlessui/react'
import { Price } from '../adapters/subscriptions'

interface PriceSelectorProps {
  prices: Price[]
  selectedPriceId: string
  onSelectionChange: (priceId: string) => void
}

export default function PriceSelector(props: PriceSelectorProps) {
  const { prices, selectedPriceId, onSelectionChange } = props

  return (
    <RadioGroup
      className="my-4 space-y-3"
      value={selectedPriceId}
      onChange={onSelectionChange}
    >
      {prices.map(price => (
        <RadioGroup.Option key={price.id} value={price.id}>
          {({ checked }) => (
            <div
              className={[
                checked ? 'bg-gray-200' : 'border-opacity-10',
                'border-black border-4 px-3 py-3 rounded-md',
              ].join(' ')}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={[
                    'rounded-full w-5 h-5 border-4 ',
                    checked
                      ? 'border-primary bg-black'
                      : 'border-black border-opacity-10',
                  ].join(' ')}
                />
                {price.interval === 'year' && (
                  <span className="text-2xl line-through opacity-20">
                    ${price.amount / 0.4}
                  </span>
                )}
                <span className="text-2xl">${Math.round(price.amount)}</span>

                <span className="whitespace-nowrap">1 {price.interval}</span>
                {price.interval === 'year' && (
                  <span className="bg-primary px-2 py-1 text-sm rounded-full">
                    ${Math.round(price.amount / 12)}/month
                  </span>
                )}
              </div>
            </div>
          )}
        </RadioGroup.Option>
      ))}
    </RadioGroup>
  )
}
