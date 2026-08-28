'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { maskPhone, formatCurrency } from '@/lib/formatters'

interface OrderItem {
  id: string
  product_id: string
  variant_name: string
  quantity: number
  unit_price: number
}

interface Order {
  id: string
  short_id: string
  customer_name: string
  customer_phone: string
  child_name?: string
  observations?: string
  total_amount: number
  status: 'aguardando_pix' | 'pago' | 'em_producao' | 'entregue' | 'cancelado'
  created_at: string
  order_items: OrderItem[]
}

const STATUS_LABELS = {
  aguardando_pix: { label: 'Aguardando PIX', bg: 'bg-yellow-100 text-yellow-800' },
  pago: { label: 'Pago / Confirmado', bg: 'bg-blue-100 text-blue-800' },
  em_producao: { label: 'Em Produção', bg: 'bg-purple-100 text-purple-800' },
  entregue: { label: 'Entregue', bg: 'bg-green-100 text-green-800' },
  cancelado: { label: 'Cancelado', bg: 'bg-gray-100 text-gray-800' },
}

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list')

  async function fetchOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar pedidos:', error)
    } else {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  async function handleStatusChange(orderId: string, newStatus: Order['status']) {
    setUpdatingId(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      alert('Erro ao atualizar status do pedido.')
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
    }
    setUpdatingId(null)
  }

  // Gera o link direto do WhatsApp tratando o DDD e código do país
  function getWhatsAppLink(name:string, phone: string, orderShortId: string) {
    const cleanPhone = phone.replace(/\D/g, '')
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`
    const text = encodeURIComponent(`Olá, ${name}! Estou entrando em contato sobre o pedido ${orderShortId} da Pastoral.`)
    return `https://wa.me/${formattedPhone}?text=${text}`
  }

  // Consolida o total de itens por variação para a serigrafia/fornecedor
  const productionSummary = orders
    .filter((o) => o.status === 'pago' || o.status === 'em_producao')
    .flatMap((o) => o.order_items)
    .reduce((acc, item) => {
      const key = item.variant_name
      acc[key] = (acc[key] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-tertiary text-primary py-2 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <nav className="flex justify-around">
              <div className="flex gap-4 text-sm font-medium">

                <Link href="/admin" className="hover:text-secondary transition-colors">
                  Dashboard
                </Link>
                <Link href="/admin/produtos" className="hover:text-secondary transition-colors">
                  Produtos
                </Link>
                <Link href="/admin/pedidos" className="font-bold underline underline-offset-4">
                  Pedidos
                </Link>
              </div>

            </nav>
          </div>

          <div className="flex items-center gap-6 self-center sm:self-auto">
            <div className="flex gap-8">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary/50 hover:text-primary/60 transition-all duration-200 active:bg-primary/50 active:scale-95'
                  }`}
              >
                Lista de Encomendas
              </button>
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'summary' ? 'bg-primary text-white' : 'bg-white text-primary hover:bg-primary/50 hover:text-primary/60 transition-all duration-200 active:bg-primary/50 active:scale-95'
                  }`}
              >
                Resumo Produção
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Carregando pedidos...</div>
        ) : viewMode === 'summary' ? (
          /* Visão Consolidada para Serigrafia */
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Totais para Confecção (Pagos / Em Produção)</h2>
            <p className="text-sm text-gray-500 mb-6">Utilize estes totais para encomendar os tamanhos exatos com o fornecedor.</p>

            {Object.keys(productionSummary).length === 0 ? (
              <p className="text-gray-400">Nenhum pedido marcado como Pago ou Em Produção ainda.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(productionSummary).map(([variant, count]) => (
                  <div key={variant} className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                    <span className="text-sm font-semibold text-gray-500 block uppercase">{variant}</span>
                    <span className="text-3xl font-bold text-primary">{count} un</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Lista de Pedidos Individuais */
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white text-center py-12 rounded-xl shadow-sm border border-gray-200 text-gray-500">
                Nenhum pedido registrado até o momento.
              </div>
            ) : (
              orders.map((order) => (
                
                <div key={order.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3">
                    <div>
                      <span className="font-mono text-sm font-bold text-primary mr-3">{order.short_id}</span>
                      <strong className="text-gray-800 text-lg">{order.customer_name}</strong>
                      {order.child_name && <span className="text-sm text-gray-500 ml-2">(Criança: {order.child_name})</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer border-none ${STATUS_LABELS[order.status].bg
                          } ${updatingId === order.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <option value="aguardando_pix">Aguardando PIX</option>
                        <option value="pago">Pago / Confirmado</option>
                        <option value="em_producao">Em Produção</option>
                        <option value="entregue">Entregue</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 flex items-center gap-2">
                        <strong>Telefone:</strong> {maskPhone(order.customer_phone)}
                        <a
                          href={getWhatsAppLink(order.customer_name, order.customer_phone, order.short_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2.5 py-1 rounded font-medium hover:bg-green-200 transition-colors"
                        >
                          Abrir WhatsApp
                        </a>
                      </p>
                      
                      {order.observations && <p className="text-gray-600 mt-1"><strong>Obs:</strong> {order.observations}</p>}
                      <p className="text-gray-400 text-xs mt-2">
                        Data: {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs font-semibold text-gray-500 block mb-1">Itens:</span>
                      <ul className="space-y-1">
                        {order.order_items?.map((item) => (
                          <li key={item.id} className="flex justify-between text-xs text-gray-700">
                            <span>{item.quantity}x Opção: <strong>{item.variant_name}</strong></span>
                            <span className="font-medium">{formatCurrency(item.unit_price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm text-gray-800">
                        <span>Total do Pedido:</span>
                        <span className="text-primary">{formatCurrency(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}