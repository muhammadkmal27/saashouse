import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Senarai Harga',
  description: 'Lihat pakej langganan atau bayaran sekali gus (one-off) untuk pembinaan laman web dan sistem aplikasi oleh Imat.my.',
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
