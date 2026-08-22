import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string // Vamos usar uma combinação de productId + variantName
  productId: string
  productName: string
  variantName: string
  price: number
  quantity: number
  imageUrl?: string | null
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        set((state) => {
          // Verifica se o item (mesmo produto e mesmo tamanho) já está no carrinho
          const existingItemIndex = state.items.findIndex((item) => item.id === newItem.id)
          
          if (existingItemIndex >= 0) {
            // Se já existe, apenas aumenta a quantidade
            const updatedItems = [...state.items]
            updatedItems[existingItemIndex].quantity += newItem.quantity
            return { items: updatedItems }
          }
          
          // Se não existe, adiciona novo
          return { items: [...state.items, newItem] }
        })
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },
      
      updateQuantity: (id, quantity) => {
        set((state) => ({
          items: state.items.map((item) => 
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        }))
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'pastoral-cart-storage', // Nome da chave no localStorage
    }
  )
)