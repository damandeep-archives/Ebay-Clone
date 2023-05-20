'use client'
import { ThirdwebProvider } from "@thirdweb-dev/react"
import network from "@/utils/network"
import './globals.css';

export default function RootLayout({
  children
}: {
  children: React.ReactNode

}) {
  return (
    <ThirdwebProvider activeChain={network}>
    <html lang="en">
      <body>{children}</body>
    </html>
    </ThirdwebProvider>
  )
}
