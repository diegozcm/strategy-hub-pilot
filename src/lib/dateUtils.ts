import { parseISO } from 'date-fns';

// Constante para o timezone brasileiro (Brasília)
export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Parseia uma data ISO string de forma segura, evitando problemas de timezone.
 * Usa parseISO do date-fns que interpreta a data corretamente.
 */
export function parseLocalDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Formata uma data/hora para exibição no horário de Brasília (UTC-3).
 * @param date - Date object ou string ISO
 * @param options - Opções adicionais de formatação (Intl.DateTimeFormatOptions)
 * @returns String formatada no horário de Brasília
 */
export function formatDateTimeBrazil(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return dateObj.toLocaleString('pt-BR', defaultOptions);
}

/**
 * Formata apenas a data (sem hora) no fuso horário de Brasília.
 * @param date - Date object ou string ISO
 * @param options - Opções adicionais de formatação
 * @returns String formatada (apenas data)
 */
export function formatDateBrazil(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: BRAZIL_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  
  return dateObj.toLocaleDateString('pt-BR', defaultOptions);
}

/**
 * Formata apenas a hora no fuso horário de Brasília.
 * @param date - Date object ou string ISO
 * @param options - Opções adicionais de formatação
 * @returns String formatada (apenas hora)
 */
export function formatTimeBrazil(
  date: Date | string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return dateObj.toLocaleTimeString('pt-BR', defaultOptions);
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