import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portfolio Imat.my',
  description: 'Lihat hasil kerja dan portfolio sistem laman web berkelajuan tinggi yang dibina oleh Imat.my.',
}

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
