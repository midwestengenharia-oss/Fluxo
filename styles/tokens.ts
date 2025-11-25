// Design Tokens - Sistema de Design Padronizado do Fluxo

// Cores mapeadas estaticamente para o Tailwind funcionar corretamente
// TODAS as cores agora usam tons -600 ou -700 para máxima visibilidade
export const colorMap = {
  rose: {
    bg: 'bg-rose-50',
    bgSolid: 'bg-rose-600',
    bgLight: 'bg-rose-100',
    text: 'text-rose-600',
    textDark: 'text-rose-700',
    border: 'border-rose-600',
    borderLight: 'border-rose-200',
    ring: 'ring-rose-600',
    shadow: 'shadow-rose-600/20',
  },
  orange: {
    bg: 'bg-orange-50',
    bgSolid: 'bg-orange-700',
    bgLight: 'bg-orange-100',
    text: 'text-orange-700',
    textDark: 'text-orange-800',
    border: 'border-orange-700',
    borderLight: 'border-orange-200',
    ring: 'ring-orange-700',
    shadow: 'shadow-orange-700/20',
  },
  amber: {
    bg: 'bg-amber-50',
    bgSolid: 'bg-amber-700',
    bgLight: 'bg-amber-100',
    text: 'text-amber-800',
    textDark: 'text-amber-900',
    border: 'border-amber-700',
    borderLight: 'border-amber-200',
    ring: 'ring-amber-700',
    shadow: 'shadow-amber-700/20',
  },
  yellow: {
    bg: 'bg-yellow-50',
    bgSolid: 'bg-yellow-700',
    bgLight: 'bg-yellow-100',
    text: 'text-yellow-700',
    textDark: 'text-yellow-800',
    border: 'border-yellow-700',
    borderLight: 'border-yellow-200',
    ring: 'ring-yellow-700',
    shadow: 'shadow-yellow-700/20',
  },
  lime: {
    bg: 'bg-lime-50',
    bgSolid: 'bg-lime-700',
    bgLight: 'bg-lime-100',
    text: 'text-lime-700',
    textDark: 'text-lime-800',
    border: 'border-lime-700',
    borderLight: 'border-lime-200',
    ring: 'ring-lime-700',
    shadow: 'shadow-lime-700/20',
  },
  emerald: {
    bg: 'bg-emerald-50',
    bgSolid: 'bg-emerald-700',
    bgLight: 'bg-emerald-100',
    text: 'text-emerald-700',
    textDark: 'text-emerald-800',
    border: 'border-emerald-700',
    borderLight: 'border-emerald-200',
    ring: 'ring-emerald-700',
    shadow: 'shadow-emerald-700/20',
  },
  teal: {
    bg: 'bg-teal-50',
    bgSolid: 'bg-teal-700',
    bgLight: 'bg-teal-100',
    text: 'text-teal-700',
    textDark: 'text-teal-800',
    border: 'border-teal-700',
    borderLight: 'border-teal-200',
    ring: 'ring-teal-700',
    shadow: 'shadow-teal-700/20',
  },
  cyan: {
    bg: 'bg-cyan-50',
    bgSolid: 'bg-cyan-700',
    bgLight: 'bg-cyan-100',
    text: 'text-cyan-700',
    textDark: 'text-cyan-800',
    border: 'border-cyan-700',
    borderLight: 'border-cyan-200',
    ring: 'ring-cyan-700',
    shadow: 'shadow-cyan-700/20',
  },
  sky: {
    bg: 'bg-sky-50',
    bgSolid: 'bg-sky-700',
    bgLight: 'bg-sky-100',
    text: 'text-sky-700',
    textDark: 'text-sky-800',
    border: 'border-sky-700',
    borderLight: 'border-sky-200',
    ring: 'ring-sky-700',
    shadow: 'shadow-sky-700/20',
  },
  blue: {
    bg: 'bg-blue-50',
    bgSolid: 'bg-blue-600',
    bgLight: 'bg-blue-100',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    border: 'border-blue-600',
    borderLight: 'border-blue-200',
    ring: 'ring-blue-600',
    shadow: 'shadow-blue-600/20',
  },
  indigo: {
    bg: 'bg-indigo-50',
    bgSolid: 'bg-indigo-600',
    bgLight: 'bg-indigo-100',
    text: 'text-indigo-600',
    textDark: 'text-indigo-700',
    border: 'border-indigo-600',
    borderLight: 'border-indigo-200',
    ring: 'ring-indigo-600',
    shadow: 'shadow-indigo-600/20',
  },
  violet: {
    bg: 'bg-violet-50',
    bgSolid: 'bg-violet-600',
    bgLight: 'bg-violet-100',
    text: 'text-violet-600',
    textDark: 'text-violet-700',
    border: 'border-violet-600',
    borderLight: 'border-violet-200',
    ring: 'ring-violet-600',
    shadow: 'shadow-violet-600/20',
  },
  purple: {
    bg: 'bg-purple-50',
    bgSolid: 'bg-purple-600',
    bgLight: 'bg-purple-100',
    text: 'text-purple-600',
    textDark: 'text-purple-700',
    border: 'border-purple-600',
    borderLight: 'border-purple-200',
    ring: 'ring-purple-600',
    shadow: 'shadow-purple-600/20',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50',
    bgSolid: 'bg-fuchsia-600',
    bgLight: 'bg-fuchsia-100',
    text: 'text-fuchsia-600',
    textDark: 'text-fuchsia-700',
    border: 'border-fuchsia-600',
    borderLight: 'border-fuchsia-200',
    ring: 'ring-fuchsia-600',
    shadow: 'shadow-fuchsia-600/20',
  },
  pink: {
    bg: 'bg-pink-50',
    bgSolid: 'bg-pink-600',
    bgLight: 'bg-pink-100',
    text: 'text-pink-600',
    textDark: 'text-pink-700',
    border: 'border-pink-600',
    borderLight: 'border-pink-200',
    ring: 'ring-pink-600',
    shadow: 'shadow-pink-600/20',
  },
  slate: {
    bg: 'bg-slate-50',
    bgSolid: 'bg-slate-700',
    bgLight: 'bg-slate-100',
    text: 'text-slate-700',
    textDark: 'text-slate-800',
    border: 'border-slate-700',
    borderLight: 'border-slate-200',
    ring: 'ring-slate-700',
    shadow: 'shadow-slate-700/20',
  },
} as const;

