import { FinanceGuard } from '@/components/FinanceGuard'

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <FinanceGuard>{children}</FinanceGuard>
}
