import { createClient } from '@/lib/supabase/server'
import Image from 'next/image';
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'

// Força a página a sempre buscar dados novos (não usar cache estático antigo)
export const revalidate = 0

export default async function Home() {
  const supabase = await createClient()

  // Busca produtos ativos, junto com suas categorias e variações
  const { data: products, error } = await supabase
    .from('products')
    .select('*, categories(*), product_variants(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar produtos da vitrine:', error)
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Cabeçalho Público */}
      <header className="bg-[#F7F7F7] rounded-b-3xl text-white py-6 shadow-md" >
        <div className="flex flex-column justify-center px-4 sm:px-6 lg:px-8">
          <Image
            src="/logo-oficial.png"
            alt="Logo Perseverança Store"
            width={127}
            height={123}
            style={{ width: 'auto', height: 'auto' }}
          />
          <div className='ml-4'>
            <h1 className="text-2xl my-6 font-bold font-besley text-primary uppercase">Perseverança Store</h1>
            <p className="text-sm mt-1 font-bold text-secondary font-sans">Produtos que levam nossa missão para além da Pastoral. </p>
          </div>
        </div>
      </header>

      {/* Corpo da Vitrine */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as Product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-brand mb-2">Nenhum produto disponível no momento</h2>
            <p className="text-gray-500">Volte mais tarde para conferir nossas novidades!</p>
          </div>
        )}
      </main>

      {/* Rodapé */}
      <footer className="bg-[#F7F7F7]  shadow-3xl text-gray-900 py-8 px-4 rounded-t-3xl">
        <div
          className="max-w-7xl mx-auto  flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className='p-4 flex justify-between items-start text-center'>
            <Image
              src="/logo-paroquia-dark.jpeg"
              alt="Logo Perseverança Store"
              width={80}
              height={80}
              style={{ width: 'auto', height: 'auto' }}

            />
            <div className='ml-8 text-start flex flex-col justify-center gap-3'>
              <h2 className="text-lg font-bold">Paróquia Santo Antônio do Menino Deus</h2>
              <p className="text-sm">Rua Rejane Freire Correia, n. 2015, João Pessoa, PB, Brazil</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="block items-center">
              <a href="https://www.instagram.com/psamdpb" target="_blank" className="flex items-center gap-2 hover:text-yellow-800 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M7.75 2C4.678 2 2 4.678 2 7.75v8.5C2 19.322 4.678 22 7.75 22h8.5C19.322 22 22 19.322 22 16.25v-8.5C22 4.678 19.322 2 16.25 2h-8.5zm0 2h8.5C18.216 4 20 5.784 20 7.75v8.5c0 1.966-1.784 3.75-3.75 3.75h-8.5C5.784 20 4 18.216 4 16.25v-8.5C4 5.784 5.784 4 7.75 4zm8.75 1.5a.75.75 0 100 1.5.75.75 0 000-1.5zM12 7a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z" />
                </svg>
                <span className="text-sm">Instagram</span>
              </a>
            </div>

            <a href="https://wa.me/558335780953" target="_blank"
              className="flex items-center gap-2 hover:text-yellow-800 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M20.52 3.48A11.79 11.79 0 0012.01 0C5.38 0 .02 5.36.02 11.99c0 2.11.55 4.17 1.6 5.99L0 24l6.2-1.62a11.9 11.9 0 005.8 1.48h.01c6.63 0 11.99-5.36 11.99-11.99 0-3.2-1.25-6.21-3.48-8.39zM12.01 21.5h-.01a9.44 9.44 0 01-4.81-1.32l-.34-.2-3.68.96.98-3.59-.22-.37a9.4 9.4 0 01-1.45-5c0-5.21 4.24-9.45 9.45-9.45 2.52 0 4.89.98 6.67 2.77a9.38 9.38 0 012.77 6.67c0 5.21-4.24 9.45-9.45 9.45zm5.18-7.07c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.17.19-.33.21-.61.07-.28-.14-1.17-.43-2.23-1.36-.82-.73-1.37-1.63-1.53-1.91-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.17.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.46-.47-.64-.48h-.55c-.19 0-.5.07-.76.36-.26.28-1 1-1 2.44s1.02 2.83 1.16 3.03c.14.19 2 3.05 4.84 4.28.68.29 1.21.46 1.62.59.68.22 1.29.19 1.78.12.54-.08 1.66-.68 1.9-1.33.23-.64.23-1.19.16-1.33-.07-.14-.26-.21-.54-.36z" />
              </svg>
              <span className="text-sm">(83) 3578-0953</span>
            </a>

            <a href="https://www.facebook.com/psamdpb" target="_blank" className="flex items-center gap-2 hover:text-yellow-800 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M22 12a10 10 0 10-11.63 9.87v-6.99H7.9v-2.88h2.47V9.41c0-2.44 1.45-3.79 3.68-3.79 1.07 0 2.18.19 2.18.19v2.4h-1.23c-1.21 0-1.59.75-1.59 1.52v1.83h2.71l-.43 2.88h-2.28v6.99A10 10 0 0022 12z" />
              </svg>
              <span className="text-sm">Facebook</span>
            </a>

          </div>

        </div>

        <div className="mt-6 border-t border-yellow-700 pt-4 text-center text-sm">
          &copy; 2026 <strong>Pastoral da Perseverança.</strong> Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}