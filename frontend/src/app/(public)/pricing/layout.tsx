import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Senarai Harga',
  description: 'Lihat pakej langganan atau bayaran sekali gus (one-off) untuk Sistem Pengurusan Tiket Imat.my yang berprestasi tinggi.',
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
