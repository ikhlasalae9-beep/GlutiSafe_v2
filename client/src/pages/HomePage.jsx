import { ArrowRight, ChevronDown, ScanLine } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const asset = (path) => `/assets/landing/${path}`;

const icons = {
  scan: asset('icons/scan.svg'),
  warning: asset('icons/gluten-warning.svg'),
  check: asset('icons/safe-check.svg'),
  ingredients: asset('icons/ingredients.svg'),
  shield: asset('icons/shield.svg'),
  fast: asset('icons/fast-result.svg'),
  wheat: asset('icons/wheat-crossed.svg'),
  ocr: asset('icons/ocr.svg'),
};

const benefits = [
  {
    title: 'Scan des ingrédients',
    text: "Prenez une photo de l'étiquette et laissez GlutiSafe extraire le texte automatiquement.",
    icon: icons.scan,
  },
  {
    title: 'Détection des risques',
    text: "L'application identifie les ingrédients pouvant contenir du gluten ou nécessiter une attention.",
    icon: icons.warning,
  },
  {
    title: 'Résultat clair',
    text: 'Obtenez une réponse simple, rapide et facile à comprendre.',
    icon: icons.check,
  },
];

const steps = [
  {
    title: 'Scannez',
    text: 'Prenez une photo claire de la liste des ingrédients.',
    icon: icons.scan,
  },
  {
    title: 'Analysez',
    text: 'GlutiSafe extrait le texte et vérifie les ingrédients à risque.',
    icon: icons.ocr,
  },
  {
    title: 'Décidez',
    text: 'Consultez un résultat clair pour faire un choix plus sûr.',
    icon: icons.shield,
  },
];

const features = [
  {
    title: 'OCR intelligent',
    text: 'Extraction automatique du texte depuis les étiquettes alimentaires.',
    icon: icons.ocr,
  },
  {
    title: 'Analyse gluten',
    text: 'Détection des ingrédients liés au gluten et des termes à risque.',
    icon: icons.wheat,
  },
  {
    title: 'Résultat rapide',
    text: 'Une réponse claire en quelques secondes.',
    icon: icons.fast,
  },
  {
    title: 'Interface intuitive',
    text: 'Une expérience simple, fluide et facile à utiliser.',
    icon: icons.check,
  },
  {
    title: 'Aide à la décision',
    text: 'Un support pratique pour mieux choisir vos produits alimentaires.',
    icon: icons.shield,
  },
  {
    title: 'Expérience mobile-first',
    text: 'Pensée pour scanner rapidement depuis un téléphone.',
    icon: icons.scan,
  },
];

const previewCards = [
  {
    label: 'Scanner',
    image: asset('mockups/app-scan-screen.svg'),
    alt: "Écran GlutiSafe de scan d'une étiquette",
  },
  {
    label: 'Analyser',
    image: asset('mockups/app-result-safe.svg'),
    alt: 'Écran GlutiSafe avec résultat sans gluten détecté',
  },
  {
    label: 'Comprendre',
    image: asset('mockups/app-result-risk.svg'),
    alt: 'Écran GlutiSafe avec risque gluten détecté',
  },
];

const faqs = [
  {
    question: "Qu'est-ce que GlutiSafe ?",
    answer:
      "GlutiSafe est une application qui vous aide à scanner les ingrédients d'un produit alimentaire et à détecter les risques liés au gluten.",
  },
  {
    question: 'Est-ce que GlutiSafe remplace un avis médical ?',
    answer:
      "Non. GlutiSafe est un outil d'aide à la décision. En cas de maladie cœliaque, d'allergie ou de doute médical, il faut toujours consulter un professionnel de santé.",
  },
  {
    question: "Comment l'application détecte le gluten ?",
    answer:
      "L'application extrait le texte des ingrédients avec l'OCR, puis analyse les ingrédients pour identifier les éléments pouvant contenir du gluten ou présenter un risque.",
  },
  {
    question: 'Est-ce que le résultat est immédiat ?',
    answer: "Oui, l'objectif est de fournir un résultat clair et rapide en quelques secondes après le scan.",
  },
  {
    question: "Est-ce que je peux scanner n'importe quel produit ?",
    answer: "Oui, tant que la liste des ingrédients est visible et lisible sur l'emballage.",
  },
  {
    question: 'Que signifie "risque détecté" ?',
    answer:
      "Cela signifie qu'un ingrédient peut contenir du gluten ou qu'il nécessite une attention particulière avant consommation.",
  },
  {
    question: 'Est-ce que GlutiSafe fonctionne avec plusieurs langues ?',
    answer:
      "Oui, l'application peut analyser des ingrédients dans plusieurs langues selon la qualité du texte extrait et les règles d'analyse disponibles.",
  },
];

