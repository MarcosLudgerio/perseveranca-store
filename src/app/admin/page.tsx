'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PendingOrder {
  id: string
  short_id: string
  customer_name: string
  customer_phone: string
  total_amount: number
  created_at: string
}

export default function AdminDashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingPixCount: 0,
    productionCount: 0,
    totalRevenue: 0,
    activeProductsCount: 0,
  })
  const [recentPendingOrders, setRecentPendingOrders] = useState<PendingOrder[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    setLoading(true)

    try {
      // 1. Busca todos os pedidos para calcular estatísticas
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, short_id, customer_name, customer_phone, total_amount, status, created_at')
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // 2. Busca total de produtos ativos
      const { count: productsCount, error: productsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (productsError) throw productsError

      // Cálculos do Dashboard
      const pending = orders?.filter((o) => o.status === 'aguardando_pix') || []
      const inProduction = orders?.filter((o) => o.status === 'pago' || o.status === 'em_producao') || []
      const paidOrders = orders?.filter((o) => ['pago', 'em_producao', 'entregue'].includes(o.status)) || []

      const revenue = paidOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)

      setStats({
        pendingPixCount: pending.length,
        productionCount: inProduction.length,
        totalRevenue: revenue,
        activeProductsCount: productsCount || 0,
      })

      setRecentPendingOrders(pending.slice(0, 5))
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function getWhatsAppLink(phone: string, orderShortId: string) {
    const cleanPhone = phone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const text = encodeURIComponent(`Olá! Gostaria de falar sobre o seu pedido ${orderShortId}.`)
    return `https://wa.me/${formattedPhone}?text=${text}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-tertiary text-primary py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin" className="text-primary font-bold underline underline-offset-4">
              Dashboard
            </Link>
            <Link href="/admin/produtos" className="text-primary hover:text-secondary transition-colors">
              Produtos
            </Link>
            <Link href="/admin/pedidos" className="text-primary hover:text-secondary transition-colors">
              Pedidos
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-8">
        {/* Banner de Boas-Vindas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 font-besley">Visão Geral das Vendas</h2>
            <p className="text-sm text-gray-500">Acompanhe seus pedidos, faturamento e catálogo de produtos.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/pedidos"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Ver Pedidos
            </Link>
            <Link
              href="/admin/produtos"
              className="bg-heading hover:bg-heading/80  active:bg-heading/80  text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Gerenciar Produtos
            </Link>
          </div>
        </div>

        {/* Cards de Métricas */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando dados...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Aguardando PIX
              </span>
              <span className="text-3xl font-bold text-yellow-600 mt-1 block">
                {stats.pendingPixCount}
              </span>
              <span className="text-xs text-gray-500 mt-1 block">Pedidos necessitam confirmação</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Para Serigrafia
              </span>
              <span className="text-3xl font-bold text-purple-600 mt-1 block">
                {stats.productionCount}
              </span>
              <span className="text-xs text-gray-500 mt-1 block">Pagos ou Em Produção</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Total Confirmado
              </span>
              <span className="text-3xl font-bold text-green-600 mt-1 block">
                R$ {stats.totalRevenue.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-xs text-gray-500 mt-1 block">Soma dos pedidos pagos</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                Produtos Ativos
              </span>
              <span className="text-3xl font-bold text-primary mt-1 block">
                {stats.activeProductsCount}
              </span>
              <span className="text-xs text-gray-500 mt-1 block">Disponíveis na loja pública</span>
            </div>
          </div>
        )}

        {/* Lista de Pedidos que Exigem Atenção (Pendentes de PIX) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Aguardando PIX (Atenção Prioritária)</h3>
            <Link href="/admin/pedidos" className="text-xs text-primary hover:underline font-semibold">
              Ver todos os pedidos →
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Carregando...</p>
          ) : recentPendingOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">Nenhum pedido pendente de confirmação no momento!</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPendingOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary mr-2">{order.short_id}</span>
                    <strong className="text-gray-800">{order.customer_name}</strong>
                    <span className="text-gray-400 text-xs ml-2">
                      ({new Date(order.created_at).toLocaleDateString('pt-BR')})
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-700">
                      R$ {Number(order.total_amount).toFixed(2).replace('.', ',')}
                    </span>
                    <a
                      href={getWhatsAppLink(order.customer_phone, order.short_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-100 text-green-800 hover:bg-green-200 px-2.5 py-1 rounded font-medium transition-colors"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}