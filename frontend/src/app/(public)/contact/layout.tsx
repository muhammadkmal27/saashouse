import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description: 'Hubungi pakar pembangunan laman web Imat.my untuk berbincang tentang projek perniagaan atau aplikasi web anda dalam masa 2 jam.',
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
