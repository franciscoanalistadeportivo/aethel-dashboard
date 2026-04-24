import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardNav from './_nav'

export default async function DashboardLayout({ children }) {
  const session = await getSession()
  if (!session?.negocio_id) redirect('/login')

  return (
    <div className="min-h-screen">
      <DashboardNav nombre={session.nombre} />
      <main className="pb-24 md:pb-6 md:pl-60">{children}</main>
    </div>
  )
}
