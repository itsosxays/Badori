import { Currency } from '../types';

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'RWF') {
    return `${Math.round(amount).toLocaleString('en-RW')} RWF`;
  }
  return `${Math.round(amount).toLocaleString('fr-DJ')} DJF`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function countryName(code: string): string {
  return code === 'RW' ? 'Rwanda' : 'Djibouti';
}

export function countryFlag(code: string): string {
  return code === 'RW' ? '🇷🇼' : '🇩🇯';
}

export function currencySymbol(currency: Currency): string {
  return currency === 'RWF' ? 'RWF' : 'DJF';
}
