import { parseISO } from 'date-fns';

/**
 * Parseia uma data ISO string de forma segura, evitando problemas de timezone.
 * Usa parseISO do date-fns que interpreta a data corretamente.
 */
export function parseLocalDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Converte uma data para o formato correto do banco de dados.
 * String vazia ou undefined vira null, caso contrário mantém o valor.
 */
export function formatDateForDatabase(date: string | null | undefined): string | null {
  if (!date || date.trim() === '') {
    return null;
  }
  return date;
}

/**
 * Processa um objeto removendo campos de data vazios e convertendo-os para null.
 */
export function processDateFields<T extends Record<string, any>>(
  data: T,
  dateFields: (keyof T)[] = []
): T {
  const processed = { ...data };
  
  dateFields.forEach(field => {
    if (field in processed) {
      processed[field] = formatDateForDatabase(processed[field] as string) as T[keyof T];
    }
  });
  
  return processed;
}