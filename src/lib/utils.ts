import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm")
}

export function formatValueWithUnit(value: number, unit: string): string {
  const formattedValue = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
  
  // Se a unidade for R$, coloca antes do valor
  if (unit === 'R$') {
    return `R$ ${formattedValue}`;
  }
  
  // Para outras unidades (%, un, etc), coloca depois
  return `${formattedValue} ${unit}`;
}
