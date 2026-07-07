import type { Metadata } from 'next'
import GenderPickerClient from './GenderPickerClient'

export const metadata: Metadata = {
  title: 'BlushBite — Companion Portal',
  description: 'A private companion platform. Choose your community to continue.',
  robots: { index: false, follow: false },
}

export default function RootPage() {
  return <GenderPickerClient />
}
