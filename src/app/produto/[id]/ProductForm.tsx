'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product, ProductVariant } from '@/types'
import { useCartStore } from '@/store/cartStore'

interface ProductFormProps {
  product: Product
  variants: ProductVariant[]
}

export default function ProductForm({ product, variants }: ProductFormProps) {
  const router = useRouter()
  const addItem = useCartStore((state) => state.addItem)

 // Seleciona a primeira variação por padrão
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0])
  const [quantity, setQuantity] = useState(1)

  function handleAddToCart(e: React.MouseEvent<HTMLButtonElement>) {
    const variantToUse = selectedVariant
    if (!selectedVariant) return

    try {
      addItem({
        id: `${product.id}-${variantToUse.id}`,
        productId: product.id,
        productName: product.name,
        variantName: variantToUse.name,
        price: variantToUse.price,
        quantity: quantity,
        imageUrl: product.image_url,
      })

      // Redirecionamento 100% garantido para navegadores móveis
      if (typeof window !== 'undefined') {
        window.location.href = '/carrinho'
      } else {
        router.push('/carrinho')
      }
    } catch (err) {
      console.error('Erro ao adicionar ao carrinho:', err)
      alert('Ocorreu um erro ao adicionar o produto. Tente novamente.')
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="text-3xl font-bold text-brand mb-6">
          R$ {selectedVariant?.price.toFixed(2).replace('.', ',')}
        </div>

        {/* Seleção de Variação (Tamanho) */}
        {variants.length > 1 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Opções disponíveis:</h3>
            <div className="flex flex-wrap gap-3">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariant(variant)}
                  className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors cursor-pointer ${selectedVariant?.id === variant.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-300 text-gray-700 hover:border-primary bg-white'
                    }`}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Seleção de Quantidade */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Quantidade:</h3>
          <div className="flex items-center border text-black border-gray-300 rounded-md w-max">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2  text-gray-600  hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
            >
              -
            </button>
            <span className="px-4 py-2 font-medium text-center w-12 select-none">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full bg-secondary hover:bg-[#727432] active:bg-[#61632a] text-white font-bold py-3.5 px-4 rounded-lg transition-colors shadow-sm text-lg cursor-pointer block text-center"
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </div>

  )
}