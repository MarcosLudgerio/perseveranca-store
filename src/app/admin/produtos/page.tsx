'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadImageToCloudinary } from '@/lib/cloudinary'
import { Category, Product } from '@/types'

export default function AdminProductsPage() {
    const supabase = createClient()

    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Campos do formulário
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)

    // Variações (Tamanhos e Preços)
    const [variants, setVariants] = useState<{ name: string; price: string }[]>([
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!categoryId) return alert('Selecione uma categoria!')

        setSubmitting(true)

        try {
            let imageUrl = null

            // 1. Upload da Imagem para o Cloudinary (se selecionada)
            if (imageFile) {
                imageUrl = await uploadImageToCloudinary(imageFile)
            }

            // 2. Insere o Produto no Supabase
            const { data: productData, error: productError } = await supabase
                .from('products')
                .insert({
                    name,
                    description,
                    category_id: categoryId,
                    image_url: imageUrl,
                })
                .select()
                .single()

            if (productError) throw productError

            // 3. Insere as Variações vinculadas ao Produto
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

            // Limpa formulário e recarrega lista
            setName('')
            setDescription('')
            setImageFile(null)
            setVariants([{ name: 'Tamanho Único', price: '' }])
            alert('Produto cadastrado com sucesso!')
            loadData()
        } catch (err: any) {
            alert(`Erro ao salvar produto: ${err.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Formulário de Cadastro */}
                <div className="bg-white bg p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold font-besley text-center text-primary mb-4 text-gray-800">Cadastrar Novo Produto</h2>

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
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-lg text-brand  mb-1">Descrição</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border p-2 rounded-lg text-gray-700 rounded focus:ring-2 focus:ring-secondary outline-none"
                                rows={2}
                            />
                        </div>

                        <div>
                            <label className="block text-lg text-brand mb-1">Imagem do Produto</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                className="w-full border p-2 rounded-lg text-gray-700 rounded focus:ring-2 focus:ring-secondary outline-none"
                            />
                        </div>

                        {/* Gerenciador de Variações (Tamanhos / Preços) */}
                        <div className="border-t border-secondary pt-4 ">
                            <h3 className="font-semibold text-brand mb-2">Tamanhos e Preços</h3>
                            {variants.map((v, idx) => (
                                <div key={idx} className="flex gap-2 mb-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Nome (ex: P, M, G, XG)"
                                        value={v.name}
                                        onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                                        className="border p-2 rounded-lg text-gray-700 rounded focus:ring-2 focus:ring-secondary outline-none flex-1"
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Preço (R$)"
                                        value={v.price}
                                        onChange={(e) => handleVariantChange(idx, 'price', e.target.value)}
                                        className="border p-2 rounded-lg text-gray-700 rounded focus:ring-2 focus:ring-secondary outline-none w-16"
                                        required
                                    />
                                    {variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveVariant(idx)}
                                            className="text-red-500 font-bold"
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

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-secondary hover:bg-[#727432] text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-4"
                        >
                            {submitting ? 'Salvando...' : 'Salvar Produto'}

                        </button>
                    </form>
                </div>

                {/* Lista de Produtos Cadastrados */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4 text-primary">Produtos Cadastrados</h2>

                    {loading ? (
                        <p>Carregando...</p>
                    ) : products.length === 0 ? (
                        <p className="text-gray-500">Nenhum produto cadastrado ainda.</p>
                    ) : (
                        <div className="divide-y">
                            {products.map((p) => (
                                <div key={p.id} className="py-4 flex gap-4 items-center">
                                    {p.image_url && (
                                        <img src={p.image_url} alt={p.name} className="w-16 h-16 object-cover rounded" />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="font-bold">{p.name}</h4>
                                        <p className="text-xs text-gray-500">Categoria: {p.categories?.name}</p>
                                        <div className="flex gap-2 mt-1">
                                            {p.product_variants?.map((v) => (
                                                <span key={v.id} className="bg-gray-100 text-xs px-2 py-1 rounded">
                                                    {v.name}: R$ {v.price.toFixed(2)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}