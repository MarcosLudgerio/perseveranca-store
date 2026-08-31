// src/lib/formatters.ts

// Formata valores numéricos para Moeda Brasileira (R$ 0,00)
export function formatCurrency(value: number | string): string {
  const numberValue = typeof value === 'string' ? parseFloat(value) || 0 : value
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numberValue)
}

// Máscara dinâmica de telefone brasileiro: (83) 99999-9999 ou (83) 3333-3333
export function maskPhone(value: string): string {
  if (!value) return '';

  // ALTERAÇÃO: limita diretamente a 11 dígitos
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}