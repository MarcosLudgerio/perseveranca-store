export interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface ProductVariant {
  id?: string
  product_id?: string
  name: string
  price: number
  display_order: number
  stock: number
}

export interface Product {
  id: string
  category_id: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  categories?: Category
  product_variants?: ProductVariant[]
}