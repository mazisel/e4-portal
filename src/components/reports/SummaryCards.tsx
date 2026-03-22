import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  income: number
  expense: number
  net: number
  extra?: { label: string; value: number }
}

export function SummaryCards({ income, expense, net, extra }: Props) {
  const cards = [
    {
      label: 'Toplam Gelir',
      value: income,
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Toplam Gider',
      value: expense,
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950',
    },
    {
      label: 'Net Kar/Zarar',
      value: net,
      icon: Wallet,
      color: net >= 0 ? 'text-green-600' : 'text-red-600',
      bg: net >= 0 ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950',
    },
    ...(extra
      ? [{
          label: extra.label,
          value: extra.value,
          icon: BarChart2,
          color: extra.value >= 0 ? 'text-blue-600' : 'text-red-600',
          bg: 'bg-blue-50 dark:bg-blue-950',
        }]
      : []),
  ]

  return (
    <div className={cn('grid gap-4', extra ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3')}>
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={cn('p-2 rounded-full', card.bg)}>
                  <Icon className={cn('w-4 h-4', card.color)} />
                </div>
              </div>
              <p className={cn('text-xl font-bold mt-2', card.color)}>
                {card.value >= 0 ? '' : '-'}{formatCurrency(Math.abs(card.value))}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
