// src/app/api/cron/keep-alive/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: Request) {
  // Valida o segredo enviado automaticamente pela Vercel para segurança
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Não autorizado', { status: 401 })
  }

  try {
    const supabase = createClient()

    // Consulta simples de 1 registro para gerar atividade HTTP no Supabase
    const { error } = await supabase.from('categories').select('id').limit(1)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase pingado com sucesso!',
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}