'use client'

import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="md:ml-56 p-6 min-h-screen">
        {children}
      </main>
    </>
  )
}
