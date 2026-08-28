import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductForm from './ProductForm'
import { Product, ProductVariant} from '@/types'

// Tipagem corrigida para Next.js 13+ (params devem ser esperados de forma assíncrona/estruturada)
interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Busca o produto específico com suas variações
  const { data: product, error } = await supabase
    .from('products')
    .select('*, categories(*), product_variants(*)')
    .eq('id', id)
    .single()

  if (error || !product || !product.is_active) {
    notFound() // Mostra a página 404 padrão se o produto não existir
  }

  const sortedVariants = (product.product_variants || []).sort(
    (a: ProductVariant, b: ProductVariant) => (a.display_order || 0) - (b.display_order || 0)
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-tertiary text-primary py-2 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="text-primary hover:text-secondary active:text-secondary/70 font-medium w-20">
            {"< Voltar"}
          </Link>
          <div className='flex w-100 justify-center'>
            <h1 className="text-xl font-medium my-2">Detalhes do Produto</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden md:flex">

          {/* Lado da Imagem */}
          <div className="w-full md:w-1/2 h-72 sm:h-96 md:h-auto relative bg-gray-50 flex-shrink-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Sem imagem
              </div>
            )}
          </div>

          {/* Lado das Informações e Formulário */}
          <div className="p-6 md:w-1/2 flex flex-col justify-between">
            <div>
              <span className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider block">
                {product.categories?.name}
              </span>
              <h2 className="text-2xl font-bold text-brand mb-4">{product.name}</h2>

              {product.description && (
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <div className="mt-4">
              <ProductForm
                product={product as Product}
                variants={sortedVariants}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}