import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardNav from './_nav'

export default async function DashboardLayout({ children }) {
  const session = await getSession()
  if (!session?.negocio_id) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      <DashboardNav nombre={session.nombre} />
      <main className="flex-1 pb-20 md:pb-6 md:pl-64">{children}</main>
    </div>
  )
}
