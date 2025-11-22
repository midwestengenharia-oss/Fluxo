// Design Tokens - Sistema de Design Padronizado do Fluxo

// Cores mapeadas estaticamente para o Tailwind funcionar corretamente
export const colorMap = {
  rose: {
    bg: 'bg-rose-50',
    bgSolid: 'bg-rose-500',
    bgLight: 'bg-rose-100',
    text: 'text-rose-600',
    textDark: 'text-rose-700',
    border: 'border-rose-500',
    borderLight: 'border-rose-200',
    ring: 'ring-rose-500',
    shadow: 'shadow-rose-500/20',
  },
  orange: {
    bg: 'bg-orange-50',
    bgSolid: 'bg-orange-500',
    bgLight: 'bg-orange-100',
    text: 'text-orange-600',
    textDark: 'text-orange-700',
    border: 'border-orange-500',
    borderLight: 'border-orange-200',
    ring: 'ring-orange-500',
    shadow: 'shadow-orange-500/20',
  },
  amber: {
    bg: 'bg-amber-50',
    bgSolid: 'bg-amber-500',
    bgLight: 'bg-amber-100',
    text: 'text-amber-600',
    textDark: 'text-amber-700',
    border: 'border-amber-500',
    borderLight: 'border-amber-200',
    ring: 'ring-amber-500',
    shadow: 'shadow-amber-500/20',
  },
  yellow: {
    bg: 'bg-yellow-50',
    bgSolid: 'bg-yellow-500',
    bgLight: 'bg-yellow-100',
    text: 'text-yellow-600',
    textDark: 'text-yellow-700',
    border: 'border-yellow-500',
    borderLight: 'border-yellow-200',
    ring: 'ring-yellow-500',
    shadow: 'shadow-yellow-500/20',
  },
  lime: {
    bg: 'bg-lime-50',
    bgSolid: 'bg-lime-500',
    bgLight: 'bg-lime-100',
    text: 'text-lime-600',
    textDark: 'text-lime-700',
    border: 'border-lime-500',
    borderLight: 'border-lime-200',
    ring: 'ring-lime-500',
    shadow: 'shadow-lime-500/20',
  },
  emerald: {
    bg: 'bg-emerald-50',
    bgSolid: 'bg-emerald-500',
    bgLight: 'bg-emerald-100',
    text: 'text-emerald-600',
    textDark: 'text-emerald-700',
    border: 'border-emerald-500',
    borderLight: 'border-emerald-200',
    ring: 'ring-emerald-500',
    shadow: 'shadow-emerald-500/20',
  },
  teal: {
    bg: 'bg-teal-50',
    bgSolid: 'bg-teal-500',
    bgLight: 'bg-teal-100',
    text: 'text-teal-600',
    textDark: 'text-teal-700',
    border: 'border-teal-500',
    borderLight: 'border-teal-200',
    ring: 'ring-teal-500',
    shadow: 'shadow-teal-500/20',
  },
  cyan: {
    bg: 'bg-cyan-50',
    bgSolid: 'bg-cyan-500',
    bgLight: 'bg-cyan-100',
    text: 'text-cyan-600',
    textDark: 'text-cyan-700',
    border: 'border-cyan-500',
    borderLight: 'border-cyan-200',
    ring: 'ring-cyan-500',
    shadow: 'shadow-cyan-500/20',
  },
  sky: {
    bg: 'bg-sky-50',
    bgSolid: 'bg-sky-500',
    bgLight: 'bg-sky-100',
    text: 'text-sky-600',
    textDark: 'text-sky-700',
    border: 'border-sky-500',
    borderLight: 'border-sky-200',
    ring: 'ring-sky-500',
    shadow: 'shadow-sky-500/20',
  },
  blue: {
    bg: 'bg-blue-50',
    bgSolid: 'bg-blue-500',
    bgLight: 'bg-blue-100',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    border: 'border-blue-500',
    borderLight: 'border-blue-200',
    ring: 'ring-blue-500',
    shadow: 'shadow-blue-500/20',
  },
  indigo: {
    bg: 'bg-indigo-50',
    bgSolid: 'bg-indigo-500',
    bgLight: 'bg-indigo-100',
    text: 'text-indigo-600',
    textDark: 'text-indigo-700',
    border: 'border-indigo-500',
    borderLight: 'border-indigo-200',
    ring: 'ring-indigo-500',
    shadow: 'shadow-indigo-500/20',
  },
  violet: {
    bg: 'bg-violet-50',
    bgSolid: 'bg-violet-500',
    bgLight: 'bg-violet-100',
    text: 'text-violet-600',
    textDark: 'text-violet-700',
    border: 'border-violet-500',
    borderLight: 'border-violet-200',
    ring: 'ring-violet-500',
    shadow: 'shadow-violet-500/20',
  },
  purple: {
    bg: 'bg-purple-50',
    bgSolid: 'bg-purple-500',
    bgLight: 'bg-purple-100',
    text: 'text-purple-600',
    textDark: 'text-purple-700',
    border: 'border-purple-500',
    borderLight: 'border-purple-200',
    ring: 'ring-purple-500',
    shadow: 'shadow-purple-500/20',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50',
    bgSolid: 'bg-fuchsia-500',
    bgLight: 'bg-fuchsia-100',
    text: 'text-fuchsia-600',
    textDark: 'text-fuchsia-700',
    border: 'border-fuchsia-500',
    borderLight: 'border-fuchsia-200',
    ring: 'ring-fuchsia-500',
    shadow: 'shadow-fuchsia-500/20',
  },
  pink: {
    bg: 'bg-pink-50',
    bgSolid: 'bg-pink-500',
    bgLight: 'bg-pink-100',
    text: 'text-pink-600',
    textDark: 'text-pink-700',
    border: 'border-pink-500',
    borderLight: 'border-pink-200',
    ring: 'ring-pink-500',
    shadow: 'shadow-pink-500/20',
  },
  slate: {
    bg: 'bg-slate-50',
    bgSolid: 'bg-slate-500',
    bgLight: 'bg-slate-100',
    text: 'text-slate-600',
    textDark: 'text-slate-700',
    border: 'border-slate-500',
    borderLight: 'border-slate-200',
    ring: 'ring-slate-500',
    shadow: 'shadow-slate-500/20',
  },
} as const;

