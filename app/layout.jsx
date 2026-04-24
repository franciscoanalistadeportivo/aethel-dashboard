import './globals.css'

export const metadata = {
  title: 'Aethel — Panel',
  description: 'Gestión de citas y servicios para peluquerías',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