export type ColorName = keyof typeof colorMap;

// Helper para obter classes de cor
export const getColorClasses = (color: string) => {
  return colorMap[color as ColorName] || colorMap.slate;
};

// Cores por tipo de transação - ATUALIZADAS para tons consistentes
export const transactionTypeColors = {
  income: {
    bg: 'bg-emerald-50',
    bgSolid: 'bg-emerald-700',
    bgLight: 'bg-emerald-100',
    text: 'text-emerald-700',
    textDark: 'text-emerald-800',
    border: 'border-emerald-700',
    label: 'Entrada',
  },
  expense: {
    bg: 'bg-rose-50',
    bgSolid: 'bg-rose-600',
    bgLight: 'bg-rose-100',
    text: 'text-rose-600',
    textDark: 'text-rose-700',
    border: 'border-rose-600',
    label: 'Saída',
  },
  daily: {
    bg: 'bg-amber-50',
    bgSolid: 'bg-amber-700',
    bgLight: 'bg-amber-100',
    text: 'text-amber-800',
    textDark: 'text-amber-900',
    border: 'border-amber-700',
    label: 'Diário',
  },
  economy: {
    bg: 'bg-blue-50',
    bgSolid: 'bg-blue-600',
    bgLight: 'bg-blue-100',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    border: 'border-blue-600',
    label: 'Economia',
  },
} as const;

// Design Tokens padronizados
export const tokens = {
  // Border Radius
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    card: 'shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]',
    cardHover: 'shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]',
    primary: 'shadow-lg shadow-indigo-600/20',
    danger: 'shadow-lg shadow-rose-600/20',
    success: 'shadow-lg shadow-emerald-700/20',
  },

  // Spacing
  spacing: {
    card: 'p-6',
    cardLg: 'p-8',
    section: 'space-y-6',
    sectionLg: 'space-y-8',
  },

  // Typography
  text: {
    label: 'text-xs font-bold text-slate-400 uppercase tracking-wider',
    title: 'text-xl font-bold text-slate-800',
    titleLg: 'text-2xl font-bold text-slate-800',
    subtitle: 'text-sm text-slate-500',
    body: 'text-sm text-slate-600',
    mono: 'font-mono tracking-tight',
  },

  // Transitions
  transition: {
    fast: 'transition-all duration-150',
    normal: 'transition-all duration-200',
    slow: 'transition-all duration-300',
  },

  // Animation
  animation: {
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in fade-in slide-in-from-bottom-4 duration-300',
    scaleIn: 'animate-in fade-in zoom-in-95 duration-200',
  },
} as const;

export default tokens;