export type ColorName = keyof typeof colorMap;

// Helper para obter classes de cor
export const getColorClasses = (color: string) => {
  return colorMap[color as ColorName] || colorMap.slate;
};

// Cores por tipo de transação
export const transactionTypeColors = {
  income: {
    bg: 'bg-emerald-50',
    bgSolid: 'bg-emerald-500',
    bgLight: 'bg-emerald-100',
    text: 'text-emerald-600',
    textDark: 'text-emerald-700',
    border: 'border-emerald-500',
    label: 'Entrada',
  },
  expense: {
    bg: 'bg-rose-50',
    bgSolid: 'bg-rose-500',
    bgLight: 'bg-rose-100',
    text: 'text-rose-600',
    textDark: 'text-rose-700',
    border: 'border-rose-500',
    label: 'Saída',
  },
  daily: {
    bg: 'bg-amber-50',
    bgSolid: 'bg-amber-500',
    bgLight: 'bg-amber-100',
    text: 'text-amber-600',
    textDark: 'text-amber-700',
    border: 'border-amber-500',
    label: 'Diário',
  },
  economy: {
    bg: 'bg-blue-50',
    bgSolid: 'bg-blue-500',
    bgLight: 'bg-blue-100',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    border: 'border-blue-500',
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
    primary: 'shadow-lg shadow-indigo-500/20',
    danger: 'shadow-lg shadow-rose-500/20',
    success: 'shadow-lg shadow-emerald-500/20',
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