export default function HomePage() {
  return (
    <div className="landing-page">
      <HeroSection />
      <BenefitSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PreviewSection />
      <FaqSection />
      <FinalCtaSection />
      <LandingFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section id="accueil" className="landing-hero page-shell">
      <img
        className="landing-hero__lines"
        src={asset('backgrounds/organic-lines.svg')}
        alt=""
        aria-hidden="true"
      />
      <div className="landing-hero__copy">
        <p className="landing-badge">GlutiSafe • Analyse intelligente des ingrédients</p>
        <h1>Mangez sans gluten en toute confiance.</h1>
        <p className="landing-lead">
          Scannez les ingrédients, détectez les risques liés au gluten et faites des choix alimentaires plus sûrs en
          quelques secondes.
        </p>
        <div className="landing-actions">
          <Link to="/analyse" className="landing-btn landing-btn--primary">
            <ScanLine className="h-5 w-5" aria-hidden="true" />
            Scanner maintenant
          </Link>
          <a href="#comment-ca-marche" className="landing-btn landing-btn--secondary">
            Voir comment ça marche
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
        <div className="hero-microcards" aria-label="Avantages rapides">
          {['Scan rapide', 'Détection gluten', 'Résultat clair'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <div className="hero-visual" aria-label="Aperçu visuel GlutiSafe">
        <img className="hero-visual__shape" src={asset('backgrounds/hero-bg-shape.svg')} alt="" aria-hidden="true" />
        <img
          className="hero-visual__phone"
          src={asset('mockups/phone-mockup-glutisafe.svg')}
          alt="Mockup mobile de l'application GlutiSafe"
        />
        <span className="scan-beam" aria-hidden="true" />
        <img
          className="hero-visual__woman"
          src={asset('characters/moroccan-woman-scan.png')}
          alt="Jeune femme marocaine consultant une étiquette alimentaire"
        />
        <FloatingIcon className="float-icon--scan" src={icons.scan} alt="Icone scan" />
        <FloatingIcon className="float-icon--warning" src={icons.warning} alt="Icône alerte gluten" />
        <FloatingIcon className="float-icon--check" src={icons.check} alt="Icône résultat sûr" />
        <FloatingIcon className="float-icon--shield" src={icons.shield} alt="Icône protection" />
      </div>
    </section>
  );
}

function FloatingIcon({ className, src, alt }) {
  return (
    <span className={`floating-icon ${className}`}>
      <img src={src} alt={alt} />
    </span>
  );
}

function BenefitSection() {
  return (
    <section className="landing-section page-shell" aria-labelledby="benefits-title">
      <div className="section-heading">
        <p className="landing-kicker">Confiance au quotidien</p>
        <h2 id="benefits-title">Une vérification claire avant chaque choix.</h2>
      </div>
      <div className="benefit-grid">
        {benefits.map((item) => (
          <InfoCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className="landing-section landing-section--split page-shell">
      <div>
        <div className="section-heading section-heading--left">
          <p className="landing-kicker">Comment ça marche</p>
          <h2>Comment ça marche ?</h2>
          <p>Un parcours simple en trois étapes pour vérifier vos produits avant de les consommer.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-card__number">0{index + 1}</span>
              <img src={step.icon} alt="" aria-hidden="true" />
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="process-visual">
        <img src={asset('backgrounds/soft-green-blobs.svg')} alt="" aria-hidden="true" />
        <img
          src={asset('illustrations/food-package-scan.svg')}
          alt="Illustration d'un emballage alimentaire scanné"
        />
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="fonctionnalites" className="landing-section landing-section--tint">
      <div className="page-shell">
        <div className="section-heading">
          <p className="landing-kicker">Fonctionnalités</p>
          <h2>Fonctionnalités principales</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <InfoCard key={feature.title} {...feature} compact />
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewSection() {
  return (
    <section className="landing-section preview-section page-shell" aria-labelledby="preview-title">
      <div className="section-heading section-heading--left">
        <p className="landing-kicker">Aperçu app</p>
        <h2 id="preview-title">Du scan au résultat, en quelques secondes.</h2>
      </div>
      <div className="preview-layout">
        <div className="preview-cards">
          {previewCards.map((card) => (
            <article className="preview-card" key={card.label}>
              <span>{card.label}</span>
              <img src={card.image} alt={card.alt} />
            </article>
          ))}
        </div>
        <div className="preview-character">
          <img
            src={asset('characters/moroccan-man-product.png')}
            alt="Jeune homme marocain vérifiant une étiquette alimentaire"
          />
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="questions" className="landing-section faq-section page-shell">
      <div className="faq-visual">
        <img src={asset('illustrations/gluten-free-badge.svg')} alt="Badge gluten safe" />
      </div>
      <div>
        <div className="section-heading section-heading--left">
          <p className="landing-kicker">Questions</p>
          <h2>Questions fréquentes</h2>
        </div>
        <div className="faq-list">
          {faqs.map((item, index) => {
            const isOpen = active === index;
            return (
              <article className={`faq-item ${isOpen ? 'is-open' : ''}`} key={item.question}>
                <button
                  type="button"
                  onClick={() => setActive(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span>{item.question}</span>
                  <ChevronDown className="h-5 w-5" aria-hidden="true" />
                </button>
                <div id={`faq-answer-${index}`} className="faq-item__answer">
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="landing-section page-shell">
      <div className="final-cta">
        <img className="final-cta__blob" src={asset('backgrounds/soft-green-blobs.svg')} alt="" aria-hidden="true" />
        <div className="final-cta__copy">
          <p className="landing-kicker">Passez à l'action</p>
          <h2>Prêt à vérifier vos produits ?</h2>
          <p>Scannez. Vérifiez. Mangez en sécurité.</p>
          <Link to="/analyse" className="landing-btn landing-btn--primary">
            Lancer le scan
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>
        <div className="final-cta__visual">
          <img
            className="final-cta__family"
            src={asset('characters/moroccan-family-safe-food.png')}
            alt="Famille marocaine souriante avec un repas sain"
          />
          <img className="final-cta__meal" src={asset('illustrations/safe-meal.svg')} alt="Repas sûr et sain" />
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  const links = [
    ['Accueil', '#accueil'],
    ['Comment ça marche', '#comment-ca-marche'],
    ['Fonctionnalités', '#fonctionnalites'],
    ['Questions', '#questions'],
  ];

  return (
    <footer className="landing-footer">
      <div className="page-shell landing-footer__inner">
        <div>
          <a href="#accueil" className="landing-footer__brand" aria-label="Accueil GlutiSafe">
            <img src={asset('logo.png')} alt="Logo GlutiSafe" />
          </a>
          <p>
            GlutiSafe aide les utilisateurs à identifier les risques liés au gluten grâce à une expérience simple,
            rapide et intuitive.
          </p>
        </div>
        <nav aria-label="Navigation pied de page">
          {links.map(([label, href]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
        <span>© 2026 GlutiSafe. Tous droits réservés.</span>
      </div>
    </footer>
  );
}

function InfoCard({ title, text, icon, compact = false }) {
  return (
    <article className={`landing-card ${compact ? 'landing-card--compact' : ''}`}>
      <span className="landing-card__icon">
        <img src={icon} alt="" aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
