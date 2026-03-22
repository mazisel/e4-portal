'use client'

import { CategoryReport } from '@/types'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null
  const { name, value } = payload[0]
  return (
    <div className="bg-background border rounded-lg p-3 shadow text-sm">
      <p className="font-medium">{name}</p>
      <p>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)}</p>
    </div>
  )
}

interface Props {
  data: CategoryReport[]
  title: string
}

export function CategoryPieChart({ data, title }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Bu dönemde {title.toLowerCase()} verisi yok
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.category_name,
    value: d.total,
    color: d.category_color,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          outerRadius={90}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
