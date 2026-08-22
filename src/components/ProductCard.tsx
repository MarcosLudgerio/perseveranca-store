import Link from 'next/link'
import { Product } from '@/types'

interface ProductCardProps {
    product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
    // Vamos descobrir o menor preço entre as variações para exibir "A partir de R$ X"
    const prices = product.product_variants?.map((v) => v.price) || [0]
    const lowestPrice = Math.min(...prices)
    const isSingleVariant = product.product_variants?.length === 1

    return (
        <Link href={`/produto/${product.id}`} className="group flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Imagem do Produto */}
            <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sem imagem
                    </div>
                )}
            </div>

            {/* Informações do Produto */}
            <div className="p-2 flex flex-col flex-1">
                <span className="text-xs font-semibold text-secondary mb-1 uppercase tracking-wider">
                    {product.categories?.name || 'Geral'}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                    {product.name}
                </h3>

                <div className="mt-auto zz pt-4 flex items-center justify-between">
                    <div className="text-gray-600 font-bold">
                        {!isSingleVariant && <h6 className="text-xs text-gray-500 font-normal mr-1">A partir de</h6>}
                        R$ {lowestPrice.toFixed(2).replace('.', ',')}
                    </div>

                    <button className="bg-secondary text-white font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-[#727432] group-hover:text-white transition-colors shadow-sm">
                        Detalhes
                    </button>
                </div>
            </div>
        </Link>
    )
}