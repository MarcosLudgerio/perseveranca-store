'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

  useEffect(() => {
    fetchOrders()
  }, [])

  async function handleStatusChange(orderId: string, newStatus: Order['status']) {
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
  }

  // Consolida o total de itens por tamanho para a serigrafia/fornecedor
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
      <header className="bg-primary text-white py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/produtos" className="text-pink-100 hover:text-white text-sm font-medium">
              ← Cadastrar Produtos
            </Link>
            <h1 className="text-xl font-bold">Gestão de Pedidos</h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-primary' : 'bg-primary-hover text-white'
              }`}
            >
              Lista de Encomendas
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'summary' ? 'bg-white text-primary' : 'bg-primary-hover text-white'
              }`}
            >
              Resumo Produção
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
            <h2 className="text-xl font-bold text-brandText mb-2">Totais para Confecção (Pedidos Pagos/Em Produção)</h2>
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
                      <strong className="text-brandText text-lg">{order.customer_name}</strong>
                      {order.child_name && <span className="text-sm text-gray-500 ml-2">(Criança: {order.child_name})</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer ${STATUS_LABELS[order.status].bg}`}
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
                      <p className="text-gray-600"><strong>Telefone:</strong> {order.customer_phone}</p>
                      {order.observations && <p className="text-gray-600"><strong>Obs:</strong> {order.observations}</p>}
                      <p className="text-gray-400 text-xs mt-1">
                        Data: {new Date(order.created_at).toLocaleDateString('pt-BR')} às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-xs font-semibold text-gray-500 block mb-1">Itens:</span>
                      <ul className="space-y-1">
                        {order.order_items?.map((item) => (
                          <li key={item.id} className="flex justify-between text-xs text-gray-700">
                            <span>{item.quantity}x Opção: <strong>{item.variant_name}</strong></span>
                            <span className="font-medium">R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm text-brandText">
                        <span>Total do Pedido:</span>
                        <span className="text-primary">R$ {order.total_amount.toFixed(2).replace('.', ',')}</span>
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