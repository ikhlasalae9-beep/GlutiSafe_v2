import { BookOpenCheck, Brain, ClipboardList, ScanLine } from 'lucide-react';
import Analyzer from '../components/Analyzer.jsx';
import FeatureCard from '../components/FeatureCard.jsx';
import Hero from '../components/Hero.jsx';

const features = [
  {
    title: 'Lecture automatique',
    icon: ScanLine,
    text: 'Lecture des ingrédients depuis une photo ou une image.',
  },
  {
    title: 'Détection du gluten',
    icon: ClipboardList,
    text: 'GlutiSafe repère les mots et expressions liés au gluten.',
  },
  {
    title: 'Explication détaillée',
    icon: Brain,
    text: 'Une explication claire accompagne le résultat sans remplacer un avis médical.',
  },
  {
    title: 'Historique local',
    icon: BookOpenCheck,
    text: 'Les analyses peuvent être sauvegardées localement pour consultation.',
  },
];

export default function Home({ onNavigate, latestResult, onResult }) {
  return (
    <>
      <Hero onNavigate={onNavigate} />

      <section className="section-band py-14">
        <div className="page-shell">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Fonctionnalités</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">Une analyse lisible, prudente et vérifiable.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} icon={feature.icon} title={feature.title}>
                {feature.text}
              </FeatureCard>
            ))}
          </div>
        </div>
      </section>

      <Analyzer latestResult={latestResult} onResult={onResult} onNavigate={onNavigate} />
    </>
  );
}
