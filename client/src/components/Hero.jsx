import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles, Upload, WheatOff } from 'lucide-react';

export default function Hero({ onNavigate }) {
  return (
    <section className="overflow-hidden bg-[linear-gradient(135deg,#F7FAF8_0%,#FFFFFF_45%,#ECFDF5_100%)]">
      <div className="page-shell grid min-h-[650px] items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm">
            <WheatOff size={17} />
            EasyOCR, règles et explication IA prudente
          </div>
          <h1 className="mt-7 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Analysez les ingrédients. Détectez les risques liés au gluten.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            GlutiSafe aide à vérifier rapidement les ingrédients visibles d’un produit grâce à EasyOCR, des règles
            de détection et une explication IA prudente.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => onNavigate('analyse')}
              className="primary-btn inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-black"
            >
              Commencer l’analyse
              <ArrowRight size={19} />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('analyse')}
              className="secondary-btn inline-flex min-h-14 items-center justify-center rounded-full px-6 text-base font-black"
            >
              Saisie manuelle
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="glass-card rounded-3xl p-5 sm:p-7"
        >
          <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/80 p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Upload size={24} />
              </div>
              <div>
                <p className="font-black text-slate-950">Importer une image</p>
                <p className="text-sm text-slate-500">Ingrédients visibles, photo nette</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-700">Résultat de l’analyse</p>
                <h2 className="mt-1 text-2xl font-black text-emerald-900">Aucun gluten détecté</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-900/70">
                  Aucun mot surveillé lié au gluten n’a été détecté dans le texte analysé.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {['riz', 'maïs', 'huile de tournesol', 'sel'].map((word) => (
              <span key={word} className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-sm font-bold text-slate-600">
                {word}
              </span>
            ))}
          </div>

          <div className="mt-5 rounded-3xl border border-slate-100 bg-white/82 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
              <Sparkles className="text-emerald-600" size={18} />
              Explication IA
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Cela ne garantit pas une certification sans gluten. Vérifiez toujours l’étiquette officielle et les
              informations du fabricant.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
