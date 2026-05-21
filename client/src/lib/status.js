import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert } from 'lucide-react';

export const statusStyles = {
  CONTAINS_GLUTEN: {
    icon: ShieldAlert,
    label: 'Contient du gluten',
    tone: 'À éviter',
    card: 'border-red-200 bg-red-50 text-red-800',
    badge: 'border-red-200 bg-red-50 text-red-700',
    soft: 'bg-red-100 text-red-700',
    accent: '#dc2626',
  },
  POSSIBLE_RISK: {
    icon: AlertTriangle,
    label: 'Risque possible',
    tone: 'À vérifier',
    card: 'border-amber-200 bg-amber-50 text-amber-800',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    soft: 'bg-amber-100 text-amber-700',
    accent: '#d97706',
  },
  NO_GLUTEN_DETECTED: {
    icon: CheckCircle2,
    label: 'Aucun gluten détecté',
    tone: 'Aucun mot surveillé',
    card: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    soft: 'bg-emerald-100 text-emerald-700',
    accent: '#008f45',
  },
  INSUFFICIENT_INFO: {
    icon: HelpCircle,
    label: 'Information insuffisante',
    tone: 'Texte incomplet',
    card: 'border-slate-200 bg-slate-50 text-slate-700',
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
    soft: 'bg-slate-100 text-slate-700',
    accent: '#64748b',
  },
};

export function confidenceLabel(confidence) {
  return {
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
  }[confidence] || 'Moyenne';
}

export function getStatusStyle(status) {
  return statusStyles[status] || statusStyles.INSUFFICIENT_INFO;
}
