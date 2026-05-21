import { Info } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-slate-700">
      <div className="flex gap-3">
        <Info className="mt-0.5 shrink-0 text-emerald-700" size={18} />
        <p>
          GlutiSafe ne garantit pas qu’un produit est 100% sans gluten. L’application aide à analyser les ingrédients
          visibles. Vérifiez toujours les mentions officielles du fabricant.
        </p>
      </div>
    </div>
  );
}
