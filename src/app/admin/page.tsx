'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-mono font-bold text-primary uppercase mb-6">
            Painel da Pastoral
          </h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-medium"
          >
            Sair
          </button>
        </div>

        <p className="text-gray-600">
          Bem-vindo ao painel administrativo. Em breve aqui estarão o gerenciamento de produtos e pedidos.
        </p>
      </div>
    </div>
  )
}