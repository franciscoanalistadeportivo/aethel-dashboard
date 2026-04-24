import './globals.css'

export const metadata = {
  title: 'Aethel — Panel',
  description: 'Gestión de citas y servicios para peluquerías',
  // Evita que Google Translate reescriba el DOM de la app (causa hydration mismatches)
  other: { 'google': 'notranslate' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="dark notranslate" translate="no" suppressHydrationWarning={true}>
      <body className="min-h-screen" suppressHydrationWarning={true}>{children}</body>
    </html>
  )
}
