import { DEFAULT_HEALTH_LEVELS, HealthLevel } from '../types';

// Converte string numérica em pt-BR/en-US para número ou null se inválido
export const parseLocaleNumber = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;

    // Ex.: 10.000,50
    const thousandPattern = /^\d{1,3}(\.\d{3})+(,\d+)?$/;
    if (thousandPattern.test(trimmed)) {
      const normalized = trimmed.replace(/\./g, '').replace(',', '.');
      const num = Number(normalized);
      return Number.isFinite(num) ? num : null;
    }

    // Ex.: 1000,5
    const normalized = trimmed.replace(',', '.');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const normalizeBoundary = (value: any, fallback: number) => {
  const parsed = parseLocaleNumber(value);
  return parsed === null ? fallback : parsed;
};

// Normaliza healthLevels para garantir que min/max sejam números ou null
export const normalizeHealthLevels = (levels: any[] | undefined | null) => {
  if (!Array.isArray(levels)) return DEFAULT_HEALTH_LEVELS;
  return levels.map(l => ({
    id: l.id || 'unknown',
    label: l.label || 'N/A',
    color: l.color || 'slate',
    min: parseLocaleNumber(l.min),
    max: parseLocaleNumber(l.max),
  })) as HealthLevel[];
};
