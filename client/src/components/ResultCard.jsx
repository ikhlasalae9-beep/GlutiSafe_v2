import { Bot, Edit3, Lock, RefreshCw, Save, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { confidenceLabel, getStatusStyle } from '../lib/status.js';
import RiskBadges from './RiskBadges.jsx';

export default function ResultCard({
  analysis,
  explanation,
  text,
  status,
  ingredients = [],
  onSave,
  saved,
  onNew,
  onHistory,
  onEditText,
  showAiExplanation = true,
  explanationLoading = false,
}) {
  const normalizedAnalysis = analysis || legacyAnalysis(status, ingredients);
  const style = getStatusStyle(normalizedAnalysis.status);
  const StatusIcon = style.icon;
  const detectedWords = normalizedAnalysis.detectedWords || [];
  const possibleWords = normalizedAnalysis.possibleWords || [];
  const safeClaims = normalizedAnalysis.safeClaims || [];

  return (
    <section className="surface-card overflow-hidden">
      <div className={`border-b px-5 py-5 sm:px-6 ${style.card}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <StatusIcon className="h-7 w-7" style={{ color: style.accent }} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-80">Résultat GlutiSafe</p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#1d252b] sm:text-3xl">{normalizedAnalysis.label || style.label}</h2>
              <p className="mt-2 text-sm font-semibold opacity-80">{style.tone}</p>
            </div>
          </div>
          <span className={`status-pill bg-white/80 ${style.badge}`}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Confiance {confidenceLabel(normalizedAnalysis.confidence)}
          </span>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        <div className="soft-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="brand-kicker">Éléments détectés</p>
              <h3 className="mt-1 text-xl font-extrabold text-[#1d252b]">Lecture des ingrédients</h3>
            </div>
          </div>
          <RiskBadges detectedWords={detectedWords} possibleWords={possibleWords} safeClaims={safeClaims} />
        </div>

        {text ? (
          <div className="soft-card p-5">
            <p className="brand-kicker">Ingrédients lus</p>
            <p className="mt-3 max-h-44 overflow-auto rounded-2xl bg-[#f7f8f6] p-4 text-sm leading-7 text-slate-600">{text}</p>
          </div>
        ) : null}

        {showAiExplanation ? (
          <div className="soft-card p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#f0f7f1] text-[#008f45]">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-extrabold text-[#1d252b]">Explication détaillée</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {explanationLoading ? 'Préparation de l’explication détaillée...' : explanation || normalizedAnalysis.message || 'Aucune explication disponible pour cette analyse.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[1.25rem] border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="absolute inset-x-5 top-5 space-y-3 opacity-45 blur-[2px]" aria-hidden="true">
              <div className="h-4 w-48 rounded-full bg-emerald-100" />
              <div className="h-3 w-full rounded-full bg-slate-100" />
              <div className="h-3 w-10/12 rounded-full bg-slate-100" />
              <div className="h-3 w-8/12 rounded-full bg-slate-100" />
            </div>
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#008f45] ring-1 ring-emerald-200">
                  <Lock className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#008f45] ring-1 ring-emerald-200">
                    Premium
                  </span>
                  <p className="mt-3 text-lg font-extrabold text-[#1d252b]">Explication détaillée réservée aux packs premium</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Cette explication vous aide à mieux comprendre les risques liés aux ingrédients. Elle est disponible avec le Pack Mensuel ou Annuel.
                  </p>
                </div>
              </div>
              <Link to="/packs" className="primary-btn shrink-0 justify-center">
                Voir les packs
              </Link>
            </div>
          </div>
        )}

        <p className="rounded-2xl border border-[#dfe8df] bg-[#f7f8f6] px-4 py-3 text-sm leading-6 text-slate-600">
          GlutiSafe aide à lire une étiquette, mais ne remplace pas la vérification de l'emballage officiel ni les informations du fabricant.
        </p>

        {(onSave || onNew || onHistory || onEditText) && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {onNew ? (
              <button type="button" onClick={onNew} className="primary-btn">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Nouvelle analyse
              </button>
            ) : null}
            {onEditText ? (
              <button type="button" onClick={onEditText} className="secondary-btn">
                <Edit3 className="h-4 w-4" aria-hidden="true" />
                Modifier le texte
              </button>
            ) : null}
            {onHistory ? (
              <button type="button" onClick={onHistory} className="ghost-btn">
                Voir l'historique
              </button>
            ) : null}
            {onSave ? (
              <button type="button" onClick={onSave} disabled={saved} className="ghost-btn">
                <Save className="h-4 w-4" aria-hidden="true" />
                {saved ? 'Analyse sauvegardée' : 'Sauvegarder'}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function legacyAnalysis(status, ingredients) {
  const isSafe = status === 'safe' || status === 'NO_GLUTEN_DETECTED';
  return {
    status: isSafe ? 'NO_GLUTEN_DETECTED' : 'CONTAINS_GLUTEN',
    label: isSafe ? 'Aucun gluten détecté' : 'Contient du gluten',
    detectedWords: isSafe ? [] : ingredients,
    possibleWords: [],
    safeClaims: [],
    confidence: 'medium',
    message: '',
  };
}
