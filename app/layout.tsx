import type { Metadata } from 'next'
import { Instrument_Serif, DM_Sans } from 'next/font/google'
import './globals.css'

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'StreetSnipe — NYC Rental Monitor',
  description: 'Get alerted the moment a rental matching your criteria hits StreetEasy.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-[#FAF7F2] font-sans text-[#2C2420]">{children}</body>
    </html>
  )
}
