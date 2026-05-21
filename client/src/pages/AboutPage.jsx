import { AlertCircle, Brain, ClipboardCheck, ScanText } from 'lucide-react';
import Disclaimer from '../components/Disclaimer.jsx';

export default function AboutPage({ onNavigate }) {
  return (
    <section className="page-shell py-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">À propos</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950">
            GlutiSafe aide à lire les ingrédients avec plus de clarté.
          </h1>
          <p className="mt-5 text-base leading-8 text-slate-600">
            La plateforme analyse le texte visible d’une liste d’ingrédients pour repérer les termes directement liés au
            gluten ou les mentions qui demandent une vérification plus attentive.
          </p>
          <button type="button" onClick={() => onNavigate('analyse')} className="primary-btn mt-7 rounded-full px-6 py-3 font-black">
            Analyser un produit
          </button>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Comment ça marche</h2>
            <div className="mt-6 grid gap-4">
              {[
                [ScanText, 'EasyOCR extrait le texte', 'Le service OCR Python extrait le texte visible avec EasyOCR.'],
                [ClipboardCheck, 'Les règles détectent les mots à risque', 'Le moteur de règles détecte les mots liés au gluten et les termes ambigus.'],
                [Brain, 'L’IA explique le résultat', 'L’IA explique le verdict en français, sans le modifier.'],
              ].map(([Icon, title, copy]) => (
                <div key={title} className="flex gap-4 rounded-2xl bg-slate-50 p-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-3">
              <AlertCircle className="mt-1 shrink-0 text-amber-700" size={22} />
              <div>
                <h2 className="text-xl font-black text-amber-900">Limites MVP</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900/80">
                  <li>Aucun diagnostic médical.</li>
                  <li>Aucune certification officielle sans gluten.</li>
                  <li>L’OCR peut faire des erreurs.</li>
                  <li>L’utilisateur doit vérifier l’étiquette du produit.</li>
                </ul>
              </div>
            </div>
          </div>

          <Disclaimer />
        </div>
      </div>
    </section>
  );
}
