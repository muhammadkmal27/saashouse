import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description: 'Hubungi pasukan jurutera Imat.my untuk bantuan teknikal dan pertanyaan jualan dalam masa 2 jam.',
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
