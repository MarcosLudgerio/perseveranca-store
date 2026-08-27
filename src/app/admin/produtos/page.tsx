'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { uploadImageToCloudinary } from '@/lib/cloudinary'
import { Category, Product } from '@/types'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/formatters'

export default function AdminProductsPage() {
    const supabase = createClient()

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Estado para controlar se estamos editando um produto
    const [editingId, setEditingId] = useState<string | null>(null)

    // Campos do formulário
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

    const router = useRouter()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/admin/login')
    }

    // Variações (Tamanhos e Preços)
    const [variants, setVariants] = useState<{ id?: string; name: string; price: string }[]>([
        { name: 'Tamanho Único', price: '' },
    ])

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)

        const { data: catData, error: catError } = await supabase.from('categories').select('*').order('name')
        if (catError) console.error('Erro ao buscar categorias:', catError)
        if (catData) setCategories(catData)

        const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*, categories(*), product_variants(*)')
            .order('created_at', { ascending: false })

        if (prodError) console.error('Erro ao buscar produtos:', prodError)
        if (prodData) setProducts(prodData as Product[])

        setLoading(false)
    }

    function resetForm() {
        setEditingId(null)
        setName('')
        setDescription('')
        setCategoryId('')
        setImageFile(null)
        setCurrentImageUrl(null)
        setVariants([{ name: 'Tamanho Único', price: '' }])
    }

    function handleStartEdit(product: Product) {
        setEditingId(product.id)
        setName(product.name)
        setDescription(product.description || '')
        setCategoryId(product.category_id || '')
        setCurrentImageUrl(product.image_url || null)
        setImageFile(null)

        if (product.product_variants && product.product_variants.length > 0) {
            setVariants(
                product.product_variants.map((v) => ({
                    id: v.id,
                    name: v.name,
                    price: v.price.toString(),
                }))
            )
        } else {
            setVariants([{ name: 'Tamanho Único', price: '' }])
        }

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function handleAddVariant() {
        setVariants([...variants, { name: '', price: '' }])
    }

    function handleRemoveVariant(index: number) {
        setVariants(variants.filter((_, i) => i !== index))
    }

    function handleVariantChange(index: number, field: 'name' | 'price', value: string) {
        const updated = [...variants]
        updated[index][field] = value
        setVariants(updated)
    }

    async function toggleProductStatus(productId: string, currentStatus: boolean) {
        const newStatus = !currentStatus
        const { error } = await supabase
            .from('products')
            .update({ is_active: newStatus })
            .eq('id', productId)

        if (error) {
            alert('Erro ao alterar status do produto.')
        } else {
            setProducts((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, is_active: newStatus } : p))
            )
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!categoryId) return alert('Selecione uma categoria!')

        setSubmitting(true)

        try {
            let imageUrl = currentImageUrl

            // Upload da nova imagem se selecionada
            if (imageFile) {
                imageUrl = await uploadImageToCloudinary(imageFile)
            }

            if (editingId) {
                // --- ATUALIZAR PRODUTO EXISTENTE ---
                const { error: productError } = await supabase
                    .from('products')
                    .update({
                        name,
                        description,
                        category_id: categoryId,
                        image_url: imageUrl,
                    })
                    .eq('id', editingId)

                if (productError) throw productError

                // Recria/Atualiza as variações
                await supabase.from('product_variants').delete().eq('product_id', editingId)

                const variantsToInsert = variants.map((v, index) => ({
                    product_id: editingId,
                    name: v.name || 'Padrão',
                    price: parseFloat(v.price) || 0,
                    display_order: index + 1,
                }))

                const { error: variantError } = await supabase
                    .from('product_variants')
                    .insert(variantsToInsert)

                if (variantError) throw variantError

                alert('Produto atualizado com sucesso!')
            } else {
                // --- CRIAR NOVO PRODUTO ---
                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .insert({
                        name,
                        description,
                        category_id: categoryId,
                        image_url: imageUrl,
                        is_active: true,
                    })
                    .select()
                    .single()

                if (productError) throw productError

                const variantsToInsert = variants.map((v, index) => ({
                    product_id: productData.id,
                    name: v.name || 'Padrão',
                    price: parseFloat(v.price) || 0,
                    display_order: index + 1,
                }))

                const { error: variantError } = await supabase
                    .from('product_variants')
                    .insert(variantsToInsert)

                if (variantError) throw variantError

                alert('Produto cadastrado com sucesso!')
            }

            resetForm()
            loadData()
        } catch (err: any) {
            alert(`Erro ao salvar produto: ${err.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Cabeçalho de Navegação */}
            <header className="bg-tertiary text-primary py-4 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <nav className="flex gap-4 text-sm font-medium">
                            <Link href="/admin" className="hover:text-secondary transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/admin/produtos" className="font-bold underline underline-offset-4">
                                Produtos
                            </Link>
                            <Link href="/admin/pedidos" className="hover:text-secondary transition-colors">
                                Pedidos
                            </Link>
                        </nav>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm font-medium"
                    >
                        Sair
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
                {/* Formulário de Cadastro / Edição */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold font-besley text-primary">
                            {editingId ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                        </h2>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-xs text-gray-500 hover:text-gray-700 underline"
                            >
                                Cancelar Edição
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-lg text-brand mb-1">Nome do Produto</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-secondary outline-none"
                                    placeholder="Ex: Camisa Tradicional Azul"
                                />
                            </div>

                            <div>
                                <label className="block text-lg text-brand mb-1">Categoria</label>
                                <select
                                    required
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-secondary outline-none"
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-lg text-brand mb-1">Descrição</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-secondary outline-none"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-lg text-brand mb-1">Imagem do Produto</label>
                            {currentImageUrl && !imageFile && (
                                <div className="flex items-center gap-3 mb-2">
                                    <img src={currentImageUrl} alt="Atual" className="w-12 h-12 rounded object-cover border" />
                                    <span className="text-xs text-gray-500">Imagem atual mantida. Selecione uma nova abaixo para substituir.</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="w-full border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-secondary outline-none"
                            />
                        </div>

                        {/* Gerenciador de Variações (Tamanhos / Preços) */}
                        <div className="border-t border-secondary pt-4">
                            <h3 className="font-semibold text-brand mb-2">Tamanhos e Preços</h3>
                            {variants.map((v, idx) => (
                                <div key={idx} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Nome (ex: P, M, G, XG)"
                                        value={v.name}
                                        onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                                        className="border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-secondary outline-none flex-1"
                                        required
                                    />
                                    <div className="relative flex items-center">
                                        <span className="absolute left-3 text-gray-700 text-sm font-semibold">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={v.price}
                                            onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                                            className="border p-2 pl-9 rounded-lg text-gray-700 focus:ring-2 focus:ring-secondary outline-none w-32"
                                            required
                                        />
                                    </div>
                                    {variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveVariant(idx)}
                                            className="text-red-500 font-bold px-2 hover:bg-red-50 rounded"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddVariant}
                                className="text-sm text-heading font-medium mt-1 hover:underline"
                            >
                                + Adicionar outro tamanho/preço
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 bg-secondary hover:bg-[#727432] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50  active:bg-heading/50 active:scale-95"
                            >
                                {submitting ? 'Salvando...' : editingId ? 'Atualizar Produto' : 'Salvar Produto'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Lista de Produtos Cadastrados */}
                <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                    <h2 className="text-xl font-bold mb-4 text-primary">Produtos Cadastrados</h2>

                    {loading ? (
                        <p className="text-gray-500">Carregando...</p>
                    ) : products.length === 0 ? (
                        <p className="text-gray-500">Nenhum produto cadastrado ainda.</p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {products.map((p) => (
                                <div key={p.id} className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        {p.image_url ? (
                                            <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded border" />
                                        ) : (
                                            <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                                                Sem Foto
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-800">{p.name}</h4>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    {p.is_active ? 'Visível' : 'Oculto'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">Categoria: {p.categories?.name || 'Sem Categoria'}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {p.product_variants?.map((v) => (
                                                    <span key={v.id} className="bg-gray-100 text-xs px-2 py-0.5 rounded text-gray-600">
                                                        {v.name}: <strong>R$ {v.price.toFixed(2).replace('.', ',')}</strong>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0">
                                        <button
                                            onClick={() => handleStartEdit(p)}
                                            className="px-3 py-1.5 text-xs font-semibold rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => toggleProductStatus(p.id, p.is_active)}
                                            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${p.is_active
                                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                : 'border-green-200 text-green-600 hover:bg-green-50'
                                                }`}
                                        >
                                            {p.is_active ? 'Ocultar' : 'Reativar'}
                                        </button>
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