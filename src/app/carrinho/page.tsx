'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { createClient } from '@/lib/supabase/client'

export default function CartPage() {
  const supabase = createClient()
  const [isMounted, setIsMounted] = useState(false)
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore()
  
  // Formulário do Comprador
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [observation, setObservation] = useState('')
  
  // Estados do Pedido Criado
  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<{
    shortId: string
    total: number
  } | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const total = getTotal()

  async function handleFinalizeOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor, preencha seu nome e telefone.')
      return
    }

    setSubmitting(true)

    try {
      // 1. Gera um código curto único para o pedido (ex: PED-X8A2)
      const shortId = `PED-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      // 2. Salva o pedido na tabela 'orders'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          short_id: shortId,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          child_name: childName.trim() || null,
          observations: observation.trim() || null,
          total_amount: total,
          status: 'aguardando_pix',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 3. Salva os itens na tabela 'order_items'
      const itemsToInsert = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.productId,
        variant_name: item.variantName,
        quantity: item.quantity,
        unit_price: item.price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // 4. Limpa o carrinho e define o pedido concluído
      clearCart()
      setCompletedOrder({ shortId, total })
    } catch (err: any) {
      alert(`Erro ao salvar pedido: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenWhatsApp() {
    if (!completedOrder) return

    // ATENÇÃO: Insira o número real da Pastoral com DDD (ex: 5583999999999)
    console.log(process.env.NEXT_PUBLIC_PHONE_NUMBER)
    const pastoralPhone =  process.env.NEXT_PUBLIC_PHONE_NUMBER || '5588994885659'



    let message = `*NOVO PEDIDO: ${completedOrder.shortId}*%0A%0A`
    message += `*Responsável:* ${customerName}%0A`
    if (childName) message += `*Criança:* ${childName}%0A`
    message += `*Total:* R$ ${completedOrder.total.toFixed(2).replace('.', ',')}%0A%0A`
    message += `Olá! Fiz meu pedido pelo site e estou enviando o comprovante do PIX.`

    window.open(`https://wa.me/${pastoralPhone}?text=${message}`, '_blank')
  }

  // TELA DE SUCESSO E INSTRUÇÕES DE PIX
  if (completedOrder) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div>
            <h2 className="text-2xl font-bold text-secondary">Pedido Registrado!</h2>
            <p className="text-sm text-gray-500 mt-1">Código do pedido: <strong className="text-primary font-besley">{completedOrder.shortId}</strong></p>
          </div>

          {/* Dados do PIX */}
          <div className="bg-gray-50 p-4 rounded-lg border text-left space-y-2">
            <span className="text-xs font-semibold text-secondary uppercase block">Pagamento via PIX</span>
            <p className="text-sm text-gray-700"><strong>Chave PIX (E-mail):</strong> pastoral@email.com</p>
            <p className="text-sm text-gray-700"><strong>Valor Total:</strong> R$ {completedOrder.total.toFixed(2).replace('.', ',')}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Enviar Comprovante via WhatsApp
            </button>
            
            <Link href="/" className="block text-sm text-gray-500 hover:text-brand pt-2">
              Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // TELA DO CARRINHO E FORMULÁRIO
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-tertiary text-primary py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="hover:text-pink-200 font-medium">
            ← Continuar Comprando
          </Link>
          <h1 className="text-xl font-bold">Seu Carrinho</h1>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-tertiary rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-brand mb-4">Seu carrinho está vazio</h2>
            <Link href="/" className="bg-secondary text-white px-6 py-3 rounded-lg font-medium hover:bg-[#727432] transition-colors">
              Ir para a Vitrine
            </Link>
          </div>
        ) : (
          <form onSubmit={handleFinalizeOrder} className="flex flex-col md:flex-row gap-8">
            
            {/* Lista de Itens */}
            <div className="md:w-1/2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-xl font-bold text-brand border-b pb-3">Itens do Pedido</h2>
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm">{item.productName}</h3>
                    <p className="text-xs text-gray-500">Tamanho/Opção: {item.variantName}</p>
                    <div className="text-secondary font-bold text-sm mt-1">
                      {item.quantity}x R$ {item.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  <div className="flex items-center text-brand gap-2">
                    <div className="flex items-center border rounded">
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2 py-1 text-xs">-</button>
                      <span className="px-2 text-xs font-bold">{item.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2 py-1 text-xs">+</button>
                    </div>
                    <button type="button" onClick={() => removeItem(item.id)} className="text-xs text-red-700">✕</button>
                  </div>
                </div>
              ))}
              <div className="pt-2 flex justify-between font-bold text-lg text-brand border-t">
                <span>Total:</span>
                <span className="text-secondary">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* Identificação do Responsável */}
            <div className="md:w-1/2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-xl font-bold text-brand border-b pb-3">Dados para Encomenda</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full border p-2 rounded  text-black focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(83) 99999-9999"
                  className="w-full border p-2 rounded  text-black focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Criança (Opcional)</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Nome do filho(a) ou catequizando"
                  className="w-full border p-2  text-black rounded focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (Opcional)</label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: Turma da catequese, tamanho especial, etc."
                  rows={2}
                  className="w-full border p-2 text-black rounded focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-secondary hover:bg-[#727432] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-4"
              >
                {submitting ? 'Gerando Encomenda...' : 'Concluir e Ver PIX'}
              </button>
            </div>

          </form>
        )}
      </main>
    </div>
  )
}